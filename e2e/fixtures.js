// Shared end-to-end fixtures. Each test gets `app`: a freshly loaded page
// in a browser context that lives for the whole worker, so the ~32 MB of
// models download once and later tests read them from the HTTP cache - the
// same thing a returning visitor gets.
import { test as base, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { photoPath } from "./photos.js";

// Hosts the page may contact (the CSP's connect-src, plus script-src for
// MediaPipe's loader). Anything else is a privacy bug.
export const ALLOWED_HOSTS = ["cdn.jsdelivr.net", "storage.googleapis.com"];

// MediaPipe's WebAssembly writes its startup logs to console.error.
const EXPECTED_CONSOLE = [/Created TensorFlow Lite XNNPACK delegate/, /^INFO:/, /^W\d{4} /, /^I\d{4} /];

// context options a project may set (browser-level ones like `channel` can't
// be passed to newContext)
const CONTEXT_KEYS = ["viewport", "userAgent", "deviceScaleFactor", "isMobile", "hasTouch", "baseURL", "locale"];

export const test = base.extend({
  sharedContext: [
    async ({ browser }, use, workerInfo) => {
      const projectUse = workerInfo.project.use;
      const options = Object.fromEntries(CONTEXT_KEYS.filter((k) => k in projectUse).map((k) => [k, projectUse[k]]));
      const context = await browser.newContext({ ...options, permissions: ["clipboard-read", "clipboard-write"] });
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  app: async ({ sharedContext }, use) => {
    const page = await sharedContext.newPage();
    const log = { consoleErrors: [], pageErrors: [], requests: [] };
    page.on("console", (m) => {
      if (m.type() === "error" && !EXPECTED_CONSOLE.some((re) => re.test(m.text()))) log.consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => log.pageErrors.push(e.message));
    page.on("request", (r) => log.requests.push({ url: r.url(), method: r.method(), body: r.postDataBuffer() }));
    await page.goto("/");
    const app = new App(page, log);
    await use(app);
    await app.scratch?.close();
    await page.close();
  },
});

export { expect };

export class App {
  constructor(page, log) {
    this.page = page;
    this.log = log;
  }

  // Upload a photo from test-photos/ (by PHOTOS key) or a generated
  // {name, mimeType, buffer}, and wait until the analysis finishes.
  async analyze(photo) {
    const file = typeof photo === "string" ? photoPath(photo) : photo;
    await this.page.locator('input[type="file"]').setInputFiles(file);
    await this.waitForOutcome();
  }

  // done (results) or error (alert) - whichever comes first
  async waitForOutcome() {
    const results = this.page.locator("#results-heading");
    const error = this.page.locator(".callout--error[role=alert]");
    await expect(results.or(error)).toBeAttached({ timeout: 90_000 });
  }

  errorText() {
    return this.page.locator(".callout--error[role=alert]").textContent();
  }

  // The "Copy results summary" text: every category, confidence and key
  // number, exactly as a visitor would paste it.
  async summary() {
    // the clipboard only works for the focused tab, and variant() works in a
    // second one
    await this.page.bringToFront();
    await this.page.getByRole("button", { name: "Copy results summary" }).click();
    const status = this.page.locator(".copy-summary__status");
    const manual = this.page.locator(".copy-summary__manual textarea");
    await expect(status.filter({ hasText: "Copied" }).or(manual)).toBeVisible();
    const text = (await manual.isVisible())
      ? await manual.inputValue()
      : await this.page.evaluate(() => navigator.clipboard.readText());
    return parseSummary(text);
  }

  async startOver() {
    await this.page.getByRole("button", { name: /Analyze another photo/ }).click();
    await expect(this.page.locator('input[type="file"]')).toBeAttached();
  }

  // Everything the page fetched over the network since it loaded.
  networkRequests() {
    return this.log.requests.filter((r) => /^https?:/.test(r.url));
  }

  // Runs `transform` (a function's source, as a string) on a test photo
  // drawn to a canvas and returns the result as an upload.
  // transform(canvas, helpers) returns a canvas or a Blob. It runs in a
  // blank page next to the app: the app's own CSP (rightly) forbids
  // compiling code from strings.
  async variant(photo, transformSource, { name = "variant.png", type = "image/png", quality } = {}) {
    const base64 = readFileSync(photoPath(photo)).toString("base64");
    this.scratch ??= await this.page.context().newPage();
    const out = await this.scratch.evaluate(
      async ({ base64, transformSource, type, quality }) => {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes]), { imageOrientation: "from-image" });
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0);
        const helpers = {
          bitmap,
          // multiply linear-light RGB by gains (a lighting change)
          applyGains(c, [gr, gg, gb]) {
            const ctx = c.getContext("2d", { willReadFrequently: true });
            const d = ctx.getImageData(0, 0, c.width, c.height);
            const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
            const enc = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
            const lut = (g) => Uint8ClampedArray.from({ length: 256 }, (_, i) => Math.round(enc(Math.min(1, lin(i) * g))));
            const [r, g, b] = [lut(gr), lut(gg), lut(gb)];
            for (let i = 0; i < d.data.length; i += 4) {
              d.data[i] = r[d.data[i]];
              d.data[i + 1] = g[d.data[i + 1]];
              d.data[i + 2] = b[d.data[i + 2]];
            }
            ctx.putImageData(d, 0, 0);
            return c;
          },
        };
        // eslint-disable-next-line no-new-func
        const transform = new Function(`return (${transformSource})`)();
        const result = await transform(canvas, helpers);
        const blob = result instanceof Blob ? result : await new Promise((r) => result.toBlob(r, type, quality));
        const buf = new Uint8Array(await blob.arrayBuffer());
        let s = "";
        for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return { base64: btoa(s), type: blob.type };
      },
      { base64, transformSource, type, quality }
    );
    return { name, mimeType: out.type, buffer: Buffer.from(out.base64, "base64") };
  }
}

const TRAIT_OF = { "Eye color": "eye", "Hair color": "hair", "Skin tone": "skin" };
const KEY_OF = {
  eye: { "Blue / gray": "blue", "Green / hazel": "intermediate", Brown: "brown" },
  hair: { "Black / dark brown": "black", Brown: "brown", Blond: "blond", "Red / auburn": "red", "Gray / white": "gray" },
};

// Summary text -> { eye, hair, skin, checks, text }. A measured color trait
// is { measured: true, categories: [key, ...], confidence, numbers }; with low
// confidence it lists both categories the result sits between.
export function parseSummary(raw) {
  const text = raw.replace(/\r\n/g, "\n"); // the Windows clipboard adds \r
  const out = { text, checks: [], shape: {} };
  let section = null;
  for (const line of text.split("\n")) {
    if (/^[A-Z][A-Z ]+$/.test(line)) section = line;
    // "Face proportions: Width vs. height 1.08×; Jaw vs. face width 79%" ->
    // shape["Face proportions"]["Width vs. height"] = 1.08
    const shape = section === "FACE SHAPE" && line.match(/^(\S[^:]*): (.*)$/);
    if (shape) {
      out.shape[shape[1]] = Object.fromEntries(
        shape[2].split("; ").flatMap((part) => {
          const m = part.match(/^(.*) ([+-]?[\d.]+)(×|%|°)$/);
          return m ? [[m[1], Number(m[2])]] : [];
        })
      );
    }
    if (section === "PHOTO CHECK" && line.startsWith("- ")) out.checks.push(line.slice(2));
    const m = line.match(/^(Eye color|Hair color|Skin tone): (.*)$/);
    if (!m || section !== "COLOR") continue;
    const trait = TRAIT_OF[m[1]];
    if (m[2].startsWith("Not measured")) {
      out[trait] = { measured: false, reason: m[2] };
      continue;
    }
    const d = m[2].match(/^(.*?) \(((?:low|medium|high) confidence[^()]*)\)/);
    const labels = d[1].split(" or ").map((l) => l.replace(/ \(ITA[^)]*\)$/, "").trim());
    const num = (re) => {
      const x = d[2].match(re);
      return x ? Number(x[1]) : null;
    };
    out[trait] = {
      measured: true,
      categories: labels.map((l) => KEY_OF[trait]?.[l] ?? l.toLowerCase()),
      confidence: d[2].split(" ")[0],
      numbers: {
        pie: num(/pixel index (-?[\d.]+)/),
        L: num(/lightness L\* (-?\d+)/),
        chroma: num(/chroma ([\d.]+)/),
        ita: num(/ITA (-?\d+)°/),
        monk: num(/Monk swatch (\d+)/),
      },
    };
  }
  return out;
}

// Two readings agree if they share a category: "Brown" and "Brown or Green /
// hazel" agree; "Brown" and "Blue / gray" don't.
export function agree(a, b) {
  if (!a?.measured || !b?.measured) return a?.measured === b?.measured;
  return a.categories.some((c) => b.categories.includes(c));
}

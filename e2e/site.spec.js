// The page itself, as served: headers, assets, and a clean load.
import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.js";

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url)));
const GLOBAL_HEADERS = vercel.headers.find((r) => r.source === "/(.*)").headers;

test("serves every production security header on the page", async ({ app }) => {
  const res = await app.page.request.get("/");
  expect(res.status()).toBe(200);
  const headers = res.headers();
  for (const { key, value } of GLOBAL_HEADERS) {
    expect(headers[key.toLowerCase()], key).toBe(value);
  }
});

test("loads without errors and without contacting any third party", async ({ app }) => {
  await expect(app.page).toHaveTitle(/Trait/);
  await expect(app.page.getByRole("heading", { level: 1 })).toBeVisible();
  // fonts are self-hosted and the models load only on intent (hover,
  // focus, a picked photo), so a plain visit touches no other host
  const hosts = new Set(app.networkRequests().map((r) => new URL(r.url).host));
  expect([...hosts]).toEqual([new URL(app.page.url()).host]);
  expect(app.log.pageErrors).toEqual([]);
  expect(app.log.consoleErrors).toEqual([]);
});

test("the social preview image and favicon exist", async ({ app }) => {
  const og = await app.page.locator('meta[property="og:image"]').getAttribute("content");
  const ogRes = await app.page.request.get(og);
  expect(ogRes.status()).toBe(200);
  expect(ogRes.headers()["content-type"]).toMatch(/image\/png/);
  const icon = await app.page.locator('link[rel="icon"]').getAttribute("href");
  expect((await app.page.request.get(icon)).status()).toBe(200);
});

test("the CSP really blocks requests to other hosts", async ({ app }) => {
  // the browser, not the app, enforces "your photo never leaves the device"
  const outcome = await app.page.evaluate(() =>
    fetch("https://example.com/upload", { method: "POST", body: "x" }).then(
      () => "sent",
      () => "blocked"
    )
  );
  expect(outcome).toBe("blocked");
});

test("the MediaPipe runtime loads at exactly the installed version", async ({ app }) => {
  // the WASM and the JS API must match (vite.config.js pins the URL to the
  // installed package); a mismatch fails with an opaque error in production
  const { version } = JSON.parse(readFileSync(new URL("../node_modules/@mediapipe/tasks-vision/package.json", import.meta.url)));
  await app.analyze("business");
  const wasm = app.networkRequests().filter((r) => r.url.includes("cdn.jsdelivr.net"));
  expect(wasm.length).toBeGreaterThan(0);
  for (const r of wasm) expect(r.url).toContain(`@mediapipe/tasks-vision@${version}/wasm/`);
});

test("on Vercel, hashed assets are cached as immutable", async ({ app }) => {
  const page = await app.page.request.get("/");
  test.skip(page.headers()["server"] !== "Vercel", "only production sets asset cache headers");
  const script = (await page.text()).match(/\/assets\/[^"]+\.js/)[0];
  const res = await app.page.request.get(script);
  expect(res.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
});

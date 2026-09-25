// Warm indoor light: the app must notice it, and "Correct the colors" must
// undo it - clicking something white in the photo, with a mouse or with
// the keyboard - bringing the numbers back to what the same face measures
// in neutral light.
import { test, expect } from "./fixtures.js";

// A luminance-preserving warm cast in linear light, like a photo under
// warm bulbs that the phone's auto white balance only partly corrected.
const WARM = `(c, h) => h.applyGains(c, (() => { const g = [1.18, 1, 0.72];
  const y = 0.2126 * g[0] + 0.7152 * g[1] + 0.0722 * g[2]; return g.map((v) => v / y); })())`;

// The largest flat, bright, colorless patch in the photo (a wall, a shirt),
// found on the original so the test doesn't depend on hand-picked pixels.
const FIND_NEUTRAL = `(c) => {
  const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  let best = null;
  const R = 6, step = 8;
  for (let y = R; y < c.height - R; y += step) for (let x = R; x < c.width - R; x += step) {
    let n = 0, sr = 0, sg = 0, sb = 0, mx = 0, mn = 1;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
      const i = ((y + dy) * c.width + x + dx) * 4;
      const [r, g, b] = [lin(d[i]), lin(d[i + 1]), lin(d[i + 2])];
      sr += r; sg += g; sb += b; n++;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b; mx = Math.max(mx, l); mn = Math.min(mn, l);
      if (Math.max(d[i], d[i + 1], d[i + 2]) >= 250) { n = -1e9; }
    }
    if (n <= 0) continue;
    const [r, g, b] = [sr / n, sg / n, sb / n];
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const spread = (Math.max(r, g, b) - Math.min(r, g, b)) / Y;
    if (Y < 0.25 || spread > 0.06 || mx - mn > 0.08) continue;
    if (!best || Y > best.Y) best = { x, y, Y };
  }
  return new Blob([JSON.stringify(best)], { type: "application/json" });
}`;

async function neutralSpot(app, photo) {
  const out = await app.variant(photo, FIND_NEUTRAL);
  return JSON.parse(out.buffer.toString());
}

// Image pixel -> page position on the displayed (object-fit: contain) canvas.
async function screenPoint(app, { x, y }) {
  return app.page.locator("canvas.photo").evaluate(
    (c, p) => {
      const r = c.getBoundingClientRect();
      const s = Math.min(r.width / c.width, r.height / c.height);
      return {
        x: r.left + (r.width - c.width * s) / 2 + (p.x + 0.5) * s,
        y: r.top + (r.height - c.height * s) / 2 + (p.y + 0.5) * s,
      };
    },
    { x, y }
  );
}

test("a warm cast is flagged and clicking a white spot corrects it", async ({ app }) => {
  await app.analyze("portrait");
  const neutral = await app.summary();
  await app.startOver();

  const spot = await neutralSpot(app, "portrait");
  expect(spot, "the photo needs a white or gray area for this test").not.toBeNull();

  await app.analyze(await app.variant("portrait", WARM, { name: "warm.jpg", type: "image/jpeg", quality: 0.92 }));
  const warm = await app.summary();
  expect(warm.checks.join("\n")).toMatch(/lighting looks warm/);
  // the cast really does push skin darker - that's why it matters
  expect(warm.skin.numbers.ita).toBeLessThan(neutral.skin.numbers.ita - 4);

  // the banner's shortcut starts picking; click the white spot
  await app.page.getByRole("button", { name: "Correct the colors" }).first().click();
  await app.page.locator("canvas.photo.is-picking").scrollIntoViewIfNeeded();
  const at = await screenPoint(app, spot);
  await app.page.mouse.click(at.x, at.y);
  await expect(app.page.getByText("Colors corrected for the lighting")).toBeVisible();

  const fixed = await app.summary();
  expect(fixed.text).toContain("Colors corrected for the lighting");
  expect(fixed.checks.join("\n")).not.toMatch(/lighting looks warm/);
  expect(Math.abs(fixed.skin.numbers.ita - neutral.skin.numbers.ita)).toBeLessThanOrEqual(4);
  expect(fixed.eye.categories).toEqual(expect.arrayContaining(neutral.eye.categories.slice(0, 1)));

  // undo restores the photo as uploaded
  await app.page.getByRole("button", { name: "Undo" }).click();
  expect((await app.summary()).skin.numbers.ita).toBe(warm.skin.numbers.ita);
});

test("the correction works from the keyboard alone", async ({ app }) => {
  const spot = await neutralSpot(app, "portrait");
  await app.analyze(await app.variant("portrait", WARM, { name: "warm.jpg", type: "image/jpeg", quality: 0.92 }));
  await app.page.getByRole("button", { name: "Correct the colors" }).first().click();
  const canvas = app.page.locator("canvas.photo.is-picking");
  await canvas.focus();
  // the crosshair starts mid-photo, on the face: Enter there is refused
  // (skin isn't white) with a message, not silently accepted
  await app.page.keyboard.press("Enter");
  await expect(app.page.locator(".recolor .callout--warn")).toBeVisible();
  // walk it to the white spot with the arrow keys (1% of the width per
  // press, as PhotoOverlay moves it) and press Enter
  const [w, h] = await canvas.evaluate((c) => [c.width, c.height]);
  const step = Math.max(1, Math.round(w / 100));
  const walk = async (from, to, less, more) => {
    const n = Math.round((to - from) / step);
    for (let i = 0; i < Math.abs(n); i++) await app.page.keyboard.press(n < 0 ? less : more);
  };
  await walk(Math.round(w / 2), spot.x, "ArrowLeft", "ArrowRight");
  await walk(Math.round(h / 2), spot.y, "ArrowUp", "ArrowDown");
  await app.page.keyboard.press("Enter");
  await expect(app.page.getByText("Colors corrected for the lighting")).toBeVisible();
});

test("Escape leaves picking mode without changing anything", async ({ app }) => {
  await app.analyze("business");
  const before = await app.summary();
  await app.page.getByRole("button", { name: "Correct the colors" }).first().click();
  await app.page.locator("canvas.photo.is-picking").press("Escape");
  await expect(app.page.locator("canvas.photo.is-picking")).toHaveCount(0);
  expect((await app.summary()).text).toBe(before.text);
});

test("picking a colored spot is refused with an explanation", async ({ app }) => {
  await app.analyze("business");
  await app.page.getByRole("button", { name: "Correct the colors" }).first().click();
  // the pupil-to-pupil midpoint is skin: far too colored to be white
  const face = await app.page.locator("canvas.photo").evaluate((c) => [c.width / 2, c.height * 0.35]);
  const at = await screenPoint(app, { x: Math.round(face[0]), y: Math.round(face[1]) });
  await app.page.mouse.click(at.x, at.y);
  await expect(app.page.locator(".recolor .callout--warn")).toBeVisible();
  await expect(app.page.getByText("Colors corrected for the lighting")).toHaveCount(0);
});

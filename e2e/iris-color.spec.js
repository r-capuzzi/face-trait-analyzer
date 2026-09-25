// None of the test photos has blue or green eyes, so these tests make them:
// the real brown irises of the business photo, recolored in CIELAB but
// keeping their real texture - the lid shadow across the top, the
// catchlight, the darker rim - so the app's sampling faces a real eye.
import { test, expect } from "./fixtures.js";

// Iris circles of business-person.png at its native 958x1358, measured once
// with the app's own landmarks (irisCircle). The photo is fetched from a
// pinned URL, so they can't drift.
const IRISES = [
  { cx: 444.4, cy: 267.1, r: 11 },
  { cx: 561.9, cy: 260.4, r: 10.8 },
];

// Lightens each iris pixel (blue and green irises carry less melanin) and
// swaps its color for `tint`'s, scaled by the pixel's own lightness so the
// texture survives. Skips the pupil, the catchlight, and the lid skin and
// sclera that fall inside the circle.
const recolor = (tint) => `(c) => {
  const IRISES = ${JSON.stringify(IRISES)};
  const tint = ${JSON.stringify(tint)};
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const enc = (v) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fi = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const W = [0.95047, 1, 1.08883];
  for (const { cx, cy, r } of IRISES) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (dist > r || dist < 0.3 * r) continue;
      const i = (y * c.width + x) * 4;
      const [R, G, B] = [lin(d.data[i]), lin(d.data[i + 1]), lin(d.data[i + 2])];
      const X = 0.4124 * R + 0.3576 * G + 0.1805 * B, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = 0.0193 * R + 0.1192 * G + 0.9505 * B;
      const L = 116 * f(Y) - 16;
      if (L >= 62) continue; // catchlight, sclera, lid skin
      const L2 = Math.min(70, L * 1.25 + 12);
      const k = 0.6 + 0.4 * Math.min(1, L / 50);
      const fy = (L2 + 16) / 116, fx = fy + (tint.a * k) / 500, fz = fy - (tint.b * k) / 200;
      const [X2, Y2, Z2] = [W[0] * fi(fx), fi(fy), W[2] * fi(fz)];
      d.data[i] = enc(3.2406 * X2 - 1.5372 * Y2 - 0.4986 * Z2);
      d.data[i + 1] = enc(-0.9689 * X2 + 1.8758 * Y2 + 0.0415 * Z2);
      d.data[i + 2] = enc(0.0557 * X2 - 0.204 * Y2 + 1.057 * Z2);
    }
  }
  ctx.putImageData(d, 0, 0);
  return c;
}`;

test("real iris texture recolored blue reads blue", async ({ app }) => {
  await app.analyze(await app.variant("business", recolor({ a: -3, b: -18 }), { name: "blue-eyes.png" }));
  const { eye } = await app.summary();
  expect(eye.measured).toBe(true);
  expect(eye.categories).toContain("blue");
  expect(eye.categories).not.toContain("brown");
});

test("real iris texture recolored green reads green/hazel, not blue", async ({ app }) => {
  await app.analyze(await app.variant("business", recolor({ a: -14, b: 13 }), { name: "green-eyes.png" }));
  const { eye } = await app.summary();
  expect(eye.measured).toBe(true);
  expect(eye.categories[0]).toBe("intermediate");
  expect(eye.categories).not.toContain("brown");
});

test("the original brown irises still read brown (the recoloring is the only change)", async ({ app }) => {
  await app.analyze(await app.variant("business", "(c) => c", { name: "brown-eyes.png" }));
  expect((await app.summary()).eye.categories).toEqual(["brown"]);
});

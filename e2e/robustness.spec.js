// Metamorphic tests: the same face saved the ways real phones and apps save
// photos must get the same answer. None of these changes the person, so
// any disagreement is the app's error, and no hand-labeled truth is needed.
import { test, expect, agree } from "./fixtures.js";

const COLOR = ["eye", "hair", "skin"];

// ITA is a direct function of the pixels' L* and b*, so re-encoding may
// nudge it slightly; a few degrees is noise, a category's width (13-14°) isn't.
const ITA_NOISE = 5;

// the analyzed photo as the app shows it: [width, height] after loading
const shownSize = (app) => app.page.locator("canvas.photo").evaluate((c) => [c.width, c.height]);

async function baseline(app, photo) {
  await app.analyze(photo);
  const s = await app.summary();
  s.shownSize = await shownSize(app);
  await app.startOver();
  return s;
}

function expectAgreement(base, variant, { ita = ITA_NOISE, hairChroma = null } = {}) {
  for (const t of COLOR) {
    if (!base[t]?.measured) continue;
    expect(agree(base[t], variant[t]), `${t}: ${JSON.stringify(base[t].categories)} vs ${JSON.stringify(variant[t])}`).toBe(true);
  }
  if (base.skin?.measured && variant.skin?.measured && ita !== null) {
    expect(Math.abs(base.skin.numbers.ita - variant.skin.numbers.ita)).toBeLessThanOrEqual(ita);
  }
  if (base.hair?.measured && variant.hair?.measured && hairChroma !== null) {
    expect(Math.abs(base.hair.numbers.chroma - variant.hair.numbers.chroma), "hair chroma").toBeLessThanOrEqual(hairChroma);
  }
}

// Orientation 6 ("rotate 90° clockwise to display") as a minimal EXIF APP1
// segment, inserted right after the JPEG's start-of-image marker - what a
// phone does when you hold it upright.
function withExifOrientation(jpeg, orientation) {
  const app1 = Buffer.from([
    0xff, 0xe1, 0x00, 0x22, // APP1, length 34
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF header, IFD at 8
    0x00, 0x01, // one entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation, SHORT
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]);
  return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);
}

for (const photo of ["portrait", "business", "stylizer"]) {
  test.describe(photo, () => {
    test("a mirrored selfie gets the same answer", async ({ app }) => {
      const base = await baseline(app, photo);
      await app.analyze(
        await app.variant(
          photo,
          `(c) => { const m = document.createElement("canvas"); m.width = c.width; m.height = c.height;
            const x = m.getContext("2d"); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m; }`
        )
      );
      expectAgreement(base, await app.summary());
    });

    test("re-saving as a compressed JPEG gets the same answer", async ({ app }) => {
      const base = await baseline(app, photo);
      await app.analyze(await app.variant(photo, "(c) => c", { name: "resaved.jpg", type: "image/jpeg", quality: 0.7 }));
      expectAgreement(base, await app.summary());
    });

    test("a photo stored sideways with an EXIF rotation tag is turned upright", async ({ app }) => {
      const base = await baseline(app, photo);
      // stored pixels rotated 90° counter-clockwise; the tag says to turn
      // them back clockwise for display
      const sideways = await app.variant(
        photo,
        `(c) => { const r = document.createElement("canvas"); r.width = c.height; r.height = c.width;
          const x = r.getContext("2d"); x.translate(0, c.width); x.rotate(-Math.PI / 2); x.drawImage(c, 0, 0); return r; }`,
        { name: "phone.jpg", type: "image/jpeg", quality: 0.95 }
      );
      await app.analyze({ ...sideways, buffer: withExifOrientation(sideways.buffer, 6) });
      // colors alone can't tell (MediaPipe finds sideways faces too), so
      // check the photo itself came out upright
      expect(await shownSize(app)).toEqual(base.shownSize);
      expectAgreement(base, await app.summary());
    });

    test("a Display P3 photo (as iPhones save them) is color-managed, not misread", async ({ app }) => {
      const base = await baseline(app, photo);
      const p3 = await app.variant(
        photo,
        `(c) => { const p = document.createElement("canvas"); p.width = c.width; p.height = c.height;
          p.getContext("2d", { colorSpace: "display-p3" }).drawImage(c, 0, 0); return p; }`,
        { name: "iphone.png" }
      );
      // the file really is tagged P3, or this test would prove nothing
      expect(p3.buffer.includes(Buffer.from("iCCP")) || p3.buffer.includes(Buffer.from("cICP"))).toBe(true);
      await app.analyze(p3);
      // P3 numbers read as if they were sRGB come out less saturated, which
      // shows most directly in hair chroma and skin ITA
      expectAgreement(base, await app.summary(), { ita: 3, hairChroma: 1.5 });
    });
  });
}

test("a full-size 12-megapixel phone photo is downscaled and analyzed quickly", async ({ app }) => {
  const base = await baseline(app, "business");
  const big = await app.variant(
    "business",
    `(c) => { const s = Math.sqrt(12e6 / (c.width * c.height)); const b = document.createElement("canvas");
      b.width = Math.round(c.width * s); b.height = Math.round(c.height * s);
      const x = b.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(c, 0, 0, b.width, b.height); return b; }`,
    { name: "IMG_0001.jpg", type: "image/jpeg", quality: 0.9 }
  );
  const started = Date.now();
  await app.analyze(big);
  expect(Date.now() - started).toBeLessThan(20_000);
  expectAgreement(base, await app.summary(), { ita: null });
});

test("a low-resolution copy doesn't change the answer, it only lowers confidence", async ({ app }) => {
  const base = await baseline(app, "business");
  await app.analyze(
    await app.variant(
      "business",
      `(c) => { const h = document.createElement("canvas"); h.width = c.width >> 1; h.height = c.height >> 1;
        h.getContext("2d").drawImage(c, 0, 0, h.width, h.height); return h; }`
    )
  );
  const half = await app.summary();
  for (const t of COLOR) {
    // a trait may become unmeasurable (too few pixels), but never different
    if (half[t]?.measured) expect(agree(base[t], half[t]), t).toBe(true);
  }
});

// Face shape is ratios within the person's own face, so a mirrored or
// re-saved copy must give nearly the same numbers. Measured spread on the
// test photos: 1-5% for proportions, nose and brow arch; the lower/upper
// lip ratio and the Cupid's bow move ~10% on mirrored copies (the face-mesh
// model itself isn't perfectly mirror-symmetric around the lips).
const SHAPE_TOLERANCE = { "Lower vs. upper lip": 0.15, "Cupid's bow": 0.15, default: 0.08 };

for (const photo of ["portrait", "business"]) {
  test(`${photo}: face-shape ratios survive mirroring and re-compression`, async ({ app }) => {
    const base = await baseline(app, photo);
    const variants = [
      `(c) => { const m = document.createElement("canvas"); m.width = c.width; m.height = c.height;
        const x = m.getContext("2d"); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m; }`,
      "(c) => c",
    ];
    for (const [i, transform] of variants.entries()) {
      if (i) await app.startOver();
      await app.analyze(await app.variant(photo, transform, i ? { name: "resaved.jpg", type: "image/jpeg", quality: 0.7 } : {}));
      const copy = await app.summary();
      for (const card of ["Face proportions", "Nose width", "Lips and mouth", "Eye shape"]) {
        for (const [measure, value] of Object.entries(base.shape[card] ?? {})) {
          const other = copy.shape[card]?.[measure];
          expect(other, `${card} / ${measure}`).toBeDefined();
          const tol = SHAPE_TOLERANCE[measure] ?? SHAPE_TOLERANCE.default;
          // relative for ratios; a degree or two for angles near zero
          const allowed = measure.includes("tilt") ? 2 : tol * Math.abs(value);
          expect(Math.abs(other - value), `${card} / ${measure}: ${value} vs ${other}`).toBeLessThanOrEqual(allowed);
        }
      }
    }
  });
}

import { applyGains, gainsFromReference, REFERENCE } from "./whiteBalance";
import { chroma, deltaE2000, rgbToLab } from "./color";
import { BLUE, syntheticFace } from "../test/syntheticFace";
import { measureEyeColor } from "./traits/eyeColor";

// Paint a uniform square into an image (in place) and return its center.
function paint(imageData, [r, g, b], { x = 0, y = 0, size = 20 } = {}) {
  for (let py = y; py < y + size; py++) {
    for (let px = x; px < x + size; px++) imageData.data.set([r, g, b, 255], (py * imageData.width + px) * 4);
  }
  return { x: x + size / 2, y: y + size / 2 };
}

const pixelLab = (img, { x, y }) => {
  const i = (Math.round(y) * img.width + Math.round(x)) * 4;
  return rgbToLab(img.data[i], img.data[i + 1], img.data[i + 2]);
};

// Warm indoor light that the phone's auto white balance only partly
// removed: red boosted, blue cut (in linear light).
const WARM_CAST = { r: 1.25, g: 1, b: 0.7 };

test("a gray card under warm light comes out neutral, at its own lightness", () => {
  const { imageData } = syntheticFace({ right: BLUE, left: BLUE });
  const card = paint(imageData, [128, 128, 128]);
  const cast = applyGains(imageData, WARM_CAST);
  expect(chroma(pixelLab(cast, card))).toBeGreaterThan(10); // visibly orange

  const wb = gainsFromReference(cast, card.x, card.y);
  expect(wb.ok).toBe(true);
  const fixed = applyGains(cast, wb.gains);
  const lab = pixelLab(fixed, card);
  expect(chroma(lab)).toBeLessThan(1.5);
  // brightness is kept, not pushed to white: the card stays mid-gray
  expect(lab.L).toBeCloseTo(pixelLab(cast, card).L, 0);
});

test("correcting the cast brings the eye measurement back to the uncast photo's", () => {
  const face = syntheticFace({ right: BLUE, left: BLUE });
  const card = paint(face.imageData, [150, 150, 150]);
  const truth = measureEyeColor(face.imageData, face.points);

  const cast = applyGains(face.imageData, WARM_CAST);
  const underCast = measureEyeColor(cast, face.points);
  expect(deltaE2000(underCast.lab, truth.lab)).toBeGreaterThan(8);

  const wb = gainsFromReference(cast, card.x, card.y);
  const fixed = measureEyeColor(applyGains(cast, wb.gains), face.points);
  // 8-bit rounding through two corrections leaves a sliver of error
  expect(deltaE2000(fixed.lab, truth.lab)).toBeLessThan(1.5);
  expect(fixed.pie).toBeCloseTo(truth.pie, 1);
});

test("the original image is never modified (undo and re-picks start from the real photo)", () => {
  const { imageData } = syntheticFace({ right: BLUE, left: BLUE });
  const before = imageData.data.slice();
  applyGains(imageData, WARM_CAST);
  expect(imageData.data).toEqual(before);
});

describe("refuses spots that can't be a trustworthy reference", () => {
  const face = () => syntheticFace({ right: BLUE, left: BLUE }).imageData;

  test("blown-out white", () => {
    const img = face();
    const spot = paint(img, [255, 255, 255]);
    expect(gainsFromReference(img, spot.x, spot.y)).toMatchObject({ ok: false, reason: /blown out/ });
  });

  test("too dark to read", () => {
    const img = face();
    const spot = paint(img, [25, 25, 25]);
    expect(gainsFromReference(img, spot.x, spot.y)).toMatchObject({ ok: false, reason: /too dark/ });
  });

  test("a clearly colored surface", () => {
    const img = face();
    const spot = paint(img, [200, 60, 50]); // a red shirt isn't a gray card
    expect(gainsFromReference(img, spot.x, spot.y)).toMatchObject({ ok: false, reason: /clearly colored/ });
  });

  test("outside the photo", () => {
    expect(gainsFromReference(face(), -5, 10)).toMatchObject({ ok: false, reason: /outside/ });
  });

  test("but a mildly tinted neutral (an off-white wall) is accepted", () => {
    const img = face();
    const spot = paint(img, [235, 225, 205]);
    const wb = gainsFromReference(img, spot.x, spot.y);
    expect(wb.ok).toBe(true);
    const { r, g, b } = wb.gains;
    expect(Math.max(r, g, b) / Math.min(r, g, b)).toBeLessThan(REFERENCE.maxGainRatio);
  });
});

test("blown-out pixels stay blown out, so the overexposure check still sees them", () => {
  const { imageData } = syntheticFace({ right: BLUE, left: BLUE });
  const glare = paint(imageData, [255, 250, 240], { x: 0, y: 0, size: 4 });
  const i = (Math.round(glare.y) * imageData.width + Math.round(glare.x)) * 4;
  // a warm-light correction cuts red: without the guard 255 would drop to ~240
  const fixed = applyGains(imageData, { r: 0.85, g: 1, b: 1.2 });
  expect([...fixed.data.slice(i, i + 3)]).toEqual([255, 250, 240]);
});

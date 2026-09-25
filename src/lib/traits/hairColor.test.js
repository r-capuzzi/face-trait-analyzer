import { deltaE2000, rgbToLab } from "../color";
import { syntheticHead } from "../../test/syntheticHead";
import { classifyHairColor, isGrayPixel, measureHairColor, saturation } from "./hairColor";

const SKIN = [205, 165, 135];

function hairOf(rgb, extra = {}) {
  const { imageData, mask, points } = syntheticHead({ skin: SKIN, hair: rgb, ...extra });
  return measureHairColor(imageData, mask, points);
}

test("measures the hair color itself, not the blended rim at the mask edge", () => {
  const m = hairOf([90, 65, 45], { hairEdge: [240, 240, 240] });
  expect(m.status).toBe("ok");
  expect(deltaE2000(m.lab, rgbToLab(90, 65, 45))).toBeLessThan(1);
});

test("never samples pixels right at the edge of the hair mask", () => {
  // hair occupies rows 0..149 and columns 61..339 of the mask
  const m = hairOf([90, 65, 45]);
  const d = 2; // erosion distance for this fixture's 60 px pupil spacing
  for (const p of m.pixels) {
    expect(p.y).toBeLessThanOrEqual(149 - d);
    expect(p.x).toBeGreaterThanOrEqual(61 + d);
    expect(p.x).toBeLessThanOrEqual(339 - d);
  }
});

test("too little visible hair is unmeasurable, not guessed", () => {
  expect(hairOf([90, 65, 45], { hairRows: 6 }).status).toBe("unmeasurable");
});

test.each([
  ["black", [25, 22, 20]],
  ["brown", [90, 65, 45]],
  ["blond", [205, 175, 125]],
  ["red", [150, 60, 30]],
  ["gray", [172, 170, 168]],
])("%s hair classifies as %s", (expected, rgb) => {
  expect(classifyHairColor(hairOf(rgb)).category).toBe(expected);
});

test("salt-and-pepper hair (a colorless mid-gray blend) is gray, not brown", () => {
  // L* ~44: each pixel is just under the per-pixel gray cutoff, so this
  // exercises the colorless-median rule, not the gray-pixel-share rule
  const m = hairOf([105, 104, 103]);
  expect(m.grayFraction).toBe(0);
  expect(classifyHairColor(m)).toMatchObject({ category: "gray", runnerUp: "black" });
});

test("gray pixels must be both near-neutral and not dark (black hair isn't gray)", () => {
  expect(isGrayPixel({ L: 70, a: 1, b: 2 })).toBe(true);
  expect(isGrayPixel({ L: 15, a: 1, b: 2 })).toBe(false);
  expect(isGrayPixel({ L: 70, a: 5, b: 20 })).toBe(false); // blond
});

test("auburn-ish hair just short of the red rule is 'brown' with red as runner-up", () => {
  // saturation 23 / (38 + 16) = 0.43, just under 0.45
  const r = classifyHairColor({ lab: { L: 38, a: 15, b: 17.4 }, chroma: 23, hue: 49, grayFraction: 0 });
  expect(r.category).toBe("brown");
  expect(r.runnerUp).toBe("red");
  expect(r.margin).toBeLessThan(0.2);
});

test("the red rule doesn't move with exposure: a brighter photo of brown hair stays brown", () => {
  // a real chestnut-brown head, as photographed and 0.7 stops brighter
  // (chroma 16.3 -> 19.2: over the old fixed chroma-18 rule)
  const asShot = { lab: { L: 24, a: 10.3, b: 12.7 }, chroma: 16.3, hue: 51, grayFraction: 0 };
  const brighter = { lab: { L: 31, a: 12.1, b: 14.9 }, chroma: 19.2, hue: 51, grayFraction: 0 };
  expect(saturation(asShot.lab)).toBeCloseTo(saturation(brighter.lab), 1);
  expect(classifyHairColor(asShot).category).not.toBe("red");
  expect(classifyHairColor(brighter).category).not.toBe("red");
});

test("a beard (which the model labels hair too) doesn't color the head's hair", () => {
  // brown hair on the head, a gray beard over the chin and below the jaw
  const m = hairOf([90, 65, 45], { beard: [160, 160, 158] });
  expect(m.status).toBe("ok");
  expect(deltaE2000(m.lab, rgbToLab(90, 65, 45))).toBeLessThan(1);
  expect(m.grayFraction).toBe(0);
  expect(classifyHairColor(m).category).toBe("brown");
});

test("near-black hair with a noisy reddish hue isn't offered as red", () => {
  // measured on a real photo of very dark brown hair
  const r = classifyHairColor({ lab: { L: 9, a: 4.4, b: 2.8 }, chroma: 5.2, hue: 32, grayFraction: 0 });
  expect(r.category).toBe("black");
  expect(r.runnerUp).not.toBe("red");
});

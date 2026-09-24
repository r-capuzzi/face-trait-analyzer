import { deltaE2000, rgbToLab } from "../color";
import {
  classifyEyeColor,
  classifyIrisPixel,
  measureEyeColor,
  pieScore,
} from "./eyeColor";
import { BLUE, BROWN, syntheticFace } from "../../test/syntheticFace";

test("classifyIrisPixel: warm hues and dark neutrals are pigment, the rest scatter blue", () => {
  expect(classifyIrisPixel(rgbToLab(...BROWN))).toBe("brown");
  expect(classifyIrisPixel(rgbToLab(...BLUE))).toBe("blue");
  expect(classifyIrisPixel({ L: 60, a: 0, b: 1 })).toBe("blue"); // light gray
  expect(classifyIrisPixel({ L: 20, a: 1, b: 2 })).toBe("brown"); // near-black
  expect(classifyIrisPixel({ L: 50, a: 3, b: 25 })).toBe("brown"); // amber/yellow
  expect(classifyIrisPixel({ L: 50, a: -15, b: 15 })).toBe("blue"); // green, hue 135
});

test("pieScore runs from -1 (all brown) to +1 (all blue)", () => {
  const b = rgbToLab(...BLUE);
  const r = rgbToLab(...BROWN);
  expect(pieScore([b, b, b])).toBe(1);
  expect(pieScore([r, r])).toBe(-1);
  expect(pieScore([b, r])).toBe(0);
});

test("a blue iris measures as blue, ignoring the pupil and the catchlight", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE });
  const m = measureEyeColor(imageData, points);
  expect(m.status).toBe("ok");
  expect(m.pie).toBe(1);
  expect(deltaE2000(m.lab, rgbToLab(...BLUE))).toBeLessThan(1);
  expect(m.heterochromia).toBe(false);
});

test("a dilated pupil doesn't leak into the sample and turn blue eyes brown", () => {
  // pupil at 60% of the iris radius (a ~7 mm pupil in dim light) - well past
  // the old fixed 35% cutoff, so black pupil pixels would count as pigment
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE }, { pupilR: 24 });
  const m = measureEyeColor(imageData, points);
  expect(m.pie).toBe(1);
  expect(classifyEyeColor(m).category).toBe("blue");
  expect(m.eyes.right.innerRadius).toBeGreaterThan(0.6);
});

test("with no clear pupil edge (dark iris) the default inner cutoff is kept", () => {
  const { imageData, points } = syntheticFace({ right: [30, 20, 14], left: [30, 20, 14] });
  const m = measureEyeColor(imageData, points);
  expect(m.eyes.right.innerRadius).toBeCloseTo(0.35);
});

test("a brown iris measures as brown", () => {
  const { imageData, points } = syntheticFace({ right: BROWN, left: BROWN });
  const m = measureEyeColor(imageData, points);
  expect(m.pie).toBe(-1);
  expect(deltaE2000(m.lab, rgbToLab(...BROWN))).toBeLessThan(1);
});

test("one blue and one brown eye is flagged as possible heterochromia", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BROWN });
  const m = measureEyeColor(imageData, points);
  expect(m.heterochromia).toBe(true);
  expect(m.eyes.right.pie).toBe(1);
  expect(m.eyes.left.pie).toBe(-1);
});

test("closed eyes (a flat lid outline) are unmeasurable, not guessed", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE }, { lidHalfHeight: 1 });
  expect(measureEyeColor(imageData, points).status).toBe("unmeasurable");
});

// Anchors from Andersen et al. 2013: mean PIE by HERC2 rs12913832 genotype
// was 0.99 (GG), -0.71 (GA) and -0.87 (AA).
describe("classifyEyeColor", () => {
  const brownLab = rgbToLab(...BROWN);
  const blueLab = rgbToLab(...BLUE);

  test("the GG mean (0.99) reads as blue", () => {
    expect(classifyEyeColor({ pie: 0.99, lab: blueLab }).category).toBe("blue");
  });

  test("the GA (-0.71) and AA (-0.87) means read as brown", () => {
    expect(classifyEyeColor({ pie: -0.71, lab: brownLab }).category).toBe("brown");
    expect(classifyEyeColor({ pie: -0.87, lab: brownLab }).category).toBe("brown");
  });

  test("an even mix of pigmented and unpigmented pixels is intermediate", () => {
    expect(classifyEyeColor({ pie: 0, lab: { L: 45, a: 2, b: 14 } }).category).toBe("intermediate");
  });

  test("margin stays in [0, 1] and is high at the extremes", () => {
    for (let pie = -1; pie <= 1.0001; pie += 0.1) {
      const { margin } = classifyEyeColor({ pie, lab: blueLab });
      expect(margin).toBeGreaterThanOrEqual(0);
      expect(margin).toBeLessThanOrEqual(1);
    }
    expect(classifyEyeColor({ pie: 1, lab: blueLab }).margin).toBeGreaterThanOrEqual(0.5);
    expect(classifyEyeColor({ pie: -1, lab: brownLab }).margin).toBeGreaterThanOrEqual(0.5);
  });
});

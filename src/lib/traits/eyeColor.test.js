import { deltaE2000, rgbToLab } from "../color";
import {
  classifyEyeColor,
  classifyIrisPixel,
  greenShare,
  isGreenPixel,
  measureEyeColor,
  MIN_PUPIL_SEARCH_RADIUS,
  pieScore,
  pupilEdge,
  refineIrisCircle,
  RING,
  rejectOutliers,
} from "./eyeColor";
import { eyeOpening, IRIS, irisCircle } from "../regions";
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

test("glare filling a quarter of a small iris is rejected, not left in to vote blue", () => {
  // a real studio portrait: two catchlights covered ~25% of an 8 px iris;
  // the old fixed trim (brightest 15%) left half of them in
  const iris = Array.from({ length: 75 }, (_, i) => ({ lab: { L: 12 + (i % 7), a: 6, b: 5 } }));
  const glare = Array.from({ length: 25 }, (_, i) => ({ lab: { L: 70 + (i % 10), a: 0, b: 1 } }));
  const kept = rejectOutliers([...iris, ...glare]);
  expect(kept).toHaveLength(75);
  expect(kept.every((p) => p.lab.L < 30)).toBe(true);
});

test("a clean, textured iris keeps its lighter and darker parts", () => {
  // a hazel iris: brown collarette (L 30) and a lighter green rim (L 48)
  const hazel = [
    ...Array.from({ length: 50 }, () => ({ lab: { L: 30, a: 8, b: 18 } })),
    ...Array.from({ length: 50 }, () => ({ lab: { L: 48, a: -6, b: 14 } })),
  ];
  expect(rejectOutliers(hazel)).toHaveLength(100);
});

test("the shaded upper half of a brown iris doesn't turn it toward blue", () => {
  // lid shadow: the top of the iris darkened to a blue-green gray, as
  // measured on a real brown eye (L* ~20, hue ~200°)
  const shaded = syntheticFace({ right: BROWN, left: BROWN }, { upperIris: [35, 50, 55] });
  const m = measureEyeColor(shaded.imageData, shaded.points);
  expect(m.pie).toBe(-1);
  expect(classifyEyeColor(m).category).toBe("brown");
});

test("a small iris keeps the default pupil cutoff instead of searching sub-pixel rings", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE }, { pupilR: 24 });
  const small = { cx: 100, cy: 100, r: MIN_PUPIL_SEARCH_RADIUS - 1 };
  expect(pupilEdge(imageData, small, eyeOpening(points, "right"))).toBe(RING.inner);
});

test("green pixels are yellowish but outside the warm band; blue-gray ones aren't", () => {
  expect(isGreenPixel({ L: 50, a: -15, b: 15 })).toBe(true); // green, hue 135
  expect(isGreenPixel({ L: 50, a: -4, b: 16 })).toBe(true); // olive, hue 104
  expect(isGreenPixel(rgbToLab(...BLUE))).toBe(false); // b* < 0
  expect(isGreenPixel({ L: 60, a: 0, b: 2 })).toBe(false); // gray: below the chroma floor
  expect(isGreenPixel({ L: 50, a: 3, b: 25 })).toBe(false); // amber: warm band, pigment
  expect(greenShare([{ L: 50, a: -15, b: 15 }, rgbToLab(...BLUE), { L: 30, a: 8, b: 14 }])).toBe(0.5);
});

test("a green iris reads green/hazel, not blue", () => {
  const green = [95, 125, 80];
  const { imageData, points } = syntheticFace({ right: green, left: green });
  const m = measureEyeColor(imageData, points);
  expect(m.pie).toBe(1); // every pixel is on the unpigmented side...
  expect(m.greenShare).toBe(1); // ...and every one of them is green
  expect(classifyEyeColor(m)).toMatchObject({ category: "intermediate", runnerUp: "blue" });
});

test("a blue iris stays blue: no green in it", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE });
  const m = measureEyeColor(imageData, points);
  expect(m.greenShare).toBe(0);
  expect(classifyEyeColor(m).category).toBe("blue");
});

describe("refineIrisCircle", () => {
  // the painted iris: center (100, 100), radius 40 (see syntheticFace)
  const shifted = (dx, scale) => {
    const face = syntheticFace({ right: BROWN, left: BROWN });
    const c = face.points[IRIS.right.center];
    for (const i of [IRIS.right.center, ...IRIS.right.edge]) {
      const p = face.points[i];
      face.points[i] = { x: c.x + dx + (p.x - c.x) * scale, y: c.y + (p.y - c.y) * scale };
    }
    return face;
  };

  // The search moves in steps of r/16 (2.5 px here), and against a painted,
  // perfectly sharp edge every circle within a step fits equally well, so
  // "on the edge" means within about one step.
  test("pulls landmarks that landed off the iris back onto its edge", () => {
    const { imageData, points } = shifted(7, 1.1); // 7 px off-center, 10% too big
    const landmark = irisCircle(points, "right");
    const refined = refineIrisCircle(imageData, landmark, eyeOpening(points, "right"));
    expect(Math.hypot(refined.cx - 100, refined.cy - 100)).toBeLessThan(3.5);
    expect(Math.abs(refined.r - 40)).toBeLessThan(3);
  });

  test("leaves well-placed landmarks where they are", () => {
    const { imageData, points } = shifted(0, 1);
    const refined = refineIrisCircle(imageData, irisCircle(points, "right"), eyeOpening(points, "right"));
    expect(Math.hypot(refined.cx - 100, refined.cy - 100)).toBeLessThan(3);
    expect(Math.abs(refined.r - 40)).toBeLessThan(3);
  });

  test("keeps the landmark circle when there's no edge to find", () => {
    const { points } = shifted(7, 1.1);
    const flat = { width: 400, height: 200, data: new Uint8ClampedArray(400 * 200 * 4).fill(128) };
    const landmark = irisCircle(points, "right");
    expect(refineIrisCircle(flat, landmark, eyeOpening(points, "right"))).toEqual(landmark);
  });
});

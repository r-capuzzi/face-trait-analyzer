import { designedFace } from "../../test/designedFace";
import { fromFrame, measureFaceShape } from "./faceShape";

const neutral = { blendshapes: {}, matrix: null };

test("measures the designed proportions", () => {
  const s = measureFaceShape({ points: designedFace(), ...neutral });
  expect(s.eyes.spacing).toBeCloseTo(30 / 30.15, 2); // corner-to-corner includes the 3 px rise
  expect(s.eyes.tilt).toBeCloseTo(5.71, 1);
  expect(s.eyes.openness).toBeGreaterThan(0.36);
  expect(s.eyes.openness).toBeLessThan(0.42);
  expect(s.nose.toEyeGap).toBeCloseTo(1, 5);
  expect(s.nose.toFaceWidth).toBeCloseTo(30 / 160, 2);
  expect(s.lips.mouthToNose).toBeCloseTo(44 / 30, 5);
  expect(s.lips.lowerToUpper).toBeCloseTo(1.5, 5);
  expect(s.lips.fullness).toBeCloseTo(15 / 44, 5);
  expect([s.eyes.notes, s.nose.notes, s.lips.notes].flat()).toEqual([]);
});

test("a tilted head gives the same ratios and tilt (face-aligned frame)", () => {
  const upright = measureFaceShape({ points: designedFace(), ...neutral });
  const a = (25 * Math.PI) / 180;
  const rotated = designedFace().map(({ x, y }) => ({
    x: 200 + x * Math.cos(a) - y * Math.sin(a),
    y: 50 + x * Math.sin(a) + y * Math.cos(a),
  }));
  const s = measureFaceShape({ points: rotated, ...neutral });
  for (const [part, key] of [
    ["eyes", "spacing"],
    ["eyes", "tilt"],
    ["eyes", "openness"],
    ["nose", "toEyeGap"],
    ["lips", "mouthToNose"],
    ["lips", "lowerToUpper"],
  ]) {
    expect(s[part][key]).toBeCloseTo(upright[part][key], 5);
  }
});

test("downturned outer corners give a negative tilt", () => {
  const pts = designedFace();
  pts[33].y = 103;
  pts[263].y = 103;
  expect(measureFaceShape({ points: pts, ...neutral }).eyes.tilt).toBeLessThan(0);
});

test("a smile flags the lips; squinting flags the eyes; a turned head flags everything", () => {
  const smile = measureFaceShape({
    points: designedFace(),
    blendshapes: { mouthSmileLeft: 0.9, mouthSmileRight: 0.9, eyeSquintLeft: 0.7, eyeSquintRight: 0.7 },
    matrix: null,
  });
  expect(smile.lips.notes.join(" ")).toMatch(/smiling/);
  expect(smile.eyes.notes.join(" ")).toMatch(/squinted/);
  // smiling flares the nose wings too (Beiraghi-Toosi 2016)
  expect(smile.nose.notes.join(" ")).toMatch(/flares the nose/);

  const squintOnly = measureFaceShape({
    points: designedFace(),
    blendshapes: { eyeSquintLeft: 0.7, eyeSquintRight: 0.7 },
    matrix: null,
  });
  expect(squintOnly.nose.notes).toEqual([]);
  expect(squintOnly.lips.notes).toEqual([]);

  const c = Math.cos(Math.PI / 6);
  const s = Math.sin(Math.PI / 6);
  const turned = measureFaceShape({
    points: designedFace(),
    blendshapes: {},
    matrix: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, -50, 1],
  });
  for (const part of ["eyes", "nose", "lips"]) expect(turned[part].notes.join(" ")).toMatch(/turned/);
});

test("fromFrame inverts the face frame back to pixels", () => {
  const s = measureFaceShape({ points: designedFace(), ...neutral });
  const p = fromFrame(s.lines.frame, s.lines.nose.from);
  expect(p.x).toBeCloseTo(85, 5);
  expect(p.y).toBeCloseTo(135, 5);
});

test("collapsed landmarks give null ('not measured'), never NaN", () => {
  const pts = designedFace();
  pts[129] = { ...pts[358] }; // both nose-wing points on top of each other
  const s = measureFaceShape({ points: pts, blendshapes: {}, matrix: null });
  expect(s.nose.toEyeGap).toBe(0);
  expect(s.lips.mouthToNose).toBeNull();
});

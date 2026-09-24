import { MASK } from "../maskCategories";
import { BROW_LINES, IRIS, faceFrame } from "../regions";
import { browArch, measureEyebrows, unibrowLevel } from "./eyebrows";

const W = 300;
const H = 200;
const SKIN = [205, 165, 135];
const BROW = [60, 42, 32];

// Pupils 80 px apart at y = 120. Brow outlines: top edge y = 80, bottom
// edge y = 90, right brow (image left) x 70-130, left brow x 170-230.
function browFace({ browRows = [80, 90], browColor = BROW, unibrow = false, bangsTo = 0 } = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  const mask = { width: W, height: H, data: new Uint8Array(W * H) };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const inBrowRows = y >= browRows[0] && y <= browRows[1];
      const inBrows = (x >= 70 && x <= 130) || (x >= 170 && x <= 230);
      const inGap = x > 130 && x < 170;
      let c = SKIN;
      if (inBrowRows && (inBrows || (unibrow && inGap))) c = browColor;
      mask.data[i] = y < bangsTo ? MASK.HAIR : MASK.FACE_SKIN;
      data.set([...c, 255], i * 4);
    }
  }
  const points = Array.from({ length: 478 }, () => ({ x: 150, y: 150 }));
  points[IRIS.right.center] = { x: 110, y: 120 };
  points[IRIS.left.center] = { x: 190, y: 120 };
  const xs = { right: [70, 85, 100, 115, 130], left: [230, 215, 200, 185, 170] }; // outer -> inner
  for (const side of ["right", "left"]) {
    BROW_LINES[side].upper.forEach((idx, k) => (points[idx] = { x: xs[side][k], y: 80 }));
    BROW_LINES[side].lower.forEach((idx, k) => (points[idx] = { x: xs[side][k], y: 90 }));
  }
  return { imageData: { width: W, height: H, data }, mask, points };
}

const measure = (opts) => {
  const { imageData, mask, points } = browFace(opts);
  return measureEyebrows(imageData, mask, points);
};

test("ordinary brows: well filled, no unibrow", () => {
  const m = measure();
  expect(m.status).toBe("ok");
  expect(m.fill).toBeGreaterThan(0.9);
  expect(m.unibrowLevel).toBe("none");
  expect(m.unibrow).toBe(0);
  // 11 hair rows / 80 px pupil distance
  expect(m.thickness).toBeCloseTo(11 / 80, 2);
});

test("the same rule works on dark skin, because it compares against the person's own skin", () => {
  const { imageData, mask, points } = browFace();
  // repaint: dark skin, darker brows
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const isBrow = d[i] === BROW[0];
    d.set(isBrow ? [28, 20, 16] : [92, 62, 44], i);
  }
  const m = measureEyebrows(imageData, mask, points);
  expect(m.fill).toBeGreaterThan(0.9);
  expect(m.unibrowLevel).toBe("none");
  expect(m.thickness).toBeCloseTo(11 / 80, 2);
});

test("brows thicker than the landmark outline measure thicker", () => {
  const thin = measure();
  const thick = measure({ browRows: [75, 95] });
  expect(thick.thickness).toBeGreaterThan(thin.thickness * 1.6);
});

test("hair across the gap between the brows reads as a unibrow", () => {
  const m = measure({ unibrow: true });
  expect(m.unibrow).toBeGreaterThan(0.35);
  expect(m.unibrowLevel).toBe("high");
});

test("brows close to the skin color are not measured (no false 'sparse' reading)", () => {
  const m = measure({ browColor: [195, 157, 128] });
  expect(m.status).toBe("ok");
  expect(m.thickness).toBeNull();
  expect(m.unibrowLevel).toBeNull();
  expect(m.notes.join(" ")).toMatch(/close to your skin color/);
});

test("bangs over one brow: that brow is left out (not averaged in) and the card says so", () => {
  const { imageData, mask, points } = browFace();
  // hair over the right brow (image left) only
  for (let y = 0; y < 100; y++) for (let x = 0; x < 140; x++) mask.data[y * W + x] = MASK.HAIR;
  const m = measureEyebrows(imageData, mask, points);
  expect(m.notes.join(" ")).toMatch(/only the other one was measured/);
  expect(m.thickness).toBeCloseTo(11 / 80, 2); // the visible brow alone, not halved
  expect(m.fill).toBeGreaterThan(0.9);
});

test("bangs covering the brows make them unmeasurable instead of guessed", () => {
  expect(measure({ bangsTo: 100 }).status).toBe("unmeasurable");
});

test("arch: flat brows measure 0; a raised middle measures its rise over the brow's length", () => {
  const { points } = browFace();
  const f = faceFrame(points);
  expect(browArch(points, f, "right")).toBeCloseTo(0, 5);
  // lift the middle point of the right brow's top edge by 6 px over a 60 px brow
  points[BROW_LINES.right.upper[2]] = { x: 100, y: 74 };
  expect(browArch(points, f, "right")).toBeCloseTo(6 / 60, 5);
  // a middle point BELOW the chord (a sagging brow) doesn't count as arch
  points[BROW_LINES.right.upper[2]] = { x: 100, y: 86 };
  expect(browArch(points, f, "right")).toBe(0);
});

test("unibrow levels follow the study's none / medium / high scale", () => {
  expect(unibrowLevel(0.02)).toBe("none");
  expect(unibrowLevel(0.2)).toBe("medium");
  expect(unibrowLevel(0.5)).toBe("high");
});

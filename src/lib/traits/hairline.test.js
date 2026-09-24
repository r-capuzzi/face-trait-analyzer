import { MASK } from "../maskCategories";
import { BROWS, IRIS, MIDLINE } from "../regions";
import { measureHairline } from "./hairline";

const W = 300;
const H = 400;

// Upright face: pupils y = 200 (60 px apart), nasal root y = 196, nose base
// y = 246 (midface 50 px), brows at y = 180. `hairAt(x)` gives the hair
// mask's lower edge for each column (hair above it, face skin below);
// above y = 20 is background.
function head(hairAt, { hat = false } = {}) {
  const mask = { width: W, height: H, data: new Uint8Array(W * H) };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = MASK.FACE_SKIN;
      if (y < hairAt(x)) c = hat ? MASK.OTHERS : MASK.HAIR;
      if (y < 20) c = MASK.BACKGROUND;
      mask.data[y * W + x] = c;
    }
  }
  const points = Array.from({ length: 478 }, () => ({ x: 150, y: 250 }));
  points[IRIS.right.center] = { x: 120, y: 200 };
  points[IRIS.left.center] = { x: 180, y: 200 };
  points[MIDLINE.nasion] = { x: 150, y: 196 };
  points[MIDLINE.subnasale] = { x: 150, y: 246 };
  for (const i of [...BROWS.right, ...BROWS.left]) points[i] = { x: 150, y: 180 };
  return { imageData: { width: W, height: H }, mask, points };
}

const measure = (hairAt, opts) => {
  const { imageData, mask, points } = head(hairAt, opts);
  return measureHairline(imageData, mask, points);
};

test("a level hairline 50 px above the nasal root gives an upper third equal to the midface (the canon)", () => {
  const m = measure(() => 146);
  expect(m.status).toBe("ok");
  // hair's lowest rows start at y = 145 -> forehead 196 - 145 = 51
  expect(m.upperToMid).toBeCloseTo(51 / 50, 1);
});

test("a higher hairline gives a taller forehead", () => {
  expect(measure(() => 110).upperToMid).toBeGreaterThan(measure(() => 146).upperToMid);
});

test("hair sweeping diagonally across the forehead is flagged as a side part / bangs", () => {
  const m = measure((x) => 60 + (x - 90) * 1.4); // slopes steeply down across the forehead
  expect(m.status).toBe("unmeasurable");
  expect(m.reason).toMatch(/bangs or a side part/);
});

test("straight bangs just above the brows aren't mistaken for a low hairline", () => {
  const m = measure(() => 172);
  expect(m.status).toBe("unmeasurable");
  expect(m.reason).toMatch(/Bangs cover/);
});

test("no hair above the forehead (shaved, bald or cropped) is unmeasurable, not guessed", () => {
  expect(measure(() => 0).status).toBe("unmeasurable");
});

test("a hat is reported as covering the forehead", () => {
  const m = measure(() => 140, { hat: true });
  expect(m.reason).toMatch(/hat/);
});

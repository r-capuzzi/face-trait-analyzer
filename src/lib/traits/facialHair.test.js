import { MASK } from "../maskCategories";
import { BROWS, FACE_TOP, IRIS, JAW_ANGLES, LIP_MIDLINE, MIDLINE, MOUTH_CORNERS } from "../regions";
import { beardLevel, measureFacialHair } from "./facialHair";

const S = 400;
const SKIN = [200, 160, 130];

// Face skin everywhere; pupils at y 200, nose base 262, lips 282-300,
// chin 350, jaw angles at y 320. `paint(x, y)` may override a pixel's color;
// `hairMask(x, y)` may mark pixels as hair in the segmentation mask.
function face({ paint = () => null, hairMask = () => false } = {}) {
  const data = new Uint8ClampedArray(S * S * 4);
  const mask = { width: S, height: S, data: new Uint8Array(S * S) };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      data.set([...(paint(x, y) ?? SKIN), 255], (y * S + x) * 4);
      mask.data[y * S + x] = hairMask(x, y) ? MASK.HAIR : MASK.FACE_SKIN;
    }
  }
  const pts = Array.from({ length: 478 }, () => ({ x: 200, y: 240 }));
  pts[IRIS.right.center] = { x: 170, y: 200 };
  pts[IRIS.left.center] = { x: 230, y: 200 };
  pts[MOUTH_CORNERS.right] = { x: 175, y: 290 };
  pts[MOUTH_CORNERS.left] = { x: 225, y: 290 };
  pts[LIP_MIDLINE.upperTop] = { x: 200, y: 282 };
  pts[LIP_MIDLINE.lowerBottom] = { x: 200, y: 300 };
  pts[MIDLINE.subnasale] = { x: 200, y: 262 };
  pts[MIDLINE.menton] = { x: 200, y: 350 };
  pts[JAW_ANGLES.right] = { x: 130, y: 320 };
  pts[JAW_ANGLES.left] = { x: 270, y: 320 };
  for (const i of [...BROWS.right, ...BROWS.left]) pts[i] = { x: 200, y: 180 };
  pts[FACE_TOP] = { x: 200, y: 130 };
  return { imageData: { width: S, height: S, data }, mask, points: pts };
}

const lowerFace = (y) => y > 266 && y < 345;
// strand texture: alternating dark / darker pixels
const beard = (x, y) => (lowerFace(y) ? ((x * 7 + y * 13) % 5 < 2 ? [40, 30, 24] : [75, 58, 46]) : null);

const run = (opts, blendshapes) => {
  const { imageData, mask, points } = face(opts);
  return measureFacialHair(imageData, mask, points, blendshapes);
};

test("clean skin reads as no facial hair", () => {
  const m = run();
  expect(m.status).toBe("ok");
  expect(m.coverage).toBe(0);
  expect(m.level).toBe("none");
});

test("dark, textured hair across the lower face reads as a full beard", () => {
  const m = run({ paint: beard });
  expect(m.coverage).toBeGreaterThan(0.6);
  expect(m.level).toBe("full");
  expect(m.mustache).toBeGreaterThan(0.6);
});

test("a soft shadow (dark but untextured, like real lighting) is NOT counted as hair", () => {
  // darkens smoothly toward the chin, as a shadow from overhead light would
  const shade = (y) => Math.max(0.55, 1 - Math.max(0, y - 250) / 180);
  const m = run({ paint: (x, y) => SKIN.map((c) => Math.round(c * shade(y))) });
  expect(m.coverage).toBe(0);
});

test("even a hard-edged shadow only trips a sliver at its edge, well under 'light'", () => {
  // the texture window straddling a razor-sharp edge sees contrast there
  const m = run({ paint: (x, y) => (lowerFace(y) ? [120, 92, 74] : null) });
  expect(m.level).toBe("none");
  expect(m.coverage).toBeLessThan(0.05);
});

test("pixels the segmentation model labels as hair count, whatever their texture", () => {
  const m = run({ hairMask: (x, y) => y > 305 && y < 345 });
  expect(m.chin).toBeGreaterThan(0.9);
});

test("smiling leaves the jaw-side zones out and says so", () => {
  const m = run({ paint: beard }, { mouthSmileLeft: 0.8, mouthSmileRight: 0.8 });
  expect(m.sides).toBeNull();
  expect(m.notes.join(" ")).toMatch(/smile lines/);
});

test("coverage maps to none / light / moderate / full", () => {
  expect(beardLevel(0.05)).toBe("none");
  expect(beardLevel(0.2)).toBe("light");
  expect(beardLevel(0.4)).toBe("moderate");
  expect(beardLevel(0.8)).toBe("full");
});

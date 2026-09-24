// Test fixture: a painted "face" with two eyes and the landmark points that
// describe it, so trait code and the full app can be tested without
// MediaPipe or real photos.
import { EYE_OPENING, IRIS } from "../lib/regions";

export const W = 400;
export const H = 200;
export const SKIN = [200, 160, 130];
export const SCLERA = [235, 232, 228];
export const BLUE = [95, 130, 170];
export const BROWN = [100, 62, 32];
const EYES = { right: { cx: 100, cy: 100 }, left: { cx: 300, cy: 100 } };
const IRIS_R = 40;

// Paints two synthetic eyes: sclera ellipse, iris disc, black pupil and a
// white catchlight - the last two must NOT leak into the measurement.
export function syntheticFace(irisColors, { lidHalfHeight = 45, pupilR = 14 } = {}) {
  const data = new Uint8ClampedArray(W * H * 4);
  const points = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = SKIN;
      for (const side of ["right", "left"]) {
        const { cx, cy } = EYES[side];
        const d = Math.hypot(x - cx, y - cy);
        const inLids = ((x - cx) / 55) ** 2 + ((y - cy) / lidHalfHeight) ** 2 <= 1;
        if (!inLids) continue;
        c = SCLERA;
        if (d <= IRIS_R) c = irisColors[side];
        if (d <= pupilR) c = [5, 5, 5]; // pupil
        if (Math.hypot(x - (cx + 15), y - (cy - 12)) <= 5) c = [255, 255, 255]; // catchlight
      }
      data.set([...c, 255], (y * W + x) * 4);
    }
  }
  for (const side of ["right", "left"]) {
    const { cx, cy } = EYES[side];
    points[IRIS[side].center] = { x: cx, y: cy };
    IRIS[side].edge.forEach((idx, k) => {
      const t = (k * Math.PI) / 2;
      points[idx] = { x: cx + IRIS_R * Math.cos(t), y: cy + IRIS_R * Math.sin(t) };
    });
    // eyelid outline: 16 points around the same ellipse the sclera uses
    EYE_OPENING[side].forEach((idx, k) => {
      const t = (k / EYE_OPENING[side].length) * 2 * Math.PI;
      points[idx] = { x: cx + 55 * Math.cos(t), y: cy + lidHalfHeight * Math.sin(t) };
    });
  }
  return { imageData: { width: W, height: H, data }, points };
}

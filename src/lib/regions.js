// Where on the face each trait is sampled. Landmark indices come straight
// from @mediapipe/tasks-vision 1.0.1's FaceLandmarker.FACE_LANDMARKS_* connection
// constants (checked against the installed bundle). "right"/"left" are the
// SUBJECT's own sides, so in an unmirrored photo the right eye is on the
// image's left.

export const IRIS = {
  right: { center: 468, edge: [469, 470, 471, 472] },
  left: { center: 473, edge: [474, 475, 476, 477] },
};

// Eyelid outline as a closed polygon: lower lid corner-to-corner, then the
// upper lid back again (FACE_LANDMARKS_RIGHT_EYE / _LEFT_EYE).
export const EYE_OPENING = {
  right: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  left: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
};

export const BROWS = {
  right: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  left: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
};

export const FACE_TOP = 10; // first/last point of FACE_LANDMARKS_FACE_OVAL
export const MOUTH_CORNERS = { right: 61, left: 291 };

const mean = (pts) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
});
const pick = (points, idx) => idx.map((i) => points[i]);
const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

// Iris as a circle: center landmark + mean distance to its 4 edge landmarks.
export function irisCircle(points, side) {
  const { center, edge } = IRIS[side];
  const c = points[center];
  const r = edge.reduce((s, i) => s + dist(c, points[i]), 0) / edge.length;
  return { cx: c.x, cy: c.y, r };
}

export function eyeOpening(points, side) {
  return pick(points, EYE_OPENING[side]);
}

// Even-odd ray casting. poly: [{x, y}, ...], implicitly closed.
export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function polygonBounds(poly) {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

// A face-aligned frame from the two pupils: `ex` points from the subject's
// right pupil to their left, `ey` points down the face. Using this instead of
// raw image x/y keeps the skin patches in place when the head is tilted.
export function faceFrame(points) {
  const r = points[IRIS.right.center];
  const l = points[IRIS.left.center];
  const iod = dist(r, l); // inter-pupillary distance in pixels: our unit of scale
  const ex = { x: (l.x - r.x) / iod, y: (l.y - r.y) / iod };
  const ey = { x: -ex.y, y: ex.x };
  return { right: r, left: l, mid: mean([r, l]), iod, ex, ey };
}

// Skin sample patches as circles, placed by proportion rather than by
// individual mesh vertices so they don't depend on memorizing indices:
//  - cheeks: below each pupil, halfway down to mouth-corner level, nudged
//    slightly outward onto the cheekbone (away from the nose's side shadow)
//  - forehead: halfway between the brow line and the top of the face mesh
// Radii scale with inter-pupillary distance. The face-skin mask is applied
// on top, so beard, glasses and bangs inside a circle are still excluded.
export function skinPatches(points) {
  const f = faceFrame(points);
  const mouth = mean(pick(points, [MOUTH_CORNERS.right, MOUTH_CORNERS.left]));
  const mouthDrop = (mouth.x - f.mid.x) * f.ey.x + (mouth.y - f.mid.y) * f.ey.y;
  const along = (p, u, s) => ({ x: p.x + u.x * s, y: p.y + u.y * s });

  const cheek = (pupil, outward) =>
    along(along(pupil, f.ey, 0.5 * mouthDrop), f.ex, outward * 0.08 * f.iod);

  const brow = mean(pick(points, [...BROWS.right, ...BROWS.left]));
  const top = points[FACE_TOP];
  const forehead = { x: (brow.x + top.x) / 2, y: (brow.y + top.y) / 2 };

  return [
    { name: "right cheek", ...toCircle(cheek(f.right, -1), 0.17 * f.iod) },
    { name: "left cheek", ...toCircle(cheek(f.left, +1), 0.17 * f.iod) },
    { name: "forehead", ...toCircle(forehead, Math.min(0.2 * f.iod, 0.45 * dist(brow, top))) },
  ];
}

function toCircle(c, r) {
  return { cx: c.x, cy: c.y, r };
}

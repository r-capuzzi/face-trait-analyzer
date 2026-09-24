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

// The same points as two chains per brow (FACE_LANDMARKS_*_EYEBROW), each
// ordered from the outer end to the inner end. Plotted on a test photo,
// the upper chain runs along the top edge of the brow and the lower chain
// along its bottom edge.
export const BROW_LINES = {
  right: { upper: [70, 63, 105, 66, 107], lower: [46, 53, 52, 65, 55] },
  left: { upper: [300, 293, 334, 296, 336], lower: [276, 283, 282, 295, 285] },
};

export const FACE_TOP = 10; // first/last point of FACE_LANDMARKS_FACE_OVAL
export const MOUTH_CORNERS = { right: 61, left: 291 };

// Eye corners: the two ends of each FACE_LANDMARKS_*_EYE contour. Which one
// is the inner corner is decided geometrically (nearer the other eye), so
// nothing depends on remembering the mesh's conventions.
export const EYE_CORNERS = { right: [33, 133], left: [263, 362] };

// Lip midline points from FACE_LANDMARKS_LIPS: top of the upper lip, the
// two inner lip edges, bottom of the lower lip.
export const LIP_MIDLINE = { upperTop: 0, upperInner: 13, lowerInner: 14, lowerBottom: 17 };

// Widest points of the nose wings (alare). The package has no nose contour
// constant, so these were checked visually: plotted on a neutral-faced test
// photo, 129/358 sit on the outer edge of each nose wing where it meets the
// cheek, while 64/294 and 98/327 sit lower, at the base of the nose wings.
export const NOSE_ALAR = { right: 129, left: 358 };

// Midline and jaw landmarks for face proportions, each checked by plotting
// candidates on a test photo: 168 sits at the nasal root between the eyes
// (nasion), 2 where the nose meets the upper lip (subnasale; 164 is lower,
// on the philtrum), 152 at the bottom of the chin (menton), and 172/397
// where the jawline turns (gonion; 58/288 sit higher, near the ears).
export const MIDLINE = { nasion: 168, subnasale: 2, menton: 152 };
export const JAW_ANGLES = { right: 172, left: 397 };

// Cupid's bow: the two peaks of the upper lip and the dip between them
// (from FACE_LANDMARKS_LIPS; the dip, 0, plotted lower than both peaks).
export const CUPIDS_BOW = { peaks: [37, 267], dip: 0 };

export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

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

// Pixel coordinates <-> the face frame (u along the pupils, v down the face).
export function toFrame(f, p) {
  const dx = p.x - f.mid.x;
  const dy = p.y - f.mid.y;
  return { u: dx * f.ex.x + dy * f.ex.y, v: dx * f.ey.x + dy * f.ey.y };
}

export function fromFrame(f, { u, v }) {
  return { x: f.mid.x + u * f.ex.x + v * f.ey.x, y: f.mid.y + u * f.ex.y + v * f.ey.y };
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

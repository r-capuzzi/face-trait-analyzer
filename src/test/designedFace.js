import { EYE_CORNERS, EYE_OPENING, FACE_OVAL, IRIS, LIP_MIDLINE, NOSE_ALAR } from "../lib/regions";

// A face drawn to known proportions (image x/y, subject's right on the left):
//   eyes 30 px wide with a 30 px gap -> spacing 1.0
//   eye openings 12 px tall           -> openness 0.4
//   outer corners 3 px above inner    -> tilt atan(3/30) = 5.71°
//   nose 30 px wide, face 160 px wide -> 1.0x eye gap, 0.1875 of face width
//   mouth 44 px, lips 6 px over 9 px  -> 1.47x nose, lower/upper 1.5
export function designedFace() {
  const pts = Array.from({ length: 478 }, () => ({ x: 100, y: 130 }));
  pts[IRIS.right.center] = { x: 70, y: 100 };
  pts[IRIS.left.center] = { x: 130, y: 100 };
  const eyes = { right: { inner: 85, outer: 55 }, left: { inner: 115, outer: 145 } };
  for (const side of ["right", "left"]) {
    const { inner, outer } = eyes[side];
    // the code decides inner vs. outer geometrically; here 33/263 go outside
    const [a, b] = EYE_CORNERS[side];
    pts[a] = { x: outer, y: 97 };
    pts[b] = { x: inner, y: 100 };
    // lid outline: an ellipse between the corners, 12 px tall
    const cx = (inner + outer) / 2;
    EYE_OPENING[side]
      .filter((i) => i !== a && i !== b)
      .forEach((i, k, arr) => {
        const t = ((k + 0.5) / arr.length) * 2 * Math.PI;
        pts[i] = { x: cx + 14 * Math.cos(t), y: 98.5 + 6 * Math.sin(t) };
      });
  }
  FACE_OVAL.forEach((i, k) => {
    const t = (k / FACE_OVAL.length) * 2 * Math.PI;
    pts[i] = { x: 100 + 80 * Math.sin(t), y: 130 - 110 * Math.cos(t) };
  });
  pts[NOSE_ALAR.right] = { x: 85, y: 135 };
  pts[NOSE_ALAR.left] = { x: 115, y: 135 };
  pts[61] = { x: 78, y: 160 };
  pts[291] = { x: 122, y: 160 };
  pts[LIP_MIDLINE.upperTop] = { x: 100, y: 150 };
  pts[LIP_MIDLINE.upperInner] = { x: 100, y: 156 };
  pts[LIP_MIDLINE.lowerInner] = { x: 100, y: 158 };
  pts[LIP_MIDLINE.lowerBottom] = { x: 100, y: 167 };
  return pts;
}

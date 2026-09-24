// Face shape: proportions measured from landmarks, always as RATIOS within
// the person's own face (nose width vs. the gap between the eyes, etc.).
// Ratios cancel out photo size and camera distance's overall scale, and -
// deliberately - there are no population "norms" or wide/narrow labels:
// published norms are split by ethnic group, and this app never compares a
// person to a group. The only reference points shown are the neoclassical
// art "canons", as a myth to test (Farkas 1985 found most real faces don't
// match them).
//
// All distances are measured in the face-aligned frame from regions.js
// (ex = along the line between the pupils, ey = down the face), so a tilted
// head doesn't change the numbers.

import {
  CUPIDS_BOW,
  EYE_CORNERS,
  EYE_OPENING,
  FACE_OVAL,
  JAW_ANGLES,
  LIP_MIDLINE,
  MIDLINE,
  MOUTH_CORNERS,
  NOSE_ALAR,
  faceFrame,
  fromFrame,
  toFrame,
} from "../regions";
import { offAxisDegrees } from "../quality";

// Expression limits (MediaPipe blendshape scores, 0..1). Provisional,
// chosen from the two test photos: a broad grin scored ~0.95 smile / ~0.7
// squint, a closed-lip smile ~0.6 smile / ~0.4 squint.
export const EXPRESSION = {
  smile: 0.5, // smiling stretches the mouth wider and thins the lips
  jawOpen: 0.2, // an open mouth changes lip heights
  // The chin drops as soon as the lips part: a toothy grin (jawOpen 0.12 on a
  // test photo) measured a clearly shorter midface-to-lower-face ratio than a
  // closed-mouth face (0.62 vs 0.83), so face proportions use a lower bar.
  jawOpenFace: 0.1,
  squint: 0.5, // squinting or smiling narrows the eye opening
  blink: 0.35,
};
export const MAX_TURN_DEG = 20; // widths foreshorten and the nose shifts sideways

const avg = (a, b) => ((a ?? 0) + (b ?? 0)) / 2;
// A ratio whose denominator collapsed (degenerate landmarks) is "not measured", never NaN/Infinity.
const ratio = (a, b) => (b > 1e-6 && Number.isFinite(a) ? a / b : null);

export { fromFrame }; // the overlay converts measurement lines back to pixels

function eyeMeasures(f, points, side) {
  const [a, b] = EYE_CORNERS[side].map((i) => toFrame(f, points[i]));
  // the inner corner is the one nearer the face's midline
  const [inner, outer] = Math.abs(a.u) < Math.abs(b.u) ? [a, b] : [b, a];
  const width = Math.hypot(outer.u - inner.u, outer.v - inner.v);

  // height: the eye opening's extent perpendicular to the corner-to-corner axis
  const axis = { u: (outer.u - inner.u) / width, v: (outer.v - inner.v) / width };
  const perp = EYE_OPENING[side].map((i) => {
    const p = toFrame(f, points[i]);
    return (p.u - inner.u) * -axis.v + (p.v - inner.v) * axis.u;
  });
  const height = Math.max(...perp) - Math.min(...perp);

  // canthal tilt: positive when the outer corner sits higher than the inner
  // one (v grows downward, so "higher" is a smaller v)
  const tilt = (Math.atan2(inner.v - outer.v, Math.abs(outer.u - inner.u)) * 180) / Math.PI;
  return { width, height, tilt, inner, outer };
}

export function measureFaceShape(face) {
  const { points, blendshapes: bs = {}, matrix } = face;
  const f = faceFrame(points);
  const P = (i) => toFrame(f, points[i]);

  const right = eyeMeasures(f, points, "right");
  const left = eyeMeasures(f, points, "left");
  const eyeWidth = (right.width + left.width) / 2;
  const intercanthal = Math.abs(left.inner.u - right.inner.u);

  // Widest span of the face outline. Plotted on a test photo, its extremes
  // sit where the face meets the ears at eye level - close to the cheekbone
  // (bizygomatic) width anatomists use, so treat it as an approximation.
  const ovalU = FACE_OVAL.map((i) => P(i).u);
  const faceWidth = Math.max(...ovalU) - Math.min(...ovalU);

  const noseWidth = Math.abs(P(NOSE_ALAR.left).u - P(NOSE_ALAR.right).u);
  const mouthR = P(MOUTH_CORNERS.right);
  const mouthL = P(MOUTH_CORNERS.left);
  const mouthWidth = Math.hypot(mouthL.u - mouthR.u, mouthL.v - mouthR.v);
  const upperLip = P(LIP_MIDLINE.upperInner).v - P(LIP_MIDLINE.upperTop).v;
  const lowerLip = P(LIP_MIDLINE.lowerBottom).v - P(LIP_MIDLINE.lowerInner).v;
  // Cupid's bow: how far the center dip sits below the two peaks (v grows
  // downward); a flat upper lip gives ~0, never negative
  const bowPeaks = (P(CUPIDS_BOW.peaks[0]).v + P(CUPIDS_BOW.peaks[1]).v) / 2;
  const bowDepth = Math.max(0, P(CUPIDS_BOW.dip).v - bowPeaks);

  // Vertical face sections along the midline (measured down the face frame)
  const nasion = P(MIDLINE.nasion);
  const subnasale = P(MIDLINE.subnasale);
  const menton = P(MIDLINE.menton);
  const faceHeight = menton.v - nasion.v; // nasal root to chin: the face below the brows
  const midface = subnasale.v - nasion.v;
  const lowerFace = menton.v - subnasale.v;
  // chin height: from the bottom edge of the lower lip down to the chin
  const lipBottom = P(LIP_MIDLINE.lowerBottom);
  const chinHeight = menton.v - lipBottom.v;
  const jawR = P(JAW_ANGLES.right);
  const jawL = P(JAW_ANGLES.left);
  const jawWidth = Math.abs(jawL.u - jawR.u);

  // What in this photo distorts which measurement.
  const turn = offAxisDegrees(matrix);
  const turned = turn !== null && turn > MAX_TURN_DEG;
  const smiling = avg(bs.mouthSmileLeft, bs.mouthSmileRight) > EXPRESSION.smile;
  const mouthOpen = (bs.jawOpen ?? 0) > EXPRESSION.jawOpen;
  const squinting =
    avg(bs.eyeSquintLeft, bs.eyeSquintRight) > EXPRESSION.squint ||
    avg(bs.eyeBlinkLeft, bs.eyeBlinkRight) > EXPRESSION.blink;
  const turnNote = "Your head is turned, which foreshortens widths and shifts the nose sideways.";

  return {
    status: "ok",
    eyes: {
      openness: ratio(right.height / right.width + left.height / left.width, 2),
      tilt: Number.isFinite(right.tilt + left.tilt) ? (right.tilt + left.tilt) / 2 : null,
      spacing: ratio(intercanthal, eyeWidth),
      notes: [
        squinting && "Your eyes look squinted or partly closed (smiling does this), so they measure less open than at rest.",
        turned && turnNote,
      ].filter(Boolean),
    },
    nose: {
      toEyeGap: ratio(noseWidth, intercanthal),
      toFaceWidth: ratio(noseWidth, faceWidth),
      notes: [
        // the nose base widened on smiling in 92% of 50 people (Beiraghi-Toosi 2016)
        smiling && "You're smiling, and smiling flares the nose wings, so your nose measures wider than at rest.",
        turned && turnNote,
      ].filter(Boolean),
    },
    lips: {
      mouthToNose: ratio(mouthWidth, noseWidth),
      lowerToUpper: ratio(lowerLip, upperLip),
      fullness: ratio(upperLip + lowerLip, mouthWidth),
      bow: ratio(bowDepth, upperLip),
      notes: [
        smiling && "You're smiling, which stretches the mouth wider and thins the lips.",
        mouthOpen && "Your mouth is open, which changes the lip measurements.",
        turned && turnNote,
      ].filter(Boolean),
    },
    face: {
      widthToHeight: ratio(faceWidth, faceHeight),
      midToLower: ratio(midface, lowerFace),
      jawToFace: ratio(jawWidth, faceWidth),
      chinToLower: ratio(chinHeight, lowerFace),
      notes: [
        (bs.jawOpen ?? 0) > EXPRESSION.jawOpenFace &&
          "Your mouth is open (even slightly, as in a toothy smile), which lengthens the lower face.",
        turned && "Your head is turned or tilted, which foreshortens heights and widths unevenly.",
      ].filter(Boolean),
    },
    // face-frame geometry for the overlay (convert with fromFrame)
    lines: {
      eyes: [right, left].map((e) => ({ from: e.inner, to: e.outer })),
      eyeGap: { from: right.inner, to: left.inner },
      nose: { from: P(NOSE_ALAR.right), to: P(NOSE_ALAR.left) },
      mouth: { from: mouthR, to: mouthL },
      lips: { from: P(LIP_MIDLINE.upperTop), to: P(LIP_MIDLINE.lowerBottom) },
      // ticks: base of the nose, bottom of the lower lip (where the chin starts)
      faceHeight: { from: nasion, to: menton, marks: [subnasale, lipBottom] },
      jaw: { from: jawR, to: jawL },
      frame: f,
    },
  };
}

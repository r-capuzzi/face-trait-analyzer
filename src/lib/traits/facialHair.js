// Facial hair: how much of the mustache, chin and jaw zones reads as hair.
// Same principle as the eyebrows: compare against the person's own skin
// (the forehead, where facial hair doesn't grow), so it works on any skin
// tone. A pixel also counts if the segmentation mask calls it hair - full
// beards are often labeled as hair rather than face skin.
//
// The zones stop short of the shadow under the lower lip, the nostrils and
// the jawline's edge, which would otherwise read as dark "hair", and only
// pixels inside the face outline count: long scalp hair framing the chin is
// labeled hair by the segmenter, and a wide smile stretches the zones (sized
// from the mouth) out past the jaw. That was a false "light beard" on a
// smiling, long-haired test photo. The clean-shaven test photos must read as
// (near) zero.

import { MASK } from "../maskCategories";
import { isClipped, maskAt, samplePixels } from "../pixels";
import { offAxisDegrees } from "../quality";
import { MAX_TURN_DEG } from "./faceShape";
import {
  FACE_OVAL,
  JAW_ANGLES,
  LIP_MIDLINE,
  MIDLINE,
  MOUTH_CORNERS,
  faceFrame,
  fromFrame,
  pointInPolygon,
  polygonBounds,
  skinPatches,
  toFrame,
} from "../regions";
import { median, trimByPercentile } from "../stats";

// Provisional (CALIBRATE): checked on four clean-shaven faces (all "none")
// and one real beard (close-trimmed stubble covering the jaw: "full").
export const BEARD_RULE = {
  // darker than the forehead by the larger of these: stricter than the
  // brow rule because lower-face shadows (folds, under the lip) are deeper
  minDarkerL: 10,
  darkerShare: 0.22,
  // and textured: minimum local lightness spread (8-bit luma SD) - hair is
  // grainy strand by strand, shadows are smooth
  minTexture: 6,
  minPixels: 40,
  // coverage share -> label
  light: 0.12,
  moderate: 0.35,
  full: 0.6,
};

const quad = (f, corners) => corners.map((c) => fromFrame(f, c));

export function beardZones(points, { smiling = false } = {}) {
  const f = faceFrame(points);
  const P = (i) => toFrame(f, points[i]);
  const sn = P(MIDLINE.subnasale);
  const lipTop = P(LIP_MIDLINE.upperTop);
  const lipBottom = P(LIP_MIDLINE.lowerBottom);
  const menton = P(MIDLINE.menton);
  const mR = P(MOUTH_CORNERS.right);
  const mL = P(MOUTH_CORNERS.left);
  const jR = P(JAW_ANGLES.right);
  const jL = P(JAW_ANGLES.left);

  // Centered on the mouth, not the pupils' midpoint: with the head turned
  // even slightly the two differ, and the zones must stay over the lips.
  const mouthMid = (mR.u + mL.u) / 2;
  // ~90% of the mouth's width; a smile stretches the mouth into the cheek
  // folds, so then only ~70%
  const half = (smiling ? 0.35 : 0.45) * Math.abs(mL.u - mR.u);

  // mustache: between the nose base and the upper lip; starts 25% below the
  // nose base to skip the nostrils
  const mTop = sn.v + 0.25 * (lipTop.v - sn.v);
  const mBot = lipTop.v - 0.1 * (lipTop.v - sn.v);
  const mustache = quad(f, [
    { u: mouthMid - half, v: mTop },
    { u: mouthMid + half, v: mTop },
    { u: mouthMid + half, v: mBot },
    { u: mouthMid - half, v: mBot },
  ]);

  // chin: below the lower lip's shadow, above the jaw's edge
  const cTop = lipBottom.v + 0.3 * (menton.v - lipBottom.v);
  const cBot = menton.v - 0.2 * (menton.v - lipBottom.v); // clear of the chin's shadowed underside
  const chin = quad(f, [
    { u: mouthMid - half, v: cTop },
    { u: mouthMid + half, v: cTop },
    { u: mouthMid + half, v: cBot },
    { u: mouthMid - half, v: cBot },
  ]);

  // jaw sides: from beside the mouth corner out toward the jaw angle. Inset
  // well away from the face's edge and kept above the jawline - on the test
  // photos both were shadow bands that read as "hair".
  const side = (m, j, dir) => {
    const inner = m.u + dir * 0.15 * Math.abs(j.u - m.u);
    const outer = j.u - dir * 0.35 * Math.abs(j.u - m.u);
    const top = m.v;
    const bottom = Math.min(cBot, j.v + 0.3 * (menton.v - j.v));
    return quad(f, [
      { u: inner, v: top },
      { u: outer, v: top },
      { u: outer, v: bottom },
      { u: inner, v: bottom },
    ]);
  };
  return {
    mustache,
    chin,
    sides: [side(mR, jR, -1), side(mL, jL, +1)],
  };
}

// Local texture: the standard deviation of lightness in a small window around
// each pixel. Hair and stubble are textured strand by strand; a shadow is a
// smooth gradient. Computed from the image's own luma over the zone's box.
function localTexture(imageData, box, radius) {
  const { width, height, data } = imageData;
  const x0 = Math.max(0, Math.floor(box.x0) - radius);
  const y0 = Math.max(0, Math.floor(box.y0) - radius);
  const x1 = Math.min(width - 1, Math.ceil(box.x1) + radius);
  const y1 = Math.min(height - 1, Math.ceil(box.y1) + radius);
  const bw = x1 - x0 + 1;
  const luma = (x, y) => {
    const i = (y * width + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const sd = (x, y) => {
    let s = 0;
    let s2 = 0;
    let n = 0;
    for (let yy = Math.max(y0, y - radius); yy <= Math.min(y1, y + radius); yy++) {
      for (let xx = Math.max(x0, x - radius); xx <= Math.min(x1, x + radius); xx++) {
        const v = luma(xx, yy);
        s += v;
        s2 += v * v;
        n++;
      }
    }
    return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
  };
  return { sd, bw };
}

function zonePixels(imageData, mask, poly, radius, face) {
  const { width: w, height: h } = imageData;
  const box = polygonBounds(poly);
  const { sd } = localTexture(imageData, box, radius);
  return samplePixels(imageData, box, (x, y) => {
    if (!pointInPolygon(x, y, poly) || !pointInPolygon(x, y, face)) return false;
    const c = maskAt(mask, x, y, w, h);
    return c === MASK.FACE_SKIN || c === MASK.HAIR;
  })
    .filter((p) => !isClipped(p))
    .map((p) => ({
      ...p,
      maskHair: maskAt(mask, p.x + 0.5, p.y + 0.5, w, h) === MASK.HAIR,
      texture: sd(p.x, p.y),
    }));
}

export function beardLevel(share) {
  if (share >= BEARD_RULE.full) return "full";
  if (share >= BEARD_RULE.moderate) return "moderate";
  if (share >= BEARD_RULE.light) return "light";
  return "none";
}

// A smile carves deep, textured folds right beside the mouth - exactly the
// jaw-side zones - which read as hair on a clean-shaven test photo.
const SMILE_SCORE = 0.5;

export function measureFacialHair(imageData, mask, points, blendshapes = {}, matrix = null) {
  const { width: w, height: h } = imageData;
  const smiling = ((blendshapes.mouthSmileLeft ?? 0) + (blendshapes.mouthSmileRight ?? 0)) / 2 > SMILE_SCORE;
  // Reference skin: the upper-cheek patches. They're lit much like the lower
  // face (the forehead faces the light and made every lower-face shadow look
  // "darker than skin"), and sit above where most beards grow.
  const cheeks = skinPatches(points).filter((p) => p.name.endsWith("cheek"));
  const ref = trimByPercentile(
    cheeks.flatMap((c) =>
      samplePixels(
        imageData,
        { x0: c.cx - c.r, y0: c.cy - c.r, x1: c.cx + c.r, y1: c.cy + c.r },
        (x, y) => Math.hypot(x - c.cx, y - c.cy) <= c.r && maskAt(mask, x, y, w, h) === MASK.FACE_SKIN
      )
    ).filter((p) => !isClipped(p)),
    (p) => p.lab.L,
    0.2,
    0.9
  );
  if (ref.length < BEARD_RULE.minPixels) {
    return {
      status: "unmeasurable",
      reason: "Your cheeks aren't clearly visible, and they're needed as the skin reference for this measurement.",
    };
  }
  const refL = median(ref.map((p) => p.lab.L));
  const cutoff = refL - Math.max(BEARD_RULE.minDarkerL, BEARD_RULE.darkerShare * refL);
  // texture scale follows the face's size in the photo
  const radius = Math.max(2, Math.round(faceFrame(points).iod / 40));
  const isHair = (p) => p.maskHair || (p.lab.L < cutoff && p.texture >= BEARD_RULE.minTexture);

  const zones = beardZones(points, { smiling });
  const outline = FACE_OVAL.map((i) => points[i]);
  const measureZone = (poly) => {
    const px = zonePixels(imageData, mask, poly, radius, outline);
    return px.length >= BEARD_RULE.minPixels
      ? { share: px.filter(isHair).length / px.length, hair: px.filter(isHair), count: px.length }
      : null;
  };
  const mustache = measureZone(zones.mustache);
  const chin = measureZone(zones.chin);
  const sides = smiling ? [] : zones.sides.map(measureZone).filter(Boolean);
  const parts = [mustache, chin, ...sides].filter(Boolean);
  if (parts.length < 2) {
    return {
      status: "unmeasurable",
      reason: "The lower face isn't clearly visible (a mask, hand or scarf may cover it).",
    };
  }
  const total = parts.reduce((s, p) => s + p.count, 0);
  const coverage = parts.reduce((s, p) => s + p.share * p.count, 0) / total;
  const sideCount = sides.reduce((s, p) => s + p.count, 0);
  const turn = offAxisDegrees(matrix);
  return {
    status: "ok",
    coverage,
    level: beardLevel(coverage),
    mustache: mustache?.share ?? null,
    chin: chin?.share ?? null,
    sides: sides.length ? sides.reduce((s, p) => s + p.share * p.count, 0) / sideCount : null,
    notes: [
      smiling &&
        "You're smiling, so the areas beside your mouth (where smile lines form) were left out; only the mustache and chin areas were measured.",
      // a tilted-back or turned head brings the jaw's shadowed underside
      // into the zones (22% of a clean-shaven chin on a test photo shot
      // from below)
      turn !== null &&
        turn > MAX_TURN_DEG &&
        "Your head is tilted or turned, so shadows under your jaw may have been counted. A straight-on photo gives a truer reading.",
    ].filter(Boolean),
    regions: {
      zones: [zones.mustache, zones.chin, ...(smiling ? [] : zones.sides)],
      hair: parts.flatMap((p) => p.hair),
    },
  };
}

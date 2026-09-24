// Eyebrows: unibrow, thickness and fill, found by CONTRAST with the skin
// right above each brow. The segmentation model labels brows as face skin
// (checked on a test photo), so hair has to be told apart by darkness, and
// comparing against the person's own nearby skin makes the same rule work
// for any skin tone.
//
// Adhikari et al. (2016) scored monobrow (none / medium / high) and eyebrow
// thickness (low / medium / high) from photos - in men only, because "most
// women modified their eyebrows". Grooming changes exactly what's measured
// here, so the card always says so.

import { MASK } from "../maskCategories";
import { isClipped, maskAt, samplePixels } from "../pixels";
import { BROW_LINES, faceFrame, pointInPolygon, polygonBounds } from "../regions";
import { median, trimByPercentile } from "../stats";

// Provisional values - CALIBRATE on labeled photos.
export const BROW_RULE = {
  // a pixel is brow hair if it's this much darker (in L*) than the skin just
  // above the brow: the larger of a fixed floor and a share of that skin's
  // lightness, so light skin needs a bigger step than dark skin
  minDarkerL: 8,
  darkerShare: 0.18,
  // below this contrast the brows are too light (or fine) to tell from skin
  minContrast: 6,
  // share of the between-brows gap that reads as hair -> the study's scale
  unibrowMedium: 0.1,
  unibrowHigh: 0.35,
  // the thickness band extends past the landmark outline by this share of
  // the outline's height on each side, to catch brows thicker than the model's estimate
  bandGrow: 0.5,
  minPixels: 30,
  // a brow less visible than this (bangs, glasses) is left out, not averaged in
  minVisible: 0.7,
};

const pick = (points, idx) => idx.map((i) => points[i]);
const along = (p, u, s) => ({ x: p.x + u.x * s, y: p.y + u.y * s });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Skin that can contain brow hair: face skin only (drops bangs, glasses frames).
const isSkin = (mask, w, h) => (x, y) => maskAt(mask, x, y, w, h) === MASK.FACE_SKIN;

function pixelsIn(imageData, poly, keep) {
  return samplePixels(imageData, polygonBounds(poly), (x, y) => pointInPolygon(x, y, poly) && keep(x, y)).filter(
    (p) => !isClipped(p)
  );
}

function measureBrow(imageData, mask, points, f, side) {
  const { width: w, height: h } = imageData;
  const skin = isSkin(mask, w, h);
  const upper = pick(points, BROW_LINES[side].upper);
  const lower = pick(points, BROW_LINES[side].lower);
  // local outline height at each of the 5 stations, measured down the face
  const gaps = upper.map((u, i) => (lower[i].x - u.x) * f.ey.x + (lower[i].y - u.y) * f.ey.y);

  const outline = [...upper, ...[...lower].reverse()];
  const band = [
    ...upper.map((u, i) => along(u, f.ey, -BROW_RULE.bandGrow * gaps[i])),
    ...lower.map((l, i) => along(l, f.ey, BROW_RULE.bandGrow * gaps[i])).reverse(),
  ];
  // reference skin: a strip of forehead just above the band
  const bandTop = upper.map((u, i) => along(u, f.ey, -BROW_RULE.bandGrow * gaps[i]));
  const strip = [...bandTop, ...bandTop.map((p, i) => along(p, f.ey, -0.8 * gaps[i])).reverse()];

  const refPixels = trimByPercentile(pixelsIn(imageData, strip, skin), (p) => p.lab.L, 0.2, 0.9);
  const outlinePixels = pixelsIn(imageData, outline, skin);
  const bandPixels = pixelsIn(imageData, band, skin);
  // share of the outline that is visible skin rather than bangs / glasses
  const outlineArea = pixelsIn(imageData, outline, () => true).length;
  return {
    side,
    visible: outlineArea ? outlinePixels.length / outlineArea : 0,
    outline,
    band,
    length: dist(upper[0], upper[upper.length - 1]),
    refL: refPixels.length >= BROW_RULE.minPixels ? median(refPixels.map((p) => p.lab.L)) : null,
    outlinePixels,
    bandPixels,
    inner: { upper: upper.at(-1), lower: lower.at(-1) },
    gaps,
  };
}

const darkerThan = (refL) => refL - Math.max(BROW_RULE.minDarkerL, BROW_RULE.darkerShare * refL);

export function unibrowLevel(share) {
  if (share >= BROW_RULE.unibrowHigh) return "high";
  if (share >= BROW_RULE.unibrowMedium) return "medium";
  return "none";
}

export function measureEyebrows(imageData, mask, points) {
  const f = faceFrame(points);
  const brows = ["right", "left"].map((side) => measureBrow(imageData, mask, points, f, side));
  const refs = brows.map((b) => b.refL).filter((v) => v !== null);
  // brows clear enough to measure thickness and fill from
  const clear = brows.filter(
    (b) => b.visible >= BROW_RULE.minVisible && b.outlinePixels.length >= BROW_RULE.minPixels
  );
  if (refs.length === 0 || clear.length === 0) {
    return {
      status: "unmeasurable",
      reason:
        "Your eyebrows or the skin above them aren't clearly visible (bangs, glasses or a crop may cover them).",
    };
  }
  const refL = median(refs);
  const cutoff = darkerThan(refL);
  const isHair = (p) => p.lab.L < cutoff;

  // How far the brows stand out from the skin: median brow-outline lightness vs. skin.
  const contrast = refL - median(clear.flatMap((b) => b.outlinePixels.map((p) => p.lab.L)));

  // Between the brows: from one inner end to the other, over the band's height,
  // keeping the middle 60% so the brows' own inner ends aren't counted.
  const [r, l] = brows;
  const shrink = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const ru = along(r.inner.upper, f.ey, -BROW_RULE.bandGrow * r.gaps.at(-1));
  const lu = along(l.inner.upper, f.ey, -BROW_RULE.bandGrow * l.gaps.at(-1));
  const rl = along(r.inner.lower, f.ey, BROW_RULE.bandGrow * r.gaps.at(-1));
  const ll = along(l.inner.lower, f.ey, BROW_RULE.bandGrow * l.gaps.at(-1));
  const gap = [shrink(ru, lu, 0.2), shrink(ru, lu, 0.8), shrink(rl, ll, 0.8), shrink(rl, ll, 0.2)];
  const { width: w, height: h } = imageData;
  const gapPixels = pixelsIn(imageData, gap, isSkin(mask, w, h));

  const notes = [];
  if (clear.length === 1) {
    notes.push("One eyebrow is partly covered (by hair or glasses), so only the other one was measured.");
  }
  const lowContrast = contrast < BROW_RULE.minContrast;
  if (lowContrast) {
    notes.push(
      "Your brows are close to your skin color in this photo (light or fine brows, or bright light), so hair can't be reliably told apart from skin."
    );
  }
  const unibrow = gapPixels.length >= BROW_RULE.minPixels ? gapPixels.filter(isHair).length / gapPixels.length : null;

  return {
    status: "ok",
    // thickness: hair area / brow length = average brow height, in units of pupil distance
    thickness: lowContrast
      ? null
      : clear.reduce((s, b) => s + b.bandPixels.filter(isHair).length / b.length, 0) / clear.length / f.iod,
    fill: lowContrast
      ? null
      : clear.reduce((s, b) => s + b.outlinePixels.filter(isHair).length / b.outlinePixels.length, 0) /
        clear.length,
    unibrow: lowContrast ? null : unibrow,
    unibrowLevel: lowContrast || unibrow === null ? null : unibrowLevel(unibrow),
    contrast,
    notes,
    // overlay geometry
    regions: {
      brows: brows.map((b) => ({ outline: b.outline, hair: b.bandPixels.filter(isHair) })),
      gap,
      gapHair: gapPixels.filter(isHair),
    },
  };
}

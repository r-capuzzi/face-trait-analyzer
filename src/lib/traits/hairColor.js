// Hair color from the segmentation mask's hair pixels.
//
// Honesty constraint from Vaughn et al. (2009): hair color measured from
// digital photos only moderately matches a spectrophotometer (r = 0.63 /
// 0.59 / 0.51 for L*, a*, b*) and reads ~33 L* units lighter on average;
// accuracy falls as the number of categories grows. Consequences here:
//  - thresholds are in PHOTO space (lab-instrument values don't transfer),
//  - few categories (the HIrisPlex set: black, brown, blond, red + gray),
//  - hair confidence is capped at "medium" in confidence.js.

import { classifyBands } from "../bands";
import { chroma, hueAngle } from "../color";
import { isClipped, maskAt, samplePixels } from "../pixels";
import { faceFrame } from "../regions";
import { medianLab, trimByPercentile } from "../stats";
import { MASK } from "../maskCategories";

export const MIN_HAIR_PIXELS = 200;
const TARGET_SAMPLES = 40000; // stride is chosen to sample about this many

// Provisional, physically motivated values - CALIBRATE on labeled photos.
export const HAIR_RULE = {
  // gray/white hairs carry little pigment: near-neutral and not dark
  grayMaxChroma: 7,
  grayMinL: 45,
  grayFraction: 0.5, // at least half the hair reads gray -> "gray / white"
  someGrayFraction: 0.2, // noted on the card below the full threshold
  // Brown and blond hair get their color from pigment and are warm-hued, so
  // a near-colorless median that isn't dark can't be either: it's gray hair,
  // or salt-and-pepper where dark and white strands blend within each pixel.
  // (Found on a real photo: a graying head measured L* 47 / chroma 3.5 and
  // was being banded as "brown" by lightness alone.)
  neutralMinL: 35,
  // red hair is pheomelanin-dominant: a redder hue AND more saturated than
  // brown hair of the same lightness. Saturation here is C*/(L*+16), not
  // plain chroma: a brighter exposure scales a*, b* and L*+16 all by the
  // same cube-root factor, so this ratio doesn't move with exposure while
  // chroma does. (Brightening a real chestnut-brown head 0.7 stops pushed
  // its chroma from 16 to 19 and it read "red" under the old chroma-18 rule;
  // its saturation stayed 0.41.) 0.45 is that old rule at L* 24, the
  // lightness of the one labeled warm-brown test photo, so behavior there is
  // unchanged. Still provisional - CALIBRATE on labeled red hair.
  redMaxHue: 55,
  redMinSaturation: 0.45,
};

// Exposure-independent saturation (see HAIR_RULE.redMinSaturation).
export function saturation({ L, a, b }) {
  return chroma({ a, b }) / (L + 16);
}

// Morgan et al. (2018) found hair color forms a continuum from black
// through dark and light brown to blonde, so non-red, non-gray hair is
// banded by lightness.
export const HAIR_LIGHTNESS_BANDS = [
  { key: "black", max: 24 },
  { key: "brown", max: 52 },
  { key: "blond" },
];

// A hair pixel counts only if the mask is also hair a short distance away in
// all four directions, so edge pixels blended with skin, background or a
// hat don't pollute the color.
function isInteriorHair(mask, x, y, d, w, h) {
  return (
    maskAt(mask, x, y, w, h) === MASK.HAIR &&
    maskAt(mask, Math.max(0, x - d), y, w, h) === MASK.HAIR &&
    maskAt(mask, Math.min(w - 1, x + d), y, w, h) === MASK.HAIR &&
    maskAt(mask, x, Math.max(0, y - d), w, h) === MASK.HAIR &&
    maskAt(mask, x, Math.min(h - 1, y + d), w, h) === MASK.HAIR
  );
}

export function sampleHair(imageData, mask, points) {
  const { width: w, height: h } = imageData;
  const f = faceFrame(points);
  // Only this person's hair: a generous box around the face (long hair
  // reaches the shoulders), ignoring anyone else's hair in the photo.
  const reach = 3 * f.iod;
  const box = { x0: f.mid.x - reach, y0: f.mid.y - reach, x1: f.mid.x + reach, y1: f.mid.y + 1.5 * reach };
  const area = (box.x1 - box.x0) * (box.y1 - box.y0);
  const stride = Math.max(1, Math.round(Math.sqrt(area / TARGET_SAMPLES)));
  const d = Math.max(2, Math.round(0.04 * f.iod));
  const raw = samplePixels(imageData, box, (x, y) => isInteriorHair(mask, x, y, d, w, h), stride).filter(
    (p) => !isClipped(p)
  );
  // Trim shine (brightest 10%) and deep shadow between strands (darkest 10%).
  return trimByPercentile(raw, (p) => p.lab.L, 0.1, 0.9);
}

export function isGrayPixel({ L, a, b }) {
  return chroma({ a, b }) < HAIR_RULE.grayMaxChroma && L >= HAIR_RULE.grayMinL;
}

export function measureHairColor(imageData, mask, points) {
  const pixels = sampleHair(imageData, mask, points);
  if (pixels.length < MIN_HAIR_PIXELS) {
    return {
      status: "unmeasurable",
      reason:
        "Not enough hair is visible to measure (short or covered hair, a hat, or a tight crop). You can still pick your hair color below to read about it.",
    };
  }
  const labs = pixels.map((p) => p.lab);
  const lab = medianLab(labs);
  return {
    status: "ok",
    lab,
    chroma: chroma(lab),
    hue: hueAngle(lab),
    grayFraction: labs.filter(isGrayPixel).length / labs.length,
    pixels,
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// { category, margin, runnerUp } - same contract as the eye classifier.
export function classifyHairColor({ lab, chroma: c, hue, grayFraction }) {
  const byLightness = classifyBands(lab.L, HAIR_LIGHTNESS_BANDS, { span: 15 });

  if (grayFraction >= HAIR_RULE.grayFraction) {
    return {
      category: "gray",
      margin: clamp01((grayFraction - HAIR_RULE.grayFraction) / 0.3),
      runnerUp: byLightness.category,
    };
  }
  if (c < HAIR_RULE.grayMaxChroma && lab.L >= HAIR_RULE.neutralMinL) {
    // a blend of gray and dark strands: the dark ones are the alternative
    return {
      category: "gray",
      margin: clamp01((HAIR_RULE.grayMaxChroma - c) / HAIR_RULE.grayMaxChroma),
      runnerUp: "black",
    };
  }

  // Red needs BOTH a red-enough hue and enough saturation; its margin is the
  // weaker of the two (in units of 15° hue / 0.25 saturation - the latter
  // matches the old 10 chroma units at L* 24).
  const redScore = Math.min(
    (HAIR_RULE.redMaxHue - hue) / 15,
    (saturation(lab) - HAIR_RULE.redMinSaturation) / 0.25
  );
  if (redScore >= 0) {
    return { category: "red", margin: clamp01(redScore), runnerUp: byLightness.category };
  }
  // Nearly red (e.g. auburn) counts as close to a boundary too.
  if (-redScore < byLightness.margin) {
    return { category: byLightness.category, margin: clamp01(-redScore), runnerUp: "red" };
  }
  return byLightness;
}

// Eye color, measured the way Andersen et al. (2013) did in their Digital
// Iris Analysis Tool: classify each iris pixel as unpigmented ("blue",
// light scattering in a low-melanin iris) or pigmented ("brown", melanin),
// then summarize the eye as a Pixel Index of the Eye:
//
//   PIE = (blue - brown) / (blue + brown),  from -1 (all brown) to +1 (all blue)
//
// A proportion of pixel types is far less sensitive to exposure than an
// absolute L*a*b* cutoff: a darker photo darkens every pixel, but mostly
// doesn't flip which side of the warm/cool line each one falls on.

import { classifyBands } from "../bands";
import { chroma, deltaE2000, hueAngle } from "../color";
import { circleBox, isClipped, samplePixels } from "../pixels";
import { eyeOpening, irisCircle, pointInPolygon } from "../regions";
import { medianLab, trimByPercentile } from "../stats";

// Sample a ring, not the whole disc: the inner 35% is pupil and the outer
// rim (limbal ring) is darker than the iris itself in most people.
export const RING = { inner: 0.35, outer: 0.9 };

// Below this many usable pixels an eye is too small to measure (a 2048 px
// selfie at arm's length gives a few hundred).
export const MIN_EYE_PIXELS = 30;

// A pixel count alone can't catch a squint: a nearly shut eye still has a
// thin sliver of "iris" that is really eyelid skin, and skin reads as brown.
// Require that at least this share of the sampling ring is between the lids.
// An open eye's upper lid typically hides the top of the iris, leaving well
// over half the ring visible.
export const MIN_VISIBLE_RING = 0.3;

// Per-pixel rule. Melanin (eumelanin brown, pheomelanin yellow-red) sits in
// the red-to-yellow hue band; unpigmented stroma scatters blue-gray.
// Andersen 2013 didn't publish DIAT's exact cutoffs, so these are physically
// motivated starting values - CALIBRATE against labeled photos (Phase 3
// verification) before trusting them.
export const PIXEL_RULE = {
  minChroma: 6, // below this, hue is mostly camera noise: fall back to lightness
  warmHue: [15, 100], // degrees; ~100 is where yellow turns green in CIELAB
  darkNeutralL: 30, // a near-neutral pixel this dark is dense melanin, not gray
};

export function classifyIrisPixel(lab) {
  if (chroma(lab) < PIXEL_RULE.minChroma) {
    return lab.L < PIXEL_RULE.darkNeutralL ? "brown" : "blue";
  }
  const h = hueAngle(lab);
  return h >= PIXEL_RULE.warmHue[0] && h <= PIXEL_RULE.warmHue[1] ? "brown" : "blue";
}

export function pieScore(labs) {
  let blue = 0;
  let brown = 0;
  for (const lab of labs) {
    if (classifyIrisPixel(lab) === "blue") blue++;
    else brown++;
  }
  return (blue - brown) / (blue + brown);
}

// The usable iris pixels of one eye: inside the ring AND inside the eyelid
// opening (drops lid and lash occlusion), not clipped, with the brightest 15%
// (catchlights) and darkest 10% (lash shadow, pupil bleed) trimmed off.
export function sampleIris(imageData, points, side) {
  const circle = irisCircle(points, side);
  const lids = eyeOpening(points, side);
  let ringCount = 0;
  let visibleCount = 0;
  const include = (x, y) => {
    const d = Math.hypot(x - circle.cx, y - circle.cy);
    if (d < RING.inner * circle.r || d > RING.outer * circle.r) return false;
    ringCount++;
    if (!pointInPolygon(x, y, lids)) return false;
    visibleCount++;
    return true;
  };
  const raw = samplePixels(imageData, circleBox(circle), include).filter((p) => !isClipped(p));
  const pixels = trimByPercentile(raw, (p) => p.lab.L, 0.1, 0.85);
  return { circle, pixels, visibleFraction: ringCount ? visibleCount / ringCount : 0 };
}

export function measureEyeColor(imageData, points) {
  const eyes = {};
  for (const side of ["right", "left"]) {
    const { circle, pixels, visibleFraction } = sampleIris(imageData, points, side);
    if (visibleFraction < MIN_VISIBLE_RING || pixels.length < MIN_EYE_PIXELS) continue;
    const labs = pixels.map((p) => p.lab);
    eyes[side] = { circle, pixels, pie: pieScore(labs), lab: medianLab(labs) };
  }

  const measured = Object.values(eyes);
  if (measured.length === 0) {
    return {
      status: "unmeasurable",
      reason:
        "Your eyes are too small, closed or covered in this photo to measure. Try a closer, front-facing photo with your eyes open and no glasses glare.",
    };
  }

  const all = measured.flatMap((e) => e.pixels.map((p) => p.lab));
  return {
    status: "ok",
    pie: pieScore(all),
    lab: medianLab(all),
    eyes,
    pixelCount: all.length,
    // Flag only a big difference on BOTH measures: one-sided lighting alone
    // usually shifts lightness (and so ΔE) without flipping pixel types.
    heterochromia:
      measured.length === 2 &&
      Math.abs(eyes.right.pie - eyes.left.pie) >= 1 &&
      deltaE2000(eyes.right.lab, eyes.left.lab) >= 15,
  };
}

// The three IrisPlex categories (Walsh 2011) as bands on the PIE axis.
// Anchors (Andersen 2013, mean PIE by HERC2 rs12913832 genotype): GG +0.99,
// GA -0.71, AA -0.87 - blue and brown cluster near the ends, and GA people
// vary widely. Green/hazel is the least predictable category (AUC 0.74,
// Liu 2010), so the intermediate band is deliberately wide (±0.4): a
// mixed-looking iris is called "intermediate" rather than confidently blue
// or brown. The ±0.4 edges are not published values; CALIBRATE on labeled
// photos alongside PIXEL_RULE.
export const EYE_BANDS = [
  { key: "brown", max: -0.4 },
  { key: "intermediate", max: 0.4 },
  { key: "blue" },
];

// Returns { category, margin, runnerUp }: margin in [0, 1] is 0 on a
// boundary and 1 at the far end of the scale (or the middle of the
// intermediate band); runnerUp is the category across the nearer boundary.
export function classifyEyeColor({ pie }) {
  // end bands run 0.6 from their boundary to the scale's end (±1)
  return classifyBands(pie, EYE_BANDS, { span: 0.6 });
}

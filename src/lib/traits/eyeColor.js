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
import { eyeOpening, faceFrame, irisCircle, pointInPolygon } from "../regions";
import { median, medianLab, percentile } from "../stats";

// Sample a ring, not the whole disc: the center is pupil and the outer rim
// (limbal ring) is darker than the iris itself in most people. 0.35 is the
// minimum inner cutoff; a dilated pupil pushes it out (see pupilEdge).
export const RING = { inner: 0.35, outer: 0.9, maxInner: 0.72 };

// Pupils change size with light: in an eye-tracking study they ranged 2-6 mm
// under ordinary conditions (Behav Res Methods 2025, doi:10.3758/s13428-025-02912-y),
// and dark-adapted pupils get larger still. Against a ~11.7 mm iris (Rüfer
// et al. 2005, Cornea) a 6 mm pupil already spans 51% of the iris radius, so
// a fixed 35% cutoff would count black pupil pixels as "pigmented" and push
// blue eyes toward brown. Instead, find the pupil's edge from the radial
// lightness profile: the first ring (from the center out) whose median
// lightness climbs past halfway between pupil and iris.
const PUPIL_BINS = 18; // 0.05 of the radius each, out to 0.9
// Below this iris radius each 0.05 ring is under 0.6 px wide and the
// center holds only a handful of pixels, so the profile is noise: flipping
// the photo moved the "edge" from 0.35 to 0.5 on a real 8 px iris. Small
// irises keep the default cutoff and rely on outlier rejection (below) to
// drop pupil pixels instead.
export const MIN_PUPIL_SEARCH_RADIUS = 12;
export function pupilEdge(imageData, circle, lids) {
  if (circle.r < MIN_PUPIL_SEARCH_RADIUS) return RING.inner;
  const bins = Array.from({ length: PUPIL_BINS }, () => []);
  samplePixels(
    imageData,
    circleBox(circle),
    (x, y) => Math.hypot(x - circle.cx, y - circle.cy) < RING.outer * circle.r && pointInPolygon(x, y, lids)
  ).forEach((p) => {
    const i = Math.floor((Math.hypot(p.x + 0.5 - circle.cx, p.y + 0.5 - circle.cy) / circle.r) / 0.05);
    if (i < PUPIL_BINS) bins[i].push(p.lab.L);
  });
  const med = bins.map((b) => (b.length >= 3 ? median(b) : null));
  // pupil: the darkest quarter of the central 15% (resists a catchlight);
  // iris: the 60-85% band
  const center = bins.slice(0, 3).flat();
  const irisBand = med.slice(12, 17).filter((v) => v !== null);
  if (center.length < 3 || irisBand.length === 0) return RING.inner;
  const pupilL = percentile(center, 0.25);
  const irisL = median(irisBand);
  // A dark iris has no visible pupil edge - and there, pupil pixels don't bias
  // the result anyway (both read as pigmented). Keep the default.
  if (irisL - pupilL < 8) return RING.inner;
  const halfway = (pupilL + irisL) / 2;
  const edgeBin = med.findIndex((v, i) => i >= 1 && v !== null && v >= halfway);
  if (edgeBin === -1) return RING.inner;
  // bin index * 0.05 is the ring's inner edge; step one ring further out to
  // clear the soft pupil boundary
  return Math.min(RING.maxInner, Math.max(RING.inner, (edgeBin + 1) * 0.05));
}

// MediaPipe's iris landmarks can land a pixel or two off, and on a small
// iris that's a big share of the radius: mirroring a real portrait moved
// the ring enough that the same eye's median went from L* 8 to L* 22. So
// the circle is refined to the limbus - the iris's outer edge against the
// white of the eye - by trying nearby centers and radii and keeping the
// one with the strongest dark-inside, bright-outside step. That is
// Daugman's (1993) integro-differential idea, used here only on the sides
// of the iris (within 30° of horizontal), since the lids usually cover its
// top and bottom and their lash line is an edge too. Without a clear edge
// (a closed or dim eye) the landmark circle is kept, and so it is below an
// 8 px radius: there the edge is a pixel or two of blur and the search
// locked onto the lashes of a real 6 px iris, while at 8 px it held the
// mirrored and original portrait within L* 2 of each other.
export const LIMBUS = {
  shift: 0.25, // search centers within 25% of the radius
  radius: [0.8, 1.15], // and radii within this range of the landmark radius
  minContrast: 6, // mean gray-level step (0-255) that counts as a real edge
  minAngles: 8, // sample directions that must fall between the lids
  minRadius: 8, // px
};
const LIMBUS_ANGLES = [-30, -20, -10, 0, 10, 20, 30].flatMap((a) => [a, a + 180]).map(
  (a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]
);

function grayAt({ width, height, data }, x, y) {
  const x0 = Math.max(0, Math.min(width - 2, Math.floor(x - 0.5)));
  const y0 = Math.max(0, Math.min(height - 2, Math.floor(y - 0.5)));
  const fx = Math.max(0, Math.min(1, x - 0.5 - x0));
  const fy = Math.max(0, Math.min(1, y - 0.5 - y0));
  const g = (xx, yy) => {
    const i = (yy * width + xx) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  return (
    g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy
  );
}

// The interquartile mean of the steps across directions: a catchlight just
// outside a candidate circle, against the dark pupil just inside it, makes a
// bigger step than the real edge in one or two directions, and a plain mean
// let those drag the circle onto the glare (a unit test caught it). A median
// resists that but ties a circle that is only half on the edge with the true
// one; averaging the middle half does neither.
// Samples sit just inside and outside the circle (6% of the radius, at
// least a pixel), so a circle only fits where the edge really is, and a
// direction whose samples fall outside the lids scores zero - no evidence -
// rather than being skipped, which would let a circle score well by moving
// its wrong side under the lids.
export function limbusContrast(imageData, { cx, cy, r }, lids) {
  const d = Math.max(1, 0.06 * r);
  const steps = [];
  let visible = 0;
  for (const [c, s] of LIMBUS_ANGLES) {
    const out = [cx + (r + d) * c, cy + (r + d) * s];
    const inn = [cx + (r - d) * c, cy + (r - d) * s];
    if (!pointInPolygon(...out, lids) || !pointInPolygon(...inn, lids)) {
      steps.push(0);
      continue;
    }
    steps.push(grayAt(imageData, ...out) - grayAt(imageData, ...inn));
    visible++;
  }
  if (visible < LIMBUS.minAngles) return -Infinity;
  steps.sort((a, b) => a - b);
  const mid = steps.slice(Math.floor(steps.length / 4), Math.ceil((3 * steps.length) / 4));
  return mid.reduce((s, v) => s + v, 0) / mid.length;
}

export function refineIrisCircle(imageData, circle, lids) {
  if (circle.r < LIMBUS.minRadius) return circle;
  const step = Math.max(0.5, circle.r / 16);
  const rStep = Math.max(0.5, circle.r / 20);
  const reach = LIMBUS.shift * circle.r;
  let best = { ...circle, contrast: limbusContrast(imageData, circle, lids) };
  for (let dy = -reach; dy <= reach + 1e-9; dy += step) {
    for (let dx = -reach; dx <= reach + 1e-9; dx += step) {
      for (let r = LIMBUS.radius[0] * circle.r; r <= LIMBUS.radius[1] * circle.r + 1e-9; r += rStep) {
        const c = { cx: circle.cx + dx, cy: circle.cy + dy, r };
        const contrast = limbusContrast(imageData, c, lids);
        if (contrast > best.contrast) best = { ...c, contrast };
      }
    }
  }
  if (!(best.contrast >= LIMBUS.minContrast)) return circle;
  return { cx: best.cx, cy: best.cy, r: best.r };
}

// Below this many usable pixels an eye is too small to measure (a 2048 px
// selfie at arm's length gives a few hundred).
export const MIN_EYE_PIXELS = 30;

// A pixel count alone can't catch a squint: a nearly shut eye still has a
// thin sliver of "iris" that is really eyelid skin, and skin reads as brown.
// Require that at least this share of the sampling ring is between the lids.
// An open eye's upper lid typically hides the top of the iris, leaving well
// over half the ring visible.
export const MIN_VISIBLE_RING = 0.3;

// Per-pixel rule. Unpigmented stroma scatters blue: the blue and gray-blue
// irises in the labeled test photos measured 252-270°. Green (100-180°) is
// that scattering seen through thin yellow pigment, so it stays on the same
// side (and is counted separately, see isGreenPixel). Every other hue -
// yellow, orange, red, magenta - is melanin, or blood and camera tint over
// it. (It used to be "anything outside 15-100° is blue": a real dark brown
// iris, L* 8 with a slight magenta cast at 340°, read "Blue / gray" with
// high confidence.) Andersen 2013 didn't publish DIAT's exact cutoffs, so
// these remain physically motivated values - CALIBRATE on more labeled eyes.
export const PIXEL_RULE = {
  minChroma: 6, // below this, hue is mostly camera noise: fall back to lightness
  unpigmentedHue: [100, 300], // degrees; ~100 is where yellow turns green in CIELAB
  darkNeutralL: 30, // a near-neutral pixel this dark is dense melanin, not gray
};

export function classifyIrisPixel(lab) {
  if (chroma(lab) < PIXEL_RULE.minChroma) {
    return lab.L < PIXEL_RULE.darkNeutralL ? "brown" : "blue";
  }
  const h = hueAngle(lab);
  return h > PIXEL_RULE.unpigmentedHue[0] && h < PIXEL_RULE.unpigmentedHue[1] ? "blue" : "brown";
}

// Green isn't a pigment of its own: a green iris is blue scattering seen
// through a thin yellowish (pheomelanin) layer, so its "unpigmented"
// pixels still carry some yellow - b* > 0, hue between the warm band and
// 180°. A blue or gray iris has none. Both land on the blue side of the
// two-way split above (the pixel index keeps Andersen's definition), so
// without this a green eye read "Blue / gray".
export function isGreenPixel(lab) {
  if (chroma(lab) < PIXEL_RULE.minChroma || lab.b <= 0) return false;
  const h = hueAngle(lab);
  return h > PIXEL_RULE.unpigmentedHue[0] && h < 180;
}

// Share of the blue-side pixels that are green, 0 to 1.
export function greenShare(labs) {
  let blueSide = 0;
  let green = 0;
  for (const lab of labs) {
    if (classifyIrisPixel(lab) !== "blue") continue;
    blueSide++;
    if (isGreenPixel(lab)) green++;
  }
  return blueSide ? green / blueSide : 0;
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

// Glare and stray sclera are bright outliers next to the iris itself; lash
// shadow and pupil bleed are dark ones. A fixed trim (it used to cut the
// brightest 15% and darkest 10%) is wrong both ways: on a clean iris it
// throws away real texture, like the lighter rim of a hazel eye, and on a
// real studio portrait the two catchlights filled about a quarter of a
// small iris, so a 15% cut left them in to vote "blue" on a brown eye.
// Instead keep pixels within k robust standard deviations (1.4826 x the
// median absolute deviation) of the median lightness. k = 2.5 is the
// default Leys et al. (2013) recommend for MAD-based outlier rejection;
// the floor keeps a very even iris from losing pixels to JPEG noise.
export const OUTLIER = { k: 2.5, minTolerance: 8 };

export function rejectOutliers(pixels) {
  if (pixels.length < 5) return pixels;
  const lightness = pixels.map((p) => p.lab.L);
  const mid = median(lightness);
  const mad = median(lightness.map((L) => Math.abs(L - mid)));
  const tolerance = Math.max(OUTLIER.minTolerance, OUTLIER.k * 1.4826 * mad);
  return pixels.filter((p) => Math.abs(p.lab.L - mid) <= tolerance);
}

// The upper lid and lashes shade the top of the iris, and that's also where
// catchlights and reflections of the room usually land. On a real brown eye
// the shaded top half measured L* ~20 with dark blue-green pixels that
// voted "blue", while the lit bottom half read L* ~37 and 99% pigmented. So
// the lower half (below the iris center, along the face's own vertical,
// so head tilt doesn't matter) is used whenever it alone has enough
// pixels; a squint that hides it falls back to the whole visible ring.
export function preferLowerHalf(pixels, circle, down) {
  const lower = pixels.filter(
    (p) => (p.x + 0.5 - circle.cx) * down.x + (p.y + 0.5 - circle.cy) * down.y >= 0
  );
  return lower.length >= MIN_EYE_PIXELS ? lower : pixels;
}

// The usable iris pixels of one eye: inside the ring AND inside the eyelid
// opening (drops lid and lash occlusion), not clipped, from the lower half
// when possible, and not a lightness outlier (catchlights, sclera, lashes,
// pupil; see rejectOutliers).
export function sampleIris(imageData, points, side) {
  const lids = eyeOpening(points, side);
  const circle = refineIrisCircle(imageData, irisCircle(points, side), lids);
  const inner = pupilEdge(imageData, circle, lids);
  let ringCount = 0;
  let visibleCount = 0;
  const include = (x, y) => {
    const d = Math.hypot(x - circle.cx, y - circle.cy);
    if (d < inner * circle.r || d > RING.outer * circle.r) return false;
    ringCount++;
    if (!pointInPolygon(x, y, lids)) return false;
    visibleCount++;
    return true;
  };
  const raw = samplePixels(imageData, circleBox(circle), include).filter((p) => !isClipped(p));
  const pixels = rejectOutliers(preferLowerHalf(raw, circle, faceFrame(points).ey));
  return { circle, pixels, innerRadius: inner, visibleFraction: ringCount ? visibleCount / ringCount : 0 };
}

export function measureEyeColor(imageData, points) {
  const eyes = {};
  for (const side of ["right", "left"]) {
    const { circle, pixels, innerRadius, visibleFraction } = sampleIris(imageData, points, side);
    if (visibleFraction < MIN_VISIBLE_RING || pixels.length < MIN_EYE_PIXELS) continue;
    const labs = pixels.map((p) => p.lab);
    eyes[side] = { circle, pixels, innerRadius, pie: pieScore(labs), lab: medianLab(labs) };
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
    greenShare: greenShare(all),
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

// A mostly unpigmented iris whose blue-side pixels are mostly green is a
// green eye, which IrisPlex files under "intermediate" (green/hazel), not
// blue. "Mostly" (a majority) is a starting value; CALIBRATE on labeled
// green eyes, which the test photos don't include.
export const GREEN_RULE = { share: 0.5 };

// Returns { category, margin, runnerUp }: margin in [0, 1] is 0 on a
// boundary and 1 at the far end of the scale (or the middle of the
// intermediate band); runnerUp is the category across the nearer boundary.
export function classifyEyeColor({ pie, greenShare = 0 }) {
  // end bands run 0.6 from their boundary to the scale's end (±1)
  const byPie = classifyBands(pie, EYE_BANDS, { span: 0.6 });
  if (byPie.category !== "blue" || greenShare < GREEN_RULE.share) return byPie;
  // blue vs. green now hinges on the green share: 0 at the rule, 1 at 80%
  const margin = Math.min(1, (greenShare - GREEN_RULE.share) / 0.3);
  return { category: "intermediate", margin, runnerUp: "blue" };
}

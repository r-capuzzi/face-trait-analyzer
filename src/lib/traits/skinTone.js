// Skin tone from cheek and forehead patches, reported as the Individual
// Typology Angle (ITA°) - a colorimetric angle in the L*-b* plane from
// dermatology research - plus the nearest Monk Skin Tone swatch.
//
// ITA categories: Chardon, Cretois & Hourseau (1991); the six-group scale
// (very light > 55°, light 41-55°, intermediate 28-41°, tan 10-28°,
// brown -30-10°, dark < -30°) as used by Del Bino et al. (2006). ITA was
// designed for a colorimeter on unexposed skin under controlled light, so a
// photo of a face (sun-exposed, camera white balance) is an approximation.

import { classifyBands } from "../bands";
import { deltaE2000, hexToLab, ita } from "../color";
import { MASK } from "../maskCategories";
import { circleBox, isClipped, maskAt, samplePixels } from "../pixels";
import { skinPatches } from "../regions";
import { medianLab, trimByPercentile } from "../stats";
import { MONK_SCALE } from "../../data/monk";

export const ITA_BANDS = [
  { key: "dark", max: -30 },
  { key: "brown", max: 10 },
  { key: "tan", max: 28 },
  { key: "intermediate", max: 41 },
  { key: "light", max: 55 },
  { key: "veryLight" },
];

export const MIN_PATCH_PIXELS = 40;
// Patches this far apart in ITA mean the light falls unevenly across the
// face (one cheek in shadow), so the single number deserves less trust.
export const UNEVEN_LIGHT_ITA = 20;

const MONK_LABS = MONK_SCALE.map((m) => ({ ...m, lab: hexToLab(m.hex) }));

export function nearestMonk(lab) {
  let best = null;
  for (const m of MONK_LABS) {
    const d = deltaE2000(lab, m.lab);
    if (!best || d < best.distance) best = { tone: m.tone, hex: m.hex, distance: d };
  }
  return best;
}

export function measureSkinTone(imageData, mask, points) {
  const { width: w, height: h } = imageData;
  let rawCount = 0;
  let clippedCount = 0;
  const patches = skinPatches(points).map((patch) => {
    const inPatch = samplePixels(
      imageData,
      circleBox(patch),
      (x, y) =>
        Math.hypot(x - patch.cx, y - patch.cy) <= patch.r &&
        maskAt(mask, x, y, w, h) === MASK.FACE_SKIN
    );
    const raw = inPatch.filter((p) => !isClipped(p));
    rawCount += inPatch.length;
    clippedCount += inPatch.length - raw.length;
    // drop shadowed pores/creases and specular shine
    const pixels = trimByPercentile(raw, (p) => p.lab.L, 0.1, 0.9);
    const lab = pixels.length ? medianLab(pixels.map((p) => p.lab)) : null;
    return { ...patch, pixels, lab, ita: lab ? ita(lab) : null };
  });
  // share of blown-out (or crushed) pixels before filtering: an exposure signal
  const clippedShare = rawCount ? clippedCount / rawCount : 0;

  const usable = patches.filter((p) => p.pixels.length >= MIN_PATCH_PIXELS);
  if (usable.length < 2) {
    return {
      status: "unmeasurable",
      clippedShare,
      reason:
        "Not enough clear skin is visible on the cheeks and forehead (hair, a beard, glasses or shadows may be covering them). You can still pick a skin tone below to read about it.",
    };
  }

  const lab = medianLab(usable.flatMap((p) => p.pixels.map((px) => px.lab)));
  const itas = usable.map((p) => p.ita);
  return {
    status: "ok",
    lab,
    ita: ita(lab),
    monk: nearestMonk(lab),
    patches: usable,
    clippedShare,
    unevenLighting: Math.max(...itas) - Math.min(...itas) >= UNEVEN_LIGHT_ITA,
  };
}

// { category, margin, runnerUp }. Open-ended bands get a 14° nominal depth,
// the width of the neighboring "light" and "tan" bands.
export function classifySkinTone({ ita: angle }) {
  return classifyBands(angle, ITA_BANDS, { span: 14 });
}

// Forehead height, found by walking up the forehead from the bridge of the
// nose until the segmentation mask turns to hair. Several columns across the
// forehead are walked, so a side part or bangs (hair lying ACROSS the
// forehead) can be told apart from a hairline: a real hairline sits at
// roughly the same height across the middle of the forehead.
//
// Reported as the classical upper facial third: hairline -> nasal root,
// relative to nasal root -> base of the nose (the canon says equal; Farkas
// 1985 found the vertical canons fit real faces worst).

import { MASK } from "../maskCategories";
import { maskAt } from "../pixels";
import { BROWS, MIDLINE, faceFrame, fromFrame, toFrame } from "../regions";

// Provisional (CALIBRATE); checked against one visible hairline and one
// side-swept fringe in the two test photos.
export const HAIRLINE_RULE = {
  columns: [-0.3, -0.15, 0, 0.15, 0.3], // offsets from the midline, in pupil distances
  searchUp: 3, // how far above the nasal root to look, in midface heights
  runLength: 3, // consecutive hair pixels that count as "hair starts here"
  maxSpread: 0.35, // hairline heights across columns may differ by this many midface heights
  // Hair starting this close above the BROWS (in midface heights) is bangs.
  // Measured from the brows, not the nasal root: the root sits well below
  // the brows, so a nasal-root threshold let brow-length bangs pass as a
  // (very low) hairline.
  minAboveBrows: 0.3,
};


// Walk one column upward from `startV` and report what's found first:
// { hit: "hair", v } | { hit: "background" | "accessory" | "edge" }.
function walkUp(mask, f, u, startV, stopV, w, h) {
  let run = 0;
  for (let v = startV; v >= stopV; v -= 1) {
    const { x, y } = fromFrame(f, { u, v });
    if (x < 0 || y < 0 || x >= w || y >= h) return { hit: "edge" };
    const cat = maskAt(mask, x, y, w, h);
    if (cat === MASK.HAIR) {
      run++;
      if (run >= HAIRLINE_RULE.runLength) return { hit: "hair", v: v + run - 1 };
    } else {
      run = 0;
      if (cat === MASK.BACKGROUND) return { hit: "background" };
      if (cat === MASK.OTHERS) return { hit: "accessory" };
    }
  }
  return { hit: "edge" };
}

export function measureHairline(imageData, mask, points) {
  const { width: w, height: h } = imageData;
  const f = faceFrame(points);
  const nasion = toFrame(f, points[MIDLINE.nasion]);
  const subnasale = toFrame(f, points[MIDLINE.subnasale]);
  const midface = subnasale.v - nasion.v;
  // start just above the eyebrows so brow hair isn't mistaken for the hairline
  const browTop = Math.min(...[...BROWS.right, ...BROWS.left].map((i) => toFrame(f, points[i]).v));
  const start = browTop - 0.15 * midface;
  const stop = nasion.v - HAIRLINE_RULE.searchUp * midface;

  const walks = HAIRLINE_RULE.columns.map((c) => walkUp(mask, f, nasion.u + c * f.iod, start, stop, w, h));
  const hairs = walks.filter((wk) => wk.hit === "hair").map((wk) => wk.v);
  const unmeasurable = (reason) => ({ status: "unmeasurable", reason, walks });

  if (walks.filter((wk) => wk.hit === "accessory").length >= 2) {
    return unmeasurable("Something covers your forehead (a hat, headband or glasses pushed up), so the hairline can't be found.");
  }
  if (hairs.length < 3) {
    return unmeasurable(
      "No hairline was found above the forehead: the head may be shaved or bald, the hair pulled far back, or the top of the head cropped out of the photo."
    );
  }
  const spread = Math.max(...hairs) - Math.min(...hairs);
  if (spread > HAIRLINE_RULE.maxSpread * midface) {
    return unmeasurable(
      "Hair falls across your forehead (bangs or a side part), so your hairline is hidden. Sweep it back for this measurement."
    );
  }
  const hairlineV = hairs.sort((a, b) => a - b)[Math.floor(hairs.length / 2)];
  const forehead = nasion.v - hairlineV;
  if (browTop - hairlineV < HAIRLINE_RULE.minAboveBrows * midface) {
    return unmeasurable("Bangs cover most of your forehead, so your hairline is hidden. Sweep them back for this measurement.");
  }

  return {
    status: "ok",
    upperToMid: forehead / midface,
    notes: [],
    line: {
      frame: f,
      from: { u: nasion.u, v: nasion.v },
      to: { u: nasion.u, v: hairlineV },
    },
  };
}

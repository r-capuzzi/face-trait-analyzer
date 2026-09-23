// How much to trust one trait's result: start from how far the measurement
// sits from a category boundary, then step down once per photo-quality issue
// that affects this trait. Conservative on purpose - it's better to say
// "between brown and intermediate" than to be confidently wrong.

export const LEVELS = ["low", "medium", "high"];

// Per-trait ceilings - a trait only reaches "high" if photo-based measurement
// of it has been shown to hold up outside the lab:
//  - hair: photo measurements only moderately match a spectrophotometer
//    (Vaughn et al. 2009).
//  - skin: smartphone ITA matched a colorimeter only with flash off and
//    minimal ambient light (Burrow et al. 2025, 4 volunteers); ordinary
//    photos aren't taken that way, and ITA moves directly with exposure (a
//    brightly lit test portrait read visibly lighter than the person looked).
//  - eye: the pixel index depends on each pixel's hue direction, not its
//    brightness, and gave the expected answer on both real test photos.
export const CAPS = { eye: "high", hair: "medium", skin: "medium" };

export function combineConfidence({ trait, margin, issues }) {
  let level = margin >= 0.5 ? 2 : margin >= 0.2 ? 1 : 0;
  // Cap BEFORE applying photo issues, so a problem still visibly lowers a
  // capped trait (blurry hair must read lower than sharp hair).
  level = Math.min(level, LEVELS.indexOf(CAPS[trait] ?? "high"));
  const relevant = issues.filter((i) => i.affects.includes(trait));
  level = Math.max(0, level - relevant.length);
  return {
    level: LEVELS[level],
    // show a two-way answer whenever confidence ends up low
    between: level === 0,
    reasons: relevant.map((i) => i.id),
  };
}

// Classify a 1-D score into ordered bands (e.g. eye PIE score, skin ITA°)
// and say how confidently: `margin` is 0 on a boundary and 1 deep inside a
// band, and `runnerUp` is the neighboring band across the nearest boundary.
// Low-margin results are shown as "between <category> and <runnerUp>".
//
// bands: ascending by value, contiguous, each { key, max } except the last,
// whose upper end is open. `span` gives open-ended bands a nominal width
// (how far past the boundary counts as "deep inside").

export function classifyBands(value, bands, { span } = {}) {
  const i = bands.findIndex((b) => b.max === undefined || value < b.max);
  const lo = i > 0 ? bands[i - 1].max : undefined;
  const hi = bands[i].max;

  const toLo = lo === undefined ? Infinity : value - lo;
  const toHi = hi === undefined ? Infinity : hi - value;
  const nearest = Math.min(toLo, toHi);
  if (nearest === Infinity) return { category: bands[i].key, margin: 1, runnerUp: null };

  // Interior bands are "deepest" at their midpoint; end bands at `span`
  // past their only boundary (or at the value range's natural end).
  const depth = lo !== undefined && hi !== undefined ? (hi - lo) / 2 : span;
  return {
    category: bands[i].key,
    margin: Math.max(0, Math.min(1, nearest / depth)),
    runnerUp: toLo <= toHi ? bands[i - 1].key : bands[i + 1].key,
  };
}

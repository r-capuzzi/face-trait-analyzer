// Small robust-statistics helpers. Photos are full of outlier pixels (a
// catchlight in the iris, a shadow under the cheekbone, a shiny strand of
// hair), so every trait uses medians and percentile trims, never plain means.

// p in [0, 1]; linear interpolation between order statistics.
// `sorted` must already be ascending.
export function percentileSorted(sorted, p) {
  if (sorted.length === 0) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function percentile(values, p) {
  return percentileSorted([...values].sort((x, y) => x - y), p);
}

export function median(values) {
  return percentile(values, 0.5);
}

// Channel-wise median of an array of {L, a, b}. Not a true "geometric"
// median in 3D, but robust and standard for colorimetric summaries.
export function medianLab(labs) {
  return {
    L: median(labs.map((c) => c.L)),
    a: median(labs.map((c) => c.a)),
    b: median(labs.map((c) => c.b)),
  };
}

// Keep the items whose key falls between the lo and hi percentiles of that
// key (inclusive). Used to drop shadow/highlight pixels by lightness.
export function trimByPercentile(items, key, lo, hi) {
  if (items.length === 0) return [];
  const sorted = items.map(key).sort((x, y) => x - y);
  const min = percentileSorted(sorted, lo);
  const max = percentileSorted(sorted, hi);
  return items.filter((it) => {
    const v = key(it);
    return v >= min && v <= max;
  });
}

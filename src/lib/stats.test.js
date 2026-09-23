import { median, medianLab, percentile, trimByPercentile } from "./stats";

test("median handles odd and even lengths without mutating input", () => {
  const odd = [5, 1, 3];
  expect(median(odd)).toBe(3);
  expect(odd).toEqual([5, 1, 3]);
  expect(median([1, 2, 3, 4])).toBe(2.5);
  expect(Number.isNaN(median([]))).toBe(true);
});

test("percentile interpolates between order statistics", () => {
  const v = [0, 10, 20, 30, 40];
  expect(percentile(v, 0)).toBe(0);
  expect(percentile(v, 1)).toBe(40);
  expect(percentile(v, 0.1)).toBe(4);
});

test("medianLab is robust to a few extreme pixels (e.g. a catchlight)", () => {
  const iris = Array.from({ length: 20 }, () => ({ L: 40, a: 5, b: 15 }));
  iris.push({ L: 98, a: 0, b: 0 }, { L: 97, a: 0, b: 1 }); // specular highlight
  expect(medianLab(iris)).toEqual({ L: 40, a: 5, b: 15 });
});

test("trimByPercentile drops both tails by the chosen key", () => {
  const px = Array.from({ length: 101 }, (_, i) => ({ L: i }));
  const kept = trimByPercentile(px, (p) => p.L, 0.1, 0.9);
  expect(kept[0].L).toBe(10);
  expect(kept.at(-1).L).toBe(90);
  expect(trimByPercentile([], (p) => p.L, 0.1, 0.9)).toEqual([]);
});

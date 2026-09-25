import { maskAt } from "./pixels";

test("maskAt rescales a lower-resolution mask to image coordinates", () => {
  // 2x2 mask over a 100x100 image: quadrants 0 1 / 2 3
  const mask = { width: 2, height: 2, data: new Uint8Array([0, 1, 2, 3]) };
  expect(maskAt(mask, 10, 10, 100, 100)).toBe(0);
  expect(maskAt(mask, 90, 10, 100, 100)).toBe(1);
  expect(maskAt(mask, 10, 90, 100, 100)).toBe(2);
  expect(maskAt(mask, 99.9, 99.9, 100, 100)).toBe(3);
});

test("maskAt reads the sharper head crop where it covers the point", () => {
  const mask = {
    width: 1,
    height: 1,
    data: new Uint8Array([0]), // coarse: all background
    // a 40x40 crop at (20, 20) with its own 4x4 mask: left half 1, right half 3
    crop: { x0: 20, y0: 20, x1: 60, y1: 60, width: 4, height: 4, data: new Uint8Array([1, 1, 3, 3, 1, 1, 3, 3, 1, 1, 3, 3, 1, 1, 3, 3]) },
  };
  expect(maskAt(mask, 25, 30, 100, 100)).toBe(1);
  expect(maskAt(mask, 55, 30, 100, 100)).toBe(3);
  expect(maskAt(mask, 70, 30, 100, 100)).toBe(0); // outside the crop: the whole-photo mask
  expect(maskAt(mask, 10, 10, 100, 100)).toBe(0);
});

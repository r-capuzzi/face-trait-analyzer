import { faceFrame, IRIS, irisCircle, pointInPolygon, skinPatches } from "./regions";
import { maskAt, samplePixels } from "./pixels";

// A 478-point array with only the landmarks we care about filled in.
function facePoints(overrides) {
  const pts = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
  for (const [i, p] of Object.entries(overrides)) pts[i] = p;
  return pts;
}

test("irisCircle radius is the mean center-to-edge distance", () => {
  const pts = facePoints({
    468: { x: 100, y: 100 },
    469: { x: 110, y: 100 },
    470: { x: 100, y: 90 },
    471: { x: 90, y: 100 },
    472: { x: 100, y: 112 }, // slightly uneven, like real landmarks
  });
  expect(irisCircle(pts, "right")).toEqual({ cx: 100, cy: 100, r: 10.5 });
});

test("pointInPolygon handles inside, outside and a concave notch", () => {
  const sq = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 5, y: 5 }, // notch
    { x: 0, y: 10 },
  ];
  expect(pointInPolygon(2, 2, sq)).toBe(true);
  expect(pointInPolygon(5, 8, sq)).toBe(false); // inside the notch
  expect(pointInPolygon(-1, 5, sq)).toBe(false);
});

// Upright face: pupils at y=100, mouth corners at y=160, brows ~y=80, face
// top at y=20. Pupils 60 px apart.
const upright = facePoints({
  [IRIS.right.center]: { x: 70, y: 100 },
  [IRIS.left.center]: { x: 130, y: 100 },
  61: { x: 80, y: 160 },
  291: { x: 120, y: 160 },
  10: { x: 100, y: 20 },
  ...Object.fromEntries(
    [46, 53, 52, 65, 55, 70, 63, 105, 66, 107, 276, 283, 282, 295, 285, 300, 293, 334, 296, 336].map(
      (i) => [i, { x: 100, y: 80 }]
    )
  ),
});

test("faceFrame measures inter-pupillary distance and points ey down the face", () => {
  const f = faceFrame(upright);
  expect(f.iod).toBe(60);
  expect(f.ex).toEqual({ x: 1, y: 0 });
  expect(f.ey.y).toBeCloseTo(1);
});

test("cheek patches sit below the pupils and outward; forehead sits above the brows", () => {
  const [rCheek, lCheek, forehead] = skinPatches(upright);
  // halfway from pupil level (100) to mouth level (160)
  expect(rCheek.cy).toBeCloseTo(130);
  expect(lCheek.cy).toBeCloseTo(130);
  // nudged outward, away from the nose
  expect(rCheek.cx).toBeLessThan(70);
  expect(lCheek.cx).toBeGreaterThan(130);
  expect(forehead.cy).toBeCloseTo(50);
  expect(forehead.cy).toBeLessThan(80);
});

test("skin patches rotate with a tilted head", () => {
  // rotate the whole upright face 90 degrees: (x, y) -> (-y, x)
  const tilted = upright.map((p) => ({ x: -p.y, y: p.x }));
  const [rCheek] = skinPatches(tilted);
  const [uprightCheek] = skinPatches(upright);
  expect(rCheek.cx).toBeCloseTo(-uprightCheek.cy);
  expect(rCheek.cy).toBeCloseTo(uprightCheek.cx);
});

test("maskAt rescales image coordinates onto a lower-resolution mask", () => {
  // 2x2 mask over a 100x100 image: right half is category 1
  const mask = { width: 2, height: 2, data: new Uint8Array([0, 1, 0, 1]) };
  expect(maskAt(mask, 10, 10, 100, 100)).toBe(0);
  expect(maskAt(mask, 90, 90, 100, 100)).toBe(1);
  expect(maskAt(mask, 99.9, 99.9, 100, 100)).toBe(1); // no out-of-range read
});

test("samplePixels returns only included pixels, with Lab attached", () => {
  const imageData = { width: 3, height: 1, data: new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255]) };
  const px = samplePixels(imageData, { x0: 0, y0: 0, x1: 2, y1: 0 }, (x) => x > 1);
  expect(px.map((p) => [p.x, p.r])).toEqual([
    [1, 0],
    [2, 255],
  ]);
  expect(px[1].lab.L).toBeCloseTo(53.24, 1); // pure red
});

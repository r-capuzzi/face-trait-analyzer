import {
  chroma,
  deltaE2000,
  hexToLab,
  hueAngle,
  ita,
  labToHex,
  labToRgb,
  rgbToLab,
  srgbToLinear,
} from "./color";

function expectLab(actual, [L, a, b], digits = 1) {
  expect(actual.L).toBeCloseTo(L, digits);
  expect(actual.a).toBeCloseTo(a, digits);
  expect(actual.b).toBeCloseTo(b, digits);
}

test("sRGB gamma decoding matches the IEC 61966-2-1 curve", () => {
  expect(srgbToLinear(0)).toBe(0);
  expect(srgbToLinear(255)).toBeCloseTo(1, 6);
  // mid-scale code value 128 is ~21.6% linear light, not 50%
  expect(srgbToLinear(128)).toBeCloseTo(0.2158, 3);
});

test("rgbToLab hits the standard reference values", () => {
  expectLab(rgbToLab(255, 255, 255), [100, 0, 0]);
  expectLab(rgbToLab(0, 0, 0), [0, 0, 0]);
  // pure sRGB primaries, D65 (widely tabulated, e.g. Lindbloom calculator)
  expectLab(rgbToLab(255, 0, 0), [53.24, 80.09, 67.2]);
  expectLab(rgbToLab(0, 0, 255), [32.3, 79.19, -107.86]);
  // neutral grays stay on the a* = b* = 0 axis
  const gray = rgbToLab(119, 119, 119);
  expect(gray.L).toBeCloseTo(50, 0);
  expect(Math.abs(gray.a)).toBeLessThan(0.01);
  expect(Math.abs(gray.b)).toBeLessThan(0.01);
});

test("labToRgb round-trips back to the original 8-bit color", () => {
  for (const rgb of [
    [255, 255, 255],
    [12, 34, 56],
    [201, 150, 120],
    [90, 60, 40],
  ]) {
    const back = labToRgb(rgbToLab(...rgb));
    expect([back.r, back.g, back.b]).toEqual(rgb);
  }
  expect(labToHex(hexToLab("#a07e56"))).toBe("#a07e56");
});

test("chroma and hue angle describe position around the gray axis", () => {
  expect(chroma({ a: 3, b: 4 })).toBe(5);
  expect(hueAngle({ a: 10, b: 0 })).toBeCloseTo(0);
  expect(hueAngle({ a: 0, b: 10 })).toBeCloseTo(90);
  expect(hueAngle({ a: 0, b: -10 })).toBeCloseTo(270); // never negative
});

test("ita follows Chardon 1991: arctan((L* - 50) / b*) in degrees", () => {
  expect(ita({ L: 50, b: 15 })).toBeCloseTo(0);
  expect(ita({ L: 70, b: 20 })).toBeCloseTo(45);
  expect(ita({ L: 30, b: 20 })).toBeCloseTo(-45);
  expect(Number.isFinite(ita({ L: 60, b: 0 }))).toBe(true);
});

// Worked pairs from Sharma, Wu & Dalal (2005), Table 1 - the standard
// conformance data for CIEDE2000 implementations.
test.each([
  [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
  [[50, 0, 0], [50, -1, 2], 2.3669],
  [[50, 2.5, 0], [73, 25, -18], 27.1492],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
])("deltaE2000 %j vs %j = %f", (p, q, expected) => {
  const lab = ([L, a, b]) => ({ L, a, b });
  expect(deltaE2000(lab(p), lab(q))).toBeCloseTo(expected, 4);
  // symmetric
  expect(deltaE2000(lab(q), lab(p))).toBeCloseTo(expected, 4);
});

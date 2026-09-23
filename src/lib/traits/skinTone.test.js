import { deltaE2000, ita, rgbToLab } from "../color";
import { syntheticHead } from "../../test/syntheticHead";
import { MONK_SCALE } from "../../data/monk";
import { classifySkinTone, measureSkinTone, nearestMonk } from "./skinTone";

const HAIR = [60, 45, 35];

function skinOf(rgb, extra = {}) {
  const { imageData, mask, points } = syntheticHead({ skin: rgb, hair: HAIR, ...extra });
  return measureSkinTone(imageData, mask, points);
}

test("measures the skin color and its ITA from the cheek and forehead patches", () => {
  const rgb = [200, 160, 130];
  const m = skinOf(rgb);
  expect(m.status).toBe("ok");
  expect(deltaE2000(m.lab, rgbToLab(...rgb))).toBeLessThan(1);
  expect(m.ita).toBeCloseTo(ita(rgbToLab(...rgb)), 5);
  expect(m.patches).toHaveLength(3);
  expect(m.unevenLighting).toBe(false);
});

test("a shadowed cheek is flagged as uneven lighting", () => {
  const m = skinOf([200, 160, 130], { rightCheek: [110, 80, 60] });
  expect(m.unevenLighting).toBe(true);
});

test("forehead covered by hair still measures from the two cheeks", () => {
  // hair mask reaching down over the forehead patch
  const m = skinOf([200, 160, 130], { hairRows: 190 });
  expect(m.status).toBe("ok");
  expect(m.patches.map((p) => p.name)).toEqual(["right cheek", "left cheek"]);
});

test("each Monk swatch is its own nearest match", () => {
  for (const m of MONK_SCALE) {
    expect(nearestMonk(rgbToLab(...hexRgb(m.hex))).tone).toBe(m.tone);
  }
});

// Boundaries from Chardon 1991 / Del Bino 2006.
test.each([
  [60, "veryLight"],
  [55, "veryLight"],
  [50, "light"],
  [35, "intermediate"],
  [20, "tan"],
  [0, "brown"],
  [-40, "dark"],
])("ITA %d° classifies as %s", (angle, expected) => {
  expect(classifySkinTone({ ita: angle }).category).toBe(expected);
});

test("an ITA right on a boundary has ~0 margin and names the neighbor", () => {
  const r = classifySkinTone({ ita: 41.2 });
  expect(r.category).toBe("light");
  expect(r.margin).toBeLessThan(0.05);
  expect(r.runnerUp).toBe("intermediate");
});

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

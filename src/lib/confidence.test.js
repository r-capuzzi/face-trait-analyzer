import { combineConfidence } from "./confidence";
import { offAxisDegrees } from "./quality";

const issue = (id, affects) => ({ id, affects, message: id });

test("margin alone sets the starting level", () => {
  expect(combineConfidence({ trait: "eye", margin: 0.9, issues: [] }).level).toBe("high");
  expect(combineConfidence({ trait: "eye", margin: 0.3, issues: [] }).level).toBe("medium");
  expect(combineConfidence({ trait: "eye", margin: 0.05, issues: [] })).toMatchObject({
    level: "low",
    between: true,
  });
});

test("each relevant quality issue steps confidence down once; others don't count", () => {
  const issues = [issue("blurry", ["eye", "hair"]), issue("uneven-light", ["skin"])];
  const eye = combineConfidence({ trait: "eye", margin: 0.9, issues });
  expect(eye.level).toBe("medium");
  expect(eye.reasons).toEqual(["blurry"]);
  expect(combineConfidence({ trait: "skin", margin: 0.9, issues }).level).toBe("low"); // cap, then -1
  expect(
    combineConfidence({ trait: "eye", margin: 0.9, issues: [...issues, issue("color-cast", ["eye", "hair", "skin"])] })
      .level
  ).toBe("low");
});

test("hair (Vaughn 2009) and skin (Burrow 2025) are capped at medium; eye can be high", () => {
  expect(combineConfidence({ trait: "hair", margin: 1, issues: [] }).level).toBe("medium");
  expect(combineConfidence({ trait: "skin", margin: 1, issues: [] }).level).toBe("medium");
  expect(combineConfidence({ trait: "eye", margin: 1, issues: [] }).level).toBe("high");
});

test("offAxisDegrees reads the head's turn from the matrix diagonal", () => {
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  expect(offAxisDegrees(identity)).toBeCloseTo(0);
  // 30° yaw about the y axis; same answer for either storage order
  const c = Math.cos(Math.PI / 6);
  const s = Math.sin(Math.PI / 6);
  const colMajor = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, -50, 1];
  const rowMajor = [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, -50, 0, 0, 0, 1];
  expect(offAxisDegrees(colMajor)).toBeCloseTo(30);
  expect(offAxisDegrees(rowMajor)).toBeCloseTo(30);
  // uniformly scaled matrices give the same angle
  expect(offAxisDegrees(colMajor.map((v, i) => (i < 12 ? v * 3 : v)))).toBeCloseTo(30);
  expect(offAxisDegrees(null)).toBeNull();
});

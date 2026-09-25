import { analyze } from "./analyze";
import { summarizeResult } from "./summary";
import { BLUE, syntheticFace } from "../test/syntheticFace";

function blueResult() {
  const face = syntheticFace({ right: BLUE, left: BLUE });
  return analyze(
    { imageData: face.imageData, width: face.imageData.width, height: face.imageData.height },
    {
      width: face.imageData.width,
      height: face.imageData.height,
      mask: { width: 1, height: 1, data: new Uint8Array([0]) },
      faces: [{ points: face.points, blendshapes: {}, matrix: null }],
    }
  );
}

test("summarizes each section with labels and rounded numbers", () => {
  const text = summarizeResult(blueResult(), { date: new Date("2026-09-24T12:00:00Z") });
  expect(text).toMatch(/^Trait Genetics Explainer results \(2026-09-24\)/);
  expect(text).toMatch(/Eye color: Blue \/ gray \((high|medium|low) confidence; pixel index 1\.00, green share 0%\)/);
  // unmeasurable traits say why instead of printing a number
  expect(text).toMatch(/Hair color: Not measured \(Not enough hair is visible/);
  expect(text).toContain("FACE SHAPE");
  expect(text).toContain("PHOTO CHECK");
});

test("includes the visitor's own picks and a color correction", () => {
  const text = summarizeResult(blueResult(), {
    overrides: { eye: "brown", earlobes: "attached" },
    correction: { x: 1, y: 2 },
  });
  expect(text).toContain("You picked: Brown");
  expect(text).toMatch(/YOU TOLD US\nEarlobes: Attached/);
  expect(text).toContain("Colors corrected for the lighting");
});

test("stays a short, readable text: no pixel data or coordinates", () => {
  const text = summarizeResult(blueResult());
  expect(text.length).toBeLessThan(4000);
  expect(text).not.toMatch(/\{|\[object|"x":/);
});

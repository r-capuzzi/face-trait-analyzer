import { assessQuality, faceSharpness, sampleSclera } from "./quality";
import { BLUE, syntheticFace } from "../test/syntheticFace";

const ids = (q) => q.issues.map((i) => i.id);

function run(overrides = {}) {
  const { imageData, points } = overrides.fixture ?? syntheticFace({ right: BLUE, left: BLUE });
  return assessQuality({
    imageData,
    face: { points, blendshapes: {}, matrix: null, ...overrides.face },
    traits: overrides.traits ?? {},
  });
}

test("the synthetic clean face raises no issues", () => {
  expect(ids(run())).toEqual([]);
});

test("sclera sampling finds the whites of the eyes, not the iris or skin", () => {
  const { imageData, points } = syntheticFace({ right: BLUE, left: BLUE });
  const s = sampleSclera(imageData, points);
  expect(s.L).toBeGreaterThan(90);
  expect(Math.abs(s.b)).toBeLessThan(5);
});

test("a strong warm cast on the sclera is reported and affects every trait", () => {
  // tint the whole image orange: boost red, cut blue
  const fixture = syntheticFace({ right: BLUE, left: BLUE });
  const d = fixture.imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i + 2] = Math.round(d[i + 2] * 0.55);
  }
  const q = run({ fixture });
  const cast = q.issues.find((i) => i.id === "color-cast");
  expect(cast.message).toMatch(/warm/);
  expect(cast.affects).toEqual(["eye", "hair", "skin"]);
});

test("closed-eye blendshapes, a turned head, clipping and uneven light are all flagged", () => {
  const c = Math.cos((40 * Math.PI) / 180);
  const s = Math.sin((40 * Math.PI) / 180);
  const q = run({
    face: {
      blendshapes: { eyeBlinkLeft: 0.8 },
      matrix: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, -50, 1],
    },
    traits: { skin: { clippedShare: 0.2, unevenLighting: true } },
  });
  expect(ids(q)).toEqual(
    expect.arrayContaining(["eyes-closed", "head-turned", "overexposed", "uneven-light"])
  );
});

test("sharpness drops when the image is blurred", () => {
  const sharp = syntheticFace({ right: BLUE, left: BLUE });
  const blurred = syntheticFace({ right: BLUE, left: BLUE });
  boxBlur(blurred.imageData, 6);
  expect(faceSharpness(blurred.imageData, blurred.points)).toBeLessThan(
    faceSharpness(sharp.imageData, sharp.points)
  );
});

function boxBlur({ width, height, data }, r) {
  const src = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0;
        let n = 0;
        for (let dx = -r; dx <= r; dx++) {
          const xx = Math.min(width - 1, Math.max(0, x + dx));
          sum += src[(y * width + xx) * 4 + ch];
          n++;
        }
        data[(y * width + x) * 4 + ch] = sum / n;
      }
    }
  }
}

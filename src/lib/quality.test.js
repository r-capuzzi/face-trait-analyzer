import { assessQuality, faceSharpness, glassesShare, sampleSclera } from "./quality";
import { MASK } from "./maskCategories";
import { BLUE, syntheticFace } from "../test/syntheticFace";

const ids = (q) => q.issues.map((i) => i.id);

function run(overrides = {}) {
  const { imageData, points } = overrides.fixture ?? syntheticFace({ right: BLUE, left: BLUE });
  return assessQuality({
    imageData,
    face: { points, blendshapes: {}, matrix: null, ...overrides.face },
    traits: overrides.traits ?? {},
    mask: overrides.mask,
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

// a mask the size of the synthetic face with frames drawn around both eyes
function maskWithFrames(frames) {
  const W = 400;
  const H = 200;
  const data = new Uint8Array(W * H).fill(MASK.FACE_SKIN);
  if (frames) {
    for (const cx of [100, 300]) {
      for (let y = 50; y < 150; y++) {
        for (let x = cx - 70; x < cx + 70; x++) {
          const edge = Math.abs(x - cx) > 60 || Math.abs(y - 100) > 40;
          if (edge) data[y * W + x] = MASK.OTHERS;
        }
      }
    }
  }
  return { width: W, height: H, data };
}

test("glasses (the model's 'accessories' around the eyes) lower eye confidence", () => {
  const { points } = syntheticFace({ right: BLUE, left: BLUE });
  expect(glassesShare(maskWithFrames(true), points, 400, 200)).toBeGreaterThan(0.05);
  expect(glassesShare(maskWithFrames(false), points, 400, 200)).toBe(0);
  const issue = run({ mask: maskWithFrames(true) }).issues.find((i) => i.id === "glasses");
  expect(issue.affects).toEqual(["eye"]);
  expect(ids(run({ mask: maskWithFrames(false) }))).not.toContain("glasses");
});

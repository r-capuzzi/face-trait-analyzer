import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { BLUE, syntheticFace } from "./test/syntheticFace";
import { syntheticHead } from "./test/syntheticHead";
import { designedFace } from "./test/designedFace";
import { loadImageFile, ImageLoadError } from "./lib/imageLoad";
import { getVision } from "./lib/vision";

// MediaPipe needs WebAssembly + WebGL and jsdom has no image decoding, so
// both edges are mocked; everything between them (analysis, trait math,
// rendering) runs for real on a synthetic face.
vi.mock("./lib/imageLoad", async (importOriginal) => ({
  ...(await importOriginal()),
  loadImageFile: vi.fn(),
}));
vi.mock("./lib/vision", async (importOriginal) => ({
  ...(await importOriginal()),
  getVision: vi.fn(),
}));

const photo = new File(["x"], "me.jpg", { type: "image/jpeg" });
const blueFace = syntheticFace({ right: BLUE, left: BLUE });

function mockPipeline({
  faces,
  imageData = blueFace.imageData,
  mask = { width: 1, height: 1, data: new Uint8Array([0]) },
}) {
  loadImageFile.mockResolvedValue({
    canvas: {},
    imageData,
    width: imageData.width,
    height: imageData.height,
  });
  getVision.mockResolvedValue({
    detect: () => ({ width: imageData.width, height: imageData.height, mask, faces }),
  });
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

async function upload() {
  const user = userEvent.setup();
  render(<App />);
  await user.upload(screen.getByLabelText(/choose a photo/i), photo);
  return user;
}

test("a blue-eyed photo is measured and explained as blue", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: {}, matrix: null }] });
  await upload();
  const card = await screen.findByRole("article", { name: "Eye color" });
  expect(within(card).getByText(/Measured:/)).toHaveTextContent("Blue / gray");
  expect(within(card).getByText(/two copies of the "blue" version/)).toBeInTheDocument();
});

test("correcting the result switches the explanation to the chosen color", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: {}, matrix: null }] });
  const user = await upload();
  const card = await screen.findByRole("article", { name: "Eye color" });
  await user.selectOptions(within(card).getByRole("combobox"), "brown");
  expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent(/Brown/);
  expect(within(card).getByText(/can't tell one copy from two/)).toBeInTheDocument();
});

test("hair and skin cards show their measurements; unmeasurable eyes say why", async () => {
  const head = syntheticHead({ skin: [200, 160, 130], hair: [90, 65, 45] });
  mockPipeline({
    faces: [{ points: head.points, blendshapes: {}, matrix: null }],
    imageData: head.imageData,
    mask: head.mask,
  });
  await upload();

  const hair = await screen.findByRole("article", { name: "Hair color" });
  expect(within(hair).getByText(/Measured:/)).toHaveTextContent("Brown");
  // photo-measured hair is never high confidence (Vaughn 2009); this flat
  // synthetic image also trips the blur check, so it lands lower still
  expect(within(hair).getByText(/^(High|Medium|Low) confidence$/)).not.toHaveTextContent("High");

  const skin = screen.getByRole("article", { name: "Skin tone" });
  expect(within(skin).getByText(/Closest Monk Skin Tone/)).toBeInTheDocument();
  expect(within(skin).getByText(/can't be traced back to a genotype/)).toBeInTheDocument();

  const eye = screen.getByRole("article", { name: "Eye color" });
  expect(within(eye).getByText(/too small, closed or covered/)).toBeInTheDocument();
});

test("a photo problem is listed in the photo check and lowers the affected trait's confidence", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: { eyeBlinkLeft: 0.9 }, matrix: null }] });
  await upload();
  expect(await screen.findByText(/eyes look partly closed/)).toBeInTheDocument();
  const eye = screen.getByRole("article", { name: "Eye color" });
  expect(within(eye).getByText(/^(High|Medium|Low) confidence$/)).toHaveTextContent("Medium confidence");
});

test("the face-shape section shows proportions, the canon comparison and expression notes", async () => {
  mockPipeline({
    faces: [
      {
        points: designedFace(),
        blendshapes: { mouthSmileLeft: 0.9, mouthSmileRight: 0.9 },
        matrix: null,
      },
    ],
  });
  await upload();
  const nose = await screen.findByRole("article", { name: "Nose width" });
  expect(within(nose).getByText("1.00×")).toBeInTheDocument();
  expect(within(nose).getByText(/held for only 40%/)).toBeInTheDocument();
  // a smile (without squinting) flags lips and nose, not eyes
  const lips = screen.getByRole("article", { name: "Lips and mouth" });
  expect(within(lips).getByText(/You're smiling/)).toBeInTheDocument();
  expect(within(nose).getByText(/flares the nose wings/)).toBeInTheDocument();
  const eyes = screen.getByRole("article", { name: "Eye shape" });
  expect(within(eyes).queryByText(/smiling/)).not.toBeInTheDocument();
});

test("a photo with no face shows a helpful error instead of results", async () => {
  mockPipeline({ faces: [] });
  await upload();
  expect(await screen.findByRole("alert")).toHaveTextContent(/No face found/);
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
});

test("an unreadable HEIC photo explains how to convert it", async () => {
  loadImageFile.mockRejectedValue(new ImageLoadError("heic", "This browser can't open HEIC photos."));
  await upload();
  expect(await screen.findByRole("alert")).toHaveTextContent(/HEIC/);
});

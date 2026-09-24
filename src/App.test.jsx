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
  preloadVision: vi.fn(), // hovering the upload area must not start real MediaPipe in jsdom
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
  expect(within(card).getByText("Blue / gray", { selector: ".result__value" })).toBeInTheDocument();
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
  expect(within(hair).getByText(/Brown/, { selector: ".result__value" })).toBeInTheDocument();
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
  // this fixture has no skin mask, so the brows can't be measured - and the card says why
  const brows = screen.getByRole("article", { name: "Eyebrows" });
  expect(within(brows).getByText(/aren't clearly visible/)).toBeInTheDocument();
  expect(within(brows).queryByText("Unibrow")).not.toBeInTheDocument();
  // likewise the hairline and facial-hair cards explain why they can't measure
  const hairlineCard = screen.getByRole("article", { name: "Forehead & hairline" });
  expect(within(hairlineCard).getByText(/No hairline was found/)).toBeInTheDocument();
  const beardCard = screen.getByRole("article", { name: "Facial hair" });
  expect(within(beardCard).getByText(/cheeks aren't clearly visible/)).toBeInTheDocument();
});

test("self-reported traits say they don't use the photo, and explain whatever you pick", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: {}, matrix: null }] });
  const user = await upload();
  const texture = await screen.findByRole("article", { name: "Hair texture" });
  expect(within(texture).getByText(/can't reliably measure curl/)).toBeInTheDocument();
  // nothing measured -> no confidence meter, and no explanation until you pick
  expect(within(texture).queryByText(/confidence$/)).not.toBeInTheDocument();
  expect(within(texture).queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
  await user.selectOptions(within(texture).getByRole("combobox"), "curly");
  expect(within(texture).getByRole("heading", { level: 3 })).toHaveTextContent("Curly");

  const freckles = screen.getByRole("article", { name: "Freckles" });
  await user.selectOptions(within(freckles).getByRole("combobox"), "many");
  expect(within(freckles).getByText(/MC1R, the gene best known for red hair/)).toBeInTheDocument();
});

test("the classroom 'single-gene' traits explain what the studies actually found", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: {}, matrix: null }] });
  const user = await upload();

  const ears = await screen.findByRole("article", { name: "Earlobes" });
  await user.selectOptions(within(ears).getByRole("combobox"), "attached");
  expect(within(ears).getByText(/found 49 DNA regions/)).toBeInTheDocument();

  // chin and cheek dimples have very different evidence behind them
  const dimples = screen.getByRole("article", { name: "Dimples" });
  await user.selectOptions(within(dimples).getByRole("combobox"), "chin");
  expect(within(dimples).getByText(/about 57 DNA regions/)).toBeInTheDocument();
  await user.selectOptions(within(dimples).getByRole("combobox"), "cheek");
  expect(within(dimples).getByText(/no genetic study listed/)).toBeInTheDocument();

  const peak = screen.getByRole("article", { name: "Widow's peak" });
  await user.selectOptions(within(peak).getByRole("combobox"), "yes");
  expect(within(peak).getByText(/a little better than a coin toss/)).toBeInTheDocument();
  // database sources link with their own label rather than "full text"
  expect(within(dimples).getByRole("link", { name: "catalog entry" })).toHaveAttribute(
    "href",
    "https://www.ebi.ac.uk/gwas/studies/GCST003989"
  );
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

describe("color correction", () => {
  // a fresh face per test: the correction tests paint into the image
  function faceWithCard(grayCardAtCenter) {
    const face = syntheticFace({ right: BLUE, left: BLUE });
    const { data, width } = face.imageData;
    if (grayCardAtCenter) {
      // a gray card between the eyes, where the keyboard crosshair starts
      for (let y = 85; y < 115; y++) for (let x = 185; x < 215; x++) data.set([150, 150, 150, 255], (y * width + x) * 4);
    }
    return face;
  }

  test("picking a gray spot re-measures the colors, and can be undone", async () => {
    const face = faceWithCard(true);
    mockPipeline({ faces: [{ points: face.points, blendshapes: {}, matrix: null }], imageData: face.imageData });
    const user = await upload();
    await user.click(await screen.findByRole("button", { name: "Correct the colors" }));
    // the photo takes focus so the crosshair can be moved from the keyboard
    const photo = screen.getByLabelText(/Move the crosshair with the arrow keys/);
    expect(photo).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByText(/Colors corrected for the lighting/)).toBeInTheDocument();
    expect(screen.getByText(/Colors below are corrected for the lighting/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: "Correct the colors" })).toBeInTheDocument();
    expect(screen.queryByText(/Colors below are corrected/)).not.toBeInTheDocument();
  });

  test("a colored spot is refused with a reason, and Escape cancels", async () => {
    const face = faceWithCard(false); // the crosshair starts on skin, which isn't neutral
    mockPipeline({ faces: [{ points: face.points, blendshapes: {}, matrix: null }], imageData: face.imageData });
    const user = await upload();
    await user.click(await screen.findByRole("button", { name: "Correct the colors" }));
    await user.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent(/clearly colored/);
    // still picking: nothing was changed
    expect(screen.queryByText(/Colors below are corrected/)).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Correct the colors" })).toBeInTheDocument();
  });
});

test("each card explains why the trait evolved, with the strength of the evidence", async () => {
  mockPipeline({ faces: [{ points: blueFace.points, blendshapes: {}, matrix: null }] });
  const user = await upload();
  const skin = await screen.findByRole("article", { name: "Skin tone" });
  await user.click(within(skin).getByText("Why it evolved"));
  expect(within(skin).getByText(/skin needs UVB light to make vitamin D/)).toBeInTheDocument();
  expect(within(skin).getAllByText("Well supported").length).toBeGreaterThan(0);
  expect(within(skin).getAllByText("Leading explanation").length).toBeGreaterThan(0);
  // a trait with no known purpose says so rather than inventing one
  const peak = screen.getByRole("article", { name: "Widow's peak" });
  expect(within(peak).getByText("Unknown")).toBeInTheDocument();
});

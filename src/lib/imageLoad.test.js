import { checkFileType, fitWithin, ImageLoadError, MAX_DIMENSION } from "./imageLoad";

test("fitWithin shrinks the long side to the cap and keeps aspect ratio", () => {
  const out = fitWithin(8000, 6000);
  expect(out.width).toBe(MAX_DIMENSION);
  expect(out.height).toBe(1536);
});

test("fitWithin never upscales a small photo", () => {
  expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480, scale: 1 });
});

test("checkFileType rejects non-images and flags HEIC", () => {
  expect(() => checkFileType(new File(["x"], "notes.pdf", { type: "application/pdf" }))).toThrow(
    ImageLoadError
  );
  expect(checkFileType(new File(["x"], "IMG_0001.HEIC", { type: "" }))).toEqual({ isHeic: true });
  expect(checkFileType(new File(["x"], "me.jpg", { type: "image/jpeg" }))).toEqual({ isHeic: false });
});

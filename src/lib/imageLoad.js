// Turns an uploaded File into pixels we can measure. Everything stays in
// memory in this tab - the file is never sent anywhere.

// Big enough that an iris in a normal selfie still spans dozens of pixels,
// small enough that a 48 MP phone photo doesn't stall the tab.
export const MAX_DIMENSION = 2048;

export class ImageLoadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ImageLoadError";
    this.code = code;
  }
}

const HEIC = /\.(heic|heif)$/i;

// Scale (w, h) down to fit inside maxDim, never up.
export function fitWithin(width, height, maxDim = MAX_DIMENSION) {
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  };
}

export function checkFileType(file) {
  const isHeic = HEIC.test(file.name) || /image\/hei[cf]/.test(file.type);
  if (!isHeic && !file.type.startsWith("image/")) {
    throw new ImageLoadError(
      "not-image",
      "That file isn't an image. Try a JPEG or PNG photo."
    );
  }
  return { isHeic };
}

export async function loadImageFile(file) {
  const { isHeic } = checkFileType(file);

  let bitmap;
  try {
    // 'from-image' applies the EXIF rotation phones write instead of
    // rotating the actual pixels, so portrait photos come out upright.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw isHeic
      ? new ImageLoadError(
          "heic",
          "This browser can't open HEIC photos. Export it as JPEG first (on iPhone: Settings > Camera > Formats > Most Compatible, or share the photo as JPEG)."
        )
      : new ImageLoadError("decode", "Couldn't read that image. Try a different photo.");
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return { canvas, imageData: ctx.getImageData(0, 0, width, height), width, height };
}

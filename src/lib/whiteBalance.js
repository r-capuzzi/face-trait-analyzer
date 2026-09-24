// Color correction from a spot the user says is neutral (white or gray).
//
// Colored light (a warm bulb, open shade, a screen) tints every pixel in the
// same direction. If one surface in the photo is really neutral, the tint on
// it IS the lighting's cast, and scaling each color channel so that surface
// comes out gray removes the cast everywhere: the classic "white patch"
// correction, a von Kries-style per-channel scaling. It's done in linear
// light, where light from the scene actually adds up, not on the gamma-
// encoded 0-255 values.
//
// Only the color of the light is corrected, not its brightness: the picked
// spot keeps its own luminance (a gray wall stays gray instead of being
// pushed to white), so lightness-based measures like skin ITA aren't shifted
// by a guess about how bright the reference "should" be.

import { linearToSrgb, rgbToLab, srgbToLinear } from "./color";
import { isClipped } from "./pixels";
import { median } from "./stats";

export const REFERENCE = {
  radius: 4, // median over a 9x9 patch, so one noisy or odd pixel can't decide
  minL: 20, // L*: darker than this, sensor noise is a big share of the color
  maxClippedShare: 0.2, // a blown-out spot has lost its color (any channel at 254+)
  // Largest allowed ratio between the strongest and weakest channel gain.
  // Phones already auto white balance, so leftover casts are usually mild;
  // a spot needing more than this is far more likely a colored surface than
  // a neutral one under odd light. A starting value - CALIBRATE with photos
  // of a gray card under known lamps.
  maxGainRatio: 2.2,
};

const REASONS = {
  outside: "That spot is outside the photo.",
  clipped:
    "That spot is blown out to pure white, so its true color is lost. Pick something white or gray that isn't glaring, like a shirt in soft light.",
  dark: "That spot is too dark to read its color reliably. Pick a lighter white or gray surface.",
  colored:
    "That spot looks clearly colored, not white or gray, so correcting to it would tint everything else. Pick a neutral surface.",
};

// Linear-light luminance of sRGB primaries (IEC 61966-2-1 / Rec. 709).
const luminance = ({ r, g, b }) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Reads the patch around (x, y) and returns per-channel gains that make it
// neutral at its own luminance: { ok: true, gains, reference } or
// { ok: false, reason } with text to show the user.
export function gainsFromReference(imageData, x, y) {
  const { width, height, data } = imageData;
  const cx = Math.round(x);
  const cy = Math.round(y);
  if (cx < 0 || cy < 0 || cx >= width || cy >= height) return { ok: false, reason: REASONS.outside };

  const R = REFERENCE.radius;
  const lin = { r: [], g: [], b: [] };
  let clipped = 0;
  let total = 0;
  for (let py = Math.max(0, cy - R); py <= Math.min(height - 1, cy + R); py++) {
    for (let px = Math.max(0, cx - R); px <= Math.min(width - 1, cx + R); px++) {
      const i = (py * width + px) * 4;
      total++;
      if (Math.max(data[i], data[i + 1], data[i + 2]) >= 254) {
        clipped++;
        continue;
      }
      lin.r.push(srgbToLinear(data[i]));
      lin.g.push(srgbToLinear(data[i + 1]));
      lin.b.push(srgbToLinear(data[i + 2]));
    }
  }
  if (clipped / total > REFERENCE.maxClippedShare || lin.r.length === 0) {
    return { ok: false, reason: REASONS.clipped };
  }

  const ref = { r: median(lin.r), g: median(lin.g), b: median(lin.b) };
  const lab = rgbToLab(linearToSrgb(ref.r), linearToSrgb(ref.g), linearToSrgb(ref.b));
  if (lab.L < REFERENCE.minL || Math.min(ref.r, ref.g, ref.b) <= 0) return { ok: false, reason: REASONS.dark };

  const Y = luminance(ref);
  const gains = { r: Y / ref.r, g: Y / ref.g, b: Y / ref.b };
  const spread = Math.max(gains.r, gains.g, gains.b) / Math.min(gains.r, gains.g, gains.b);
  if (spread > REFERENCE.maxGainRatio) return { ok: false, reason: REASONS.colored };

  return { ok: true, gains, reference: { x: cx, y: cy, lab } };
}

// Returns a corrected copy of the image (the original is left untouched, so
// "undo" and a second pick always start from the real photo). A 256-entry
// lookup table per channel makes this a single pass over the pixels.
//
// Clipped pixels are copied unchanged. A channel stuck at 255 only says
// "at least this bright", so scaling it down would invent a color that was
// never recorded - and would hide the pixel from the overexposure check,
// which looks for exactly those saturated values.
export function applyGains(imageData, gains) {
  const lut = ["r", "g", "b"].map((c) =>
    Uint8ClampedArray.from({ length: 256 }, (_, v) => linearToSrgb(srgbToLinear(v) * gains[c]))
  );
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (isClipped({ r: data[i], g: data[i + 1], b: data[i + 2] })) {
      out.set(data.subarray(i, i + 4), i);
      continue;
    }
    out[i] = lut[0][data[i]];
    out[i + 1] = lut[1][data[i + 1]];
    out[i + 2] = lut[2][data[i + 2]];
    out[i + 3] = data[i + 3];
  }
  // a real ImageData in the browser (the overlay draws it with putImageData);
  // a plain object where ImageData doesn't exist (tests under jsdom)
  return typeof ImageData === "undefined" ? { width, height, data: out } : new ImageData(out, width, height);
}

// Pixel sampling over ImageData. Kept separate from MediaPipe so tests can
// paint synthetic images and check exactly which pixels get measured.

import { rgbToLab } from "./color";

// Category of the mask pixel under image pixel (x, y). The mask may be a
// different resolution than the image, so coordinates are rescaled. Where
// the sharper head crop (vision.js) covers the point, it's read instead.
export function maskAt(mask, x, y, imgW, imgH) {
  const c = mask.crop;
  if (c && x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1) {
    const cx = Math.min(c.width - 1, Math.floor(((x - c.x0) * c.width) / (c.x1 - c.x0)));
    const cy = Math.min(c.height - 1, Math.floor(((y - c.y0) * c.height) / (c.y1 - c.y0)));
    return c.data[cy * c.width + cx];
  }
  const mx = Math.min(mask.width - 1, Math.floor((x * mask.width) / imgW));
  const my = Math.min(mask.height - 1, Math.floor((y * mask.height) / imgH));
  return mask.data[my * mask.width + mx];
}

// Every pixel inside the box [x0,x1]x[y0,y1] (clamped to the image) for
// which include(x, y) is true, as {x, y, r, g, b, lab}.
// `stride` > 1 samples every n-th pixel in each direction - plenty for large
// regions like hair, where millions of Lab conversions would stall the tab.
export function samplePixels(imageData, box, include, stride = 1) {
  const { width, height, data } = imageData;
  const x0 = Math.max(0, Math.floor(box.x0));
  const y0 = Math.max(0, Math.floor(box.y0));
  const x1 = Math.min(width - 1, Math.ceil(box.x1));
  const y1 = Math.min(height - 1, Math.ceil(box.y1));
  const out = [];
  for (let y = y0; y <= y1; y += stride) {
    for (let x = x0; x <= x1; x += stride) {
      // test the pixel's center, not its corner
      if (!include(x + 0.5, y + 0.5)) continue;
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      out.push({ x, y, r, g, b, lab: rgbToLab(r, g, b) });
    }
  }
  return out;
}

export function circleBox({ cx, cy, r }) {
  return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r };
}

// A blown highlight (any channel saturated) or crushed black (every channel
// at the floor) has lost its true color, so it can't be measured. A single
// dark channel alone is fine - very dark hair legitimately has one.
export function isClipped({ r, g, b }) {
  return Math.max(r, g, b) >= 254 || Math.max(r, g, b) <= 2;
}

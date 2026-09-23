// Photo-quality checks. Each issue says which traits it undermines; the
// confidence step downgrades exactly those. Nothing here blocks analysis -
// the trait modules already refuse to measure what they can't see.

import { chroma } from "./color";
import { circleBox, isClipped, samplePixels } from "./pixels";
import { eyeOpening, faceFrame, irisCircle, pointInPolygon } from "./regions";
import { median, percentile } from "./stats";

// Provisional thresholds (CALIBRATE on labeled photos); each is chosen to
// flag only clearly bad photos, not to nitpick ordinary selfies.
export const QUALITY = {
  minIrisRadius: 10, // px; below this the iris ring has too few pixels to trust
  maxOffAxisDeg: 25, // head turned/tilted away from the camera
  blinkScore: 0.5, // MediaPipe eyeBlink blendshape
  minSharpness: 40, // variance of the Laplacian on a ~256 px face crop
  maxClippedShare: 0.05, // blown-out highlights on the face
  minScleraL: 45, // the whites of the eyes should be the brightest thing on any face
  // Real sclera is slightly warm and pink, never neutral, so only strong casts count.
  scleraCast: { maxB: 22, minB: -4, maxAbsA: 12 },
};

const ALL = ["eye", "hair", "skin"];

// Angle between the face's forward direction and the camera axis. Only the
// diagonal element m[10] (= cos of that angle for a rotation) is used, which
// reads the same whether MediaPipe's 4x4 is row- or column-major; dividing by
// the third column's norm cancels any uniform scale in the matrix.
export function offAxisDegrees(m) {
  if (!m || m.length < 16) return null;
  const s = Math.hypot(m[8], m[9], m[10]) || 1;
  const c = Math.min(1, Math.abs(m[10]) / s);
  return (Math.acos(c) * 180) / Math.PI;
}

// Variance of a 4-neighbor Laplacian over the face, resampled so the face
// is ~256 px wide: sharp photos have strong local contrast (high variance),
// blurry ones don't. Resampling makes the number comparable across photo sizes.
export function faceSharpness(imageData, points) {
  const f = faceFrame(points);
  const half = 1.3 * f.iod;
  const step = Math.max(1, (2 * half) / 256);
  const { width, height, data } = imageData;
  const gray = (x, y) => {
    const xi = Math.min(width - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(height - 1, Math.max(0, Math.round(y)));
    const i = (yi * width + xi) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const values = [];
  for (let y = f.mid.y - half * 0.6; y <= f.mid.y + half; y += step) {
    for (let x = f.mid.x - half; x <= f.mid.x + half; x += step) {
      values.push(
        gray(x - step, y) + gray(x + step, y) + gray(x, y - step) + gray(x, y + step) - 4 * gray(x, y)
      );
    }
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}

// Whites of the eyes: inside the eyelids, outside the iris, brighter half
// only (drops lashes, lid shadow and the pink inner-corner tissue).
export function sampleSclera(imageData, points) {
  const px = [];
  for (const side of ["right", "left"]) {
    const iris = irisCircle(points, side);
    const lids = eyeOpening(points, side);
    const box = circleBox({ cx: iris.cx, cy: iris.cy, r: iris.r * 3 });
    px.push(
      ...samplePixels(
        imageData,
        box,
        (x, y) => pointInPolygon(x, y, lids) && Math.hypot(x - iris.cx, y - iris.cy) > iris.r * 1.15
      ).filter((p) => !isClipped(p))
    );
  }
  if (px.length < 30) return null;
  const cut = percentile(
    px.map((p) => p.lab.L),
    0.5
  );
  const bright = px.filter((p) => p.lab.L >= cut);
  return {
    L: median(bright.map((p) => p.lab.L)),
    a: median(bright.map((p) => p.lab.a)),
    b: median(bright.map((p) => p.lab.b)),
  };
}

export function assessQuality({ imageData, face, traits }) {
  const issues = [];
  const add = (id, affects, message) => issues.push({ id, affects, message });
  const { points } = face;

  const irisR = Math.min(irisCircle(points, "right").r, irisCircle(points, "left").r);
  if (irisR < QUALITY.minIrisRadius) {
    add("small-face", ["eye"], "Your face is small in this photo, so the eyes have few pixels. Move closer or use a higher-resolution photo.");
  }

  const angle = offAxisDegrees(face.matrix);
  if (angle !== null && angle > QUALITY.maxOffAxisDeg) {
    add("head-turned", ALL, "Your head is turned away from the camera, which changes how light falls on your face. A straight-on photo works best.");
  }

  const blink = Math.max(face.blendshapes?.eyeBlinkLeft ?? 0, face.blendshapes?.eyeBlinkRight ?? 0);
  if (blink > QUALITY.blinkScore) {
    add("eyes-closed", ["eye"], "Your eyes look partly closed.");
  }

  if (faceSharpness(imageData, points) < QUALITY.minSharpness) {
    add("blurry", ["eye", "hair"], "The photo looks blurry, which smears colors together. Try a sharper photo.");
  }

  if ((traits.skin?.clippedShare ?? 0) > QUALITY.maxClippedShare) {
    add("overexposed", ["skin", "eye"], "Parts of your face are blown out by bright light or flash.");
  }
  if (traits.skin?.unevenLighting) {
    add("uneven-light", ["skin"], "Light falls unevenly across your face (one side is shadowed). Face a window or lamp directly.");
  }

  const sclera = sampleSclera(imageData, points);
  if (sclera) {
    if (sclera.L < QUALITY.minScleraL) {
      add("underexposed", ALL, "The photo is quite dark. Colors read darker than they are in dim light.");
    }
    const { maxB, minB, maxAbsA } = QUALITY.scleraCast;
    if (sclera.b > maxB || sclera.b < minB || Math.abs(sclera.a) > maxAbsA) {
      const tint = sclera.b > maxB ? "warm (orange)" : sclera.b < minB ? "cool (blue)" : "strongly tinted";
      add("color-cast", ALL, `The lighting looks ${tint}, judging by the whites of your eyes. Colored light shifts every measurement; daylight works best.`);
    }
  }

  return { issues, sclera, scleraChroma: sclera ? chroma(sclera) : null };
}

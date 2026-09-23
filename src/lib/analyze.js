// Turns raw detection output into per-trait results. Each trait module only
// ever sees plain pixels + geometry, so it's testable without MediaPipe.

import { combineConfidence } from "./confidence";
import { assessQuality } from "./quality";
import { faceFrame } from "./regions";
import { classifyEyeColor, measureEyeColor } from "./traits/eyeColor";
import { classifyHairColor, measureHairColor } from "./traits/hairColor";
import { classifySkinTone, measureSkinTone } from "./traits/skinTone";

export class AnalysisError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

// With several people in frame, measure the one closest to the camera,
// i.e. the widest pupil spacing in pixels.
export function pickPrimaryFace(faces) {
  if (faces.length === 0) {
    throw new AnalysisError(
      "no-face",
      "No face found. Try a well-lit, front-facing photo where your whole face is visible."
    );
  }
  return faces.reduce((best, f) =>
    faceFrame(f.points).iod > faceFrame(best.points).iod ? f : best
  );
}

// One trait failing (a bug, an odd photo) must never take down the others.
function isolated(fn, fallback) {
  try {
    return fn();
  } catch (err) {
    console.error(err);
    return fallback ?? { status: "error", reason: "This trait couldn't be measured from this photo." };
  }
}

const measureThenClassify = (measure, classify) => () => {
  const m = measure();
  return m.status === "ok" ? { ...m, ...classify(m) } : m;
};

export function analyze(image, detection) {
  const face = pickPrimaryFace(detection.faces);
  const { imageData } = image;
  const { mask } = detection;
  const warnings = [];
  if (detection.faces.length > 1) {
    warnings.push("More than one face found - measuring the largest one.");
  }

  const traits = {
    eye: isolated(measureThenClassify(() => measureEyeColor(imageData, face.points), classifyEyeColor)),
    hair: isolated(
      measureThenClassify(() => measureHairColor(imageData, mask, face.points), classifyHairColor)
    ),
    skin: isolated(
      measureThenClassify(() => measureSkinTone(imageData, mask, face.points), classifySkinTone)
    ),
  };

  const quality = isolated(() => assessQuality({ imageData, face, traits }), { issues: [] });
  for (const [name, t] of Object.entries(traits)) {
    if (t.status === "ok") {
      t.confidence = combineConfidence({ trait: name, margin: t.margin, issues: quality.issues });
    }
  }

  return { face, mask, warnings, traits, quality };
}

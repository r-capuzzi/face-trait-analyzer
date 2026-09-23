// Thin wrapper around MediaPipe. Its only job is to find WHERE things are:
// 478 face landmarks and a per-pixel category mask (hair / face skin / ...).
// All color measurement happens afterwards in plain JS (src/lib/traits/),
// which is what keeps that logic unit-testable without loading any model.

import { FaceLandmarker, FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

// __MEDIAPIPE_VERSION__ is injected by vite.config.js from the installed
// package, so the WASM runtime always matches the JS API.
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${__MEDIAPIPE_VERSION__}/wasm`;

// Pinned model versions (".../1/...", not ".../latest/...") so results can't
// change underneath us when Google publishes a new model.
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SEGMENTER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite";

export const MODEL_DOWNLOAD_MB = 32; // face 3.8 + segmenter 16.4 + wasm 11.8

let visionPromise = null;

// Loads both models once per page. A failed load (e.g. offline) clears the
// cache so the next attempt retries instead of re-throwing the old error.
export function getVision() {
  if (!visionPromise) {
    visionPromise = createVision().catch((err) => {
      visionPromise = null;
      throw err;
    });
  }
  return visionPromise;
}

async function createVision() {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  // CPU delegate: single photos don't need GPU speed, and CPU gives the same
  // numbers on every machine (GPU float precision varies by driver).
  const [faceLandmarker, segmenter] = await Promise.all([
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      numFaces: 2, // 2 is enough to notice "more than one person" and warn
      outputFaceBlendshapes: true, // eyeBlink scores -> closed-eye check
      outputFacialTransformationMatrixes: true, // head pose check
    }),
    ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: SEGMENTER_MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    }),
  ]);
  return { detect: (image) => detect(faceLandmarker, segmenter, image) };
}

// image: canvas/ImageData/ImageBitmap. Returns plain JS objects only - no
// MediaPipe handles escape this function, so nothing needs closing later.
function detect(faceLandmarker, segmenter, image) {
  const { width, height } = image;
  const faces = faceLandmarker.detect(image);

  const seg = segmenter.segment(image);
  const categoryMask = seg.categoryMask;
  const mask = {
    data: new Uint8Array(categoryMask.getAsUint8Array()), // copy before close()
    width: categoryMask.width,
    height: categoryMask.height,
  };
  seg.close();

  return {
    width,
    height,
    mask,
    faces: faces.faceLandmarks.map((landmarks, i) => ({
      // normalized [0,1] -> pixel coordinates of our (downscaled) canvas
      points: landmarks.map((p) => ({ x: p.x * width, y: p.y * height })),
      blendshapes: Object.fromEntries(
        (faces.faceBlendshapes[i]?.categories ?? []).map((c) => [c.categoryName, c.score])
      ),
      matrix: faces.facialTransformationMatrixes[i]?.data ?? null,
    })),
  };
}

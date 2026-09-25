// Thin wrapper around MediaPipe. Its only job is to find WHERE things are:
// 478 face landmarks and a per-pixel category mask (hair / face skin / ...).
// All color measurement happens afterwards in plain JS (src/lib/traits/),
// which is what keeps that logic unit-testable without loading any model.

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

// Start the ~32 MB download as soon as someone shows intent (hovering,
// focusing or tapping the upload area), so the models are usually ready by
// the time they've picked a photo. Errors are left for getVision() to report.
export function preloadVision() {
  getVision().catch(() => {});
}

async function createVision() {
  // Loaded on first use, not with the page: MediaPipe's JS is a third of
  // the bundle, and nobody needs it until they pick (or hover over) a photo.
  const { FaceLandmarker, FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
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

function segmentToMask(segmenter, image) {
  const seg = segmenter.segment(image);
  const categoryMask = seg.categoryMask;
  const mask = {
    data: new Uint8Array(categoryMask.getAsUint8Array()), // copy before close()
    width: categoryMask.width,
    height: categoryMask.height,
  };
  seg.close();
  return mask;
}

// The segmenter shrinks whatever it's given to 256x256. When the face is
// small in the frame - a photo taken from 1.5 m, as the tips suggest - that
// leaves a few dozen mask pixels across the face, and hair, brow and skin
// edges come out blocky. So it runs a second time on a crop around the
// largest face, big enough for every trait's sampling (hair is sampled up
// to 3 pupil spacings out and 4.5 down), and pixels.maskAt reads that
// sharper crop wherever it covers. A face that already fills half the
// photo gains little from it and is skipped.
export const HEAD_CROP = { side: 3.2, up: 3.2, down: 4.8, maxShare: 0.5 };

export function headCropBox(points, width, height) {
  const r = points[468];
  const l = points[473];
  const iod = Math.hypot(l.x - r.x, l.y - r.y);
  const mid = { x: (r.x + l.x) / 2, y: (r.y + l.y) / 2 };
  const x0 = Math.max(0, Math.floor(mid.x - HEAD_CROP.side * iod));
  const x1 = Math.min(width, Math.ceil(mid.x + HEAD_CROP.side * iod));
  const y0 = Math.max(0, Math.floor(mid.y - HEAD_CROP.up * iod));
  const y1 = Math.min(height, Math.ceil(mid.y + HEAD_CROP.down * iod));
  if (x1 - x0 < 16 || y1 - y0 < 16) return null;
  if ((x1 - x0) * (y1 - y0) > HEAD_CROP.maxShare * width * height) return null;
  return { x0, y0, x1, y1 };
}

function cropMask(segmenter, image, box) {
  const canvas = document.createElement("canvas");
  canvas.width = box.x1 - box.x0;
  canvas.height = box.y1 - box.y0;
  canvas.getContext("2d").drawImage(image, box.x0, box.y0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return { ...box, ...segmentToMask(segmenter, canvas) };
}

// MediaPipe's face detector is built for faces that fill a good part of the
// frame: on the test photos it found nothing once the pupils were closer
// together than about 6-7% of the image width - a phone photo taken from
// 1.5 m (as the tips suggest) without zooming in. So when the whole photo
// finds no face, it looks again in zoomed-in windows - halves, then thirds
// of the photo, overlapping by half so a face on a boundary is still whole
// in one of them - and maps what it finds back to the whole photo.
// Once a level finds a face, the next closer level is searched too and
// merged: a face right at the detector's limit is found on one machine and
// missed on another (a distant two-person photo lost its second face on
// Linux Chrome), and one more zoom step gives it room.
export const ZOOM_STEPS = [2, 3, 4];

export function zoomWindows(width, height, zoom) {
  const w = Math.round(width / zoom);
  const h = Math.round(height / zoom);
  const positions = 2 * zoom - 1; // a window every half window
  const windows = [];
  for (let j = 0; j < positions; j++) {
    for (let i = 0; i < positions; i++) {
      windows.push({
        x0: Math.round((i * (width - w)) / (positions - 1)),
        y0: Math.round((j * (height - h)) / (positions - 1)),
        w,
        h,
        zoom,
      });
    }
  }
  return windows;
}

// landmarker output for `frame` (the whole photo, or a window of it) ->
// plain faces in whole-photo pixel coordinates
function toFaces(result, frame) {
  return result.faceLandmarks.map((landmarks, i) => {
    const matrix = result.facialTransformationMatrixes[i]?.data ? [...result.facialTransformationMatrixes[i].data] : null;
    // distance is estimated from how much of the frame the face fills, and
    // a window makes it fill `zoom` times more
    if (matrix && frame.zoom !== 1) matrix[14] *= frame.zoom;
    return {
      // normalized [0,1] -> pixel coordinates of our (downscaled) canvas
      points: landmarks.map((q) => ({ x: frame.x0 + q.x * frame.w, y: frame.y0 + q.y * frame.h })),
      blendshapes: Object.fromEntries((result.faceBlendshapes[i]?.categories ?? []).map((c) => [c.categoryName, c.score])),
      matrix,
    };
  });
}

function detectFaces(faceLandmarker, image) {
  const { width, height } = image;
  const whole = toFaces(faceLandmarker.detect(image), { x0: 0, y0: 0, w: width, h: height, zoom: 1 });
  if (whole.length) return whole;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  // every window at a zoom level, not just the first hit: in a group photo
  // the first window isn't necessarily the nearest person, and finding them
  // all keeps the "more than one face" warning working
  const searchLevel = (zoom) => {
    const found = [];
    for (const win of zoomWindows(width, height, zoom)) {
      canvas.width = win.w;
      canvas.height = win.h;
      ctx.drawImage(image, win.x0, win.y0, win.w, win.h, 0, 0, win.w, win.h);
      found.push(...toFaces(faceLandmarker.detect(canvas), win));
    }
    return found;
  };
  for (const [i, zoom] of ZOOM_STEPS.entries()) {
    const found = searchLevel(zoom);
    if (!found.length) continue;
    const closer = ZOOM_STEPS[i + 1];
    return distinctFaces(closer ? [...found, ...searchLevel(closer)] : found);
  }
  return [];
}

// Overlapping windows find the same face more than once; keep one per face
// (pupil midpoints closer than one pupil spacing are the same face).
export function distinctFaces(faces) {
  const mid = (f) => ({ x: (f.points[468].x + f.points[473].x) / 2, y: (f.points[468].y + f.points[473].y) / 2 });
  const iod = (f) => Math.hypot(f.points[473].x - f.points[468].x, f.points[473].y - f.points[468].y);
  const kept = [];
  for (const f of faces) {
    const m = mid(f);
    if (!kept.some((k) => Math.hypot(mid(k).x - m.x, mid(k).y - m.y) < iod(k))) kept.push(f);
  }
  return kept;
}

// image: canvas/ImageData/ImageBitmap. Returns plain JS objects only - no
// MediaPipe handles escape this function, so nothing needs closing later.
function detect(faceLandmarker, segmenter, image) {
  const { width, height } = image;
  const faces = detectFaces(faceLandmarker, image);
  const mask = segmentToMask(segmenter, image);

  const iod = (pts) => Math.hypot(pts[473].x - pts[468].x, pts[473].y - pts[468].y);
  const largest = faces.reduce((best, f) => (!best || iod(f.points) > iod(best.points) ? f : best), null);
  const box = largest && headCropBox(largest.points, width, height);
  if (box) mask.crop = cropMask(segmenter, image, box);

  return { width, height, mask, faces };
}

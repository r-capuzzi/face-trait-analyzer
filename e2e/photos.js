// The real photos the end-to-end tests analyze, and what a person looking
// at each one sees. They're MediaPipe's own sample images: faces never go
// into git (test-photos/ is ignored), so a missing photo is fetched from
// MediaPipe's public bucket by global-setup.js.
//
// Expectations are sets of acceptable answers, written from looking at each
// photo - not copied from the app's output - so a regression that makes the
// app confidently wrong fails, while an honest "Brown or Green / hazel" on a
// hazel eye passes.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const PHOTO_DIR = fileURLToPath(new URL("../test-photos/", import.meta.url));
const BUCKET = "https://storage.googleapis.com/mediapipe-assets/";

export const PHOTOS = {
  // studio portrait, older man: dark brown eyes, graying salt-and-pepper
  // hair, light skin; small in frame (iris ~8 px), squinting slightly
  portrait: {
    file: "portrait.jpg",
    expect: { eye: ["brown"], hair: ["gray"], skin: "measured" },
  },
  // bright, high-key studio photo: brown eyes, black hair, very light skin
  business: {
    file: "business-person.png",
    expect: { eye: ["brown"], hair: ["black"], skin: "measured" },
  },
  // 256 px face: gray-green hazel eyes with a brown center, chestnut-brown
  // hair (it measures right at the black/brown lightness boundary). The app
  // may hedge on either, but a hedge must include the right answer: "Black
  // or Brown" passes, a confident "Black" fails.
  stylizer: {
    file: "face_stylizer_raw_face_demo.png",
    expect: { eye: ["brown", "intermediate"], hair: ["brown", "black"], skin: "measured", mustInclude: { hair: "brown" } },
  },
  // two people shot from below, both with very dark brown hair: must warn
  // about the second face
  twoPeople: {
    file: "man-woman-okay.jpg",
    expect: { hair: ["black", "brown"], warning: /More than one face/ },
  },
};

export const photoPath = (key) => PHOTO_DIR + PHOTOS[key].file;

export async function ensurePhotos() {
  mkdirSync(PHOTO_DIR, { recursive: true });
  for (const { file } of Object.values(PHOTOS)) {
    const path = PHOTO_DIR + file;
    if (existsSync(path)) continue;
    const res = await fetch(BUCKET + file);
    if (!res.ok) throw new Error(`Couldn't fetch test photo ${file}: HTTP ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
}

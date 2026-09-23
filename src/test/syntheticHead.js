// Test fixture: a 400x400 "head" with a hair cap and a face-skin oval, a
// matching segmentation mask, and the landmark points skinPatches/faceFrame
// need. Pupils sit 60 px apart at y = 200.
import { MASK } from "../lib/maskCategories";
import { BROWS, IRIS, MOUTH_CORNERS, FACE_TOP } from "../lib/regions";

export const SIZE = 400;

export function syntheticHead({ skin, hair, rightCheek, hairEdge, hairRows = 150 }) {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  const mask = { width: SIZE, height: SIZE, data: new Uint8Array(SIZE * SIZE) };
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      let c = [40, 60, 90]; // background
      let m = MASK.BACKGROUND;
      const inFace = ((x - 200) / 110) ** 2 + ((y - 230) / 150) ** 2 <= 1;
      if (y < hairRows && x > 60 && x < 340) {
        m = MASK.HAIR;
        // optional contaminated rim (e.g. blended background) at the mask edge
        const nearEdge = y > hairRows - 4 || x < 64 || x > 336 || y < 4;
        c = hairEdge && nearEdge ? hairEdge : hair;
      } else if (inFace) {
        m = MASK.FACE_SKIN;
        c = rightCheek && x < 200 && y > 205 && y < 260 ? rightCheek : skin;
      }
      mask.data[i] = m;
      data.set([...c, 255], i * 4);
    }
  }

  const points = Array.from({ length: 478 }, () => ({ x: 200, y: 230 }));
  points[IRIS.right.center] = { x: 170, y: 200 };
  points[IRIS.left.center] = { x: 230, y: 200 };
  points[MOUTH_CORNERS.right] = { x: 180, y: 290 };
  points[MOUTH_CORNERS.left] = { x: 220, y: 290 };
  for (const i of [...BROWS.right, ...BROWS.left]) points[i] = { x: 200, y: 180 };
  points[FACE_TOP] = { x: 200, y: 130 };

  return { imageData: { width: SIZE, height: SIZE, data }, mask, points };
}

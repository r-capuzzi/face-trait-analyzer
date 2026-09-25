import { headCropBox, zoomWindows } from "./vision";

test("zoomed windows overlap by half and cover the whole photo", () => {
  for (const zoom of [2, 3]) {
    const wins = zoomWindows(1200, 900, zoom);
    expect(wins).toHaveLength((2 * zoom - 1) ** 2);
    expect(wins[0]).toMatchObject({ x0: 0, y0: 0, w: 600 * (2 / zoom), h: 450 * (2 / zoom) });
    const last = wins[wins.length - 1];
    expect(last.x0 + last.w).toBe(1200);
    expect(last.y0 + last.h).toBe(900);
    // neighbors step by half a window
    expect(wins[1].x0 - wins[0].x0).toBeCloseTo(wins[0].w / 2, 0);
  }
});

test("the head crop covers the hair sampling area, and is skipped when the face fills the photo", () => {
  const pts = [];
  pts[468] = { x: 470, y: 500 };
  pts[473] = { x: 530, y: 500 }; // pupils 60 px apart
  const box = headCropBox(pts, 2000, 2000);
  // hair is sampled 3 pupil spacings out and 4.5 down (hairColor.js)
  expect(box.x0).toBeLessThanOrEqual(500 - 3 * 60);
  expect(box.x1).toBeGreaterThanOrEqual(500 + 3 * 60);
  expect(box.y1).toBeGreaterThanOrEqual(500 + 4.5 * 60);
  // a selfie: the same face centered in a photo it nearly fills
  const selfie = [];
  selfie[468] = { x: 170, y: 200 };
  selfie[473] = { x: 230, y: 200 };
  expect(headCropBox(selfie, 400, 520)).toBeNull(); // the crop would be most of the photo
});

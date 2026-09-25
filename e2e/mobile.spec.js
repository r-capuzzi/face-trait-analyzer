// On a phone (most visitors take the photo on one): the same flow works,
// and nothing is wider than the screen.
import { test, expect } from "./fixtures.js";

const overflow = (app) =>
  app.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("uploading and reading results works on a phone-sized screen", async ({ app }) => {
  expect(await overflow(app)).toBeLessThanOrEqual(0);
  await app.analyze("business");
  await expect(app.page.locator("#results-heading")).toBeAttached();
  const s = await app.summary();
  expect(s.eye.measured).toBe(true);
  expect(await overflow(app)).toBeLessThanOrEqual(0);
  // the photo fits the screen width
  const box = await app.page.locator("canvas.photo").boundingBox();
  expect(box.width).toBeLessThanOrEqual(app.page.viewportSize().width);
});

test("every trait card fits the screen", async ({ app }) => {
  await app.analyze("portrait");
  for (const card of await app.page.locator(".results__traits article, .results__traits section").all()) {
    const box = await card.boundingBox();
    if (box) expect(box.x + box.width).toBeLessThanOrEqual(app.page.viewportSize().width + 1);
  }
});

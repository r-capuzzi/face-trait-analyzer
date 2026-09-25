// Real photos through the whole app: upload, both models, every trait, the
// overlay, the summary - checked against what a person sees in each photo.
import { test, expect, ALLOWED_HOSTS } from "./fixtures.js";
import { PHOTOS } from "./photos.js";

for (const [key, { file, expect: want }] of Object.entries(PHOTOS)) {
  test(`${file}: reads what a person sees`, async ({ app }) => {
    await app.analyze(key);
    await expect(app.page.locator("#results-heading")).toBeAttached();
    const s = await app.summary();

    for (const trait of ["eye", "hair"]) {
      if (!want[trait]) continue;
      expect(s[trait].measured, `${trait}: ${s[trait].reason}`).toBe(true);
      // every category offered must be an acceptable one...
      for (const c of s[trait].categories) expect(want[trait], `${trait} said ${c}`).toContain(c);
      // ...and a hedge must still include the right answer where it's known
      if (want.mustInclude?.[trait]) expect(s[trait].categories).toContain(want.mustInclude[trait]);
    }
    if (want.skin === "measured") {
      expect(s.skin.measured, s.skin.reason).toBe(true);
      expect(s.skin.numbers.ita).not.toBeNull();
      expect(s.skin.numbers.monk).toBeGreaterThanOrEqual(1);
    }
    if (want.warning) expect(s.checks.join("\n")).toMatch(want.warning);

    expect(app.log.pageErrors).toEqual([]);
    expect(app.log.consoleErrors).toEqual([]);
  });
}

test("the photo never leaves the device: only GETs, only to the model hosts", async ({ app }) => {
  await app.analyze("business");
  const requests = app.networkRequests();
  const origin = new URL(app.page.url()).host;
  for (const r of requests) {
    expect(r.method, r.url).toBe("GET");
    expect(r.body, r.url).toBeNull();
    expect([origin, ...ALLOWED_HOSTS], r.url).toContain(new URL(r.url).host);
  }
  // and the models really did come from those hosts
  expect(requests.some((r) => r.url.includes("storage.googleapis.com"))).toBe(true);
  expect(requests.some((r) => r.url.includes("cdn.jsdelivr.net"))).toBe(true);
});

test("draws the measurement overlay on the photo", async ({ app }) => {
  await app.analyze("business");
  const canvas = app.page.locator("canvas.photo");
  await expect(canvas).toBeVisible();
  // with the default layers on, some pixels must be overlay-tinted: compare
  // against the same canvas with every layer switched off
  const snapshot = () =>
    canvas.evaluate((c) => {
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 97) sum += d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7;
      return sum;
    });
  const withLayers = await snapshot();
  for (const box of await app.page.locator(".chips input[type=checkbox]").all()) {
    if (await box.isChecked()) await box.uncheck();
  }
  expect(await snapshot()).not.toBe(withLayers);
});

test("a second photo replaces the first, with no leftovers", async ({ app }) => {
  await app.analyze("business");
  const first = await app.summary();
  await app.startOver();
  await app.analyze("portrait");
  const second = await app.summary();
  expect(second.hair.categories).toContain("gray");
  expect(second.text).not.toBe(first.text);
  expect(app.log.pageErrors).toEqual([]);
});

test("every section and card renders for a full result", async ({ app }) => {
  await app.analyze("business");
  for (const title of ["Eye color", "Hair color", "Skin tone"]) {
    await expect(app.page.getByRole("heading", { name: title, exact: true }).first()).toBeVisible();
  }
  // skin tone says how much exposure alone could move it
  await expect(app.page.getByText(/half a stop darker or brighter would read ITA -?\d+° to -?\d+°/)).toBeVisible();
  // citations resolve to real links
  const links = app.page.locator('a[href^="https://doi.org/"]');
  expect(await links.count()).toBeGreaterThan(10);
});

// Everything a visitor can throw at the upload box that isn't a good face
// photo: each gets a clear message, and the app recovers for the next try.
import { test, expect } from "./fixtures.js";

const cases = [
  {
    name: "a file that isn't an image",
    file: { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") },
    message: /isn't an image/,
  },
  {
    name: "a corrupt JPEG",
    file: { name: "broken.jpg", mimeType: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]) },
    message: /Couldn't read that image/,
  },
  {
    // Chromium browsers can't decode HEIC; the message says how to export
    name: "an iPhone HEIC photo",
    file: { name: "IMG_0420.HEIC", mimeType: "image/heic", buffer: Buffer.from("....ftypheic") },
    message: /HEIC/,
  },
];

for (const c of cases) {
  test(`${c.name} gets a clear message`, async ({ app }) => {
    await app.analyze(c.file);
    expect(await app.errorText()).toMatch(c.message);
    expect(app.log.pageErrors).toEqual([]);
  });
}

test("a photo with no face says so, then a real photo still works", async ({ app }) => {
  const landscape = await app.variant(
    "business",
    `(c) => { const x = c.getContext("2d"); const g = x.createLinearGradient(0, 0, 0, c.height);
      g.addColorStop(0, "#7ab"); g.addColorStop(1, "#343"); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); return c; }`,
    { name: "landscape.png" }
  );
  await app.analyze(landscape);
  expect(await app.errorText()).toMatch(/No face found/);
  // the upload box is still there and works
  await app.analyze("business");
  await expect(app.page.locator("#results-heading")).toBeAttached();
  expect((await app.summary()).eye.measured).toBe(true);
});

test("a face too small to measure is reported per trait, not as a crash", async ({ app }) => {
  // the business photo at 1/5 size: a face, but eyes a few pixels wide
  const tiny = await app.variant(
    "business",
    `(c) => { const t = document.createElement("canvas"); t.width = Math.round(c.width / 5); t.height = Math.round(c.height / 5);
      t.getContext("2d").drawImage(c, 0, 0, t.width, t.height); return t; }`
  );
  await app.analyze(tiny);
  const outcome = app.page.locator("#results-heading").or(app.page.locator(".callout--error"));
  await expect(outcome).toBeAttached();
  if (await app.page.locator("#results-heading").count()) {
    const s = await app.summary();
    expect(s.eye.measured).toBe(false);
    expect(s.eye.reason).toMatch(/too small|closed|covered/);
    expect(s.checks.join("\n")).toMatch(/face is small/);
  }
  expect(app.log.pageErrors).toEqual([]);
});

test("if the models can't download, it says so and a retry works without reloading", async ({ app }) => {
  // a dropped connection to Google's model bucket
  await app.page.route("https://storage.googleapis.com/**", (route) => route.abort("internetdisconnected"));
  await app.analyze("business");
  expect(await app.errorText()).toMatch(/Check your connection/);
  // connection back: the same page, no reload
  await app.page.unroute("https://storage.googleapis.com/**");
  await app.analyze("business");
  await expect(app.page.locator("#results-heading")).toBeAttached();
  expect((await app.summary()).eye.measured).toBe(true);
});

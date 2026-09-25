// The page itself, as served: headers, assets, and a clean load.
import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.js";

const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url)));
const GLOBAL_HEADERS = vercel.headers.find((r) => r.source === "/(.*)").headers;

test("serves every production security header on the page", async ({ app }) => {
  const res = await app.page.request.get("/");
  expect(res.status()).toBe(200);
  const headers = res.headers();
  for (const { key, value } of GLOBAL_HEADERS) {
    expect(headers[key.toLowerCase()], key).toBe(value);
  }
});

test("loads without errors and without contacting any third party", async ({ app }) => {
  await expect(app.page).toHaveTitle(/Trait/);
  await expect(app.page.getByRole("heading", { level: 1 })).toBeVisible();
  // fonts are self-hosted and the models load only on intent (hover,
  // focus, a picked photo), so a plain visit touches no other host
  const hosts = new Set(app.networkRequests().map((r) => new URL(r.url).host));
  expect([...hosts]).toEqual([new URL(app.page.url()).host]);
  expect(app.log.pageErrors).toEqual([]);
  expect(app.log.consoleErrors).toEqual([]);
});

test("the social preview image and favicon exist", async ({ app }) => {
  const og = await app.page.locator('meta[property="og:image"]').getAttribute("content");
  const ogRes = await app.page.request.get(og);
  expect(ogRes.status()).toBe(200);
  expect(ogRes.headers()["content-type"]).toMatch(/image\/png/);
  const icon = await app.page.locator('link[rel="icon"]').getAttribute("href");
  expect((await app.page.request.get(icon)).status()).toBe(200);
});

test("the CSP really blocks requests to other hosts", async ({ app }) => {
  // the browser, not the app, enforces "your photo never leaves the device"
  const outcome = await app.page.evaluate(() =>
    fetch("https://example.com/upload", { method: "POST", body: "x" }).then(
      () => "sent",
      () => "blocked"
    )
  );
  expect(outcome).toBe("blocked");
});

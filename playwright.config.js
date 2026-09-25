import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: the real production build, the real MediaPipe models
// from their real CDNs, and real photos, in a real browser. By default they
// run against `npm run preview` (the built app with production's headers);
// playwright.prod.config.js points the same tests at the live site.
//
// The Chromium projects drive an installed browser (Edge on Windows, where
// it always exists; Chrome elsewhere, which GitHub's Ubuntu runners have;
// E2E_CHANNEL overrides it). The WebKit projects - Safari's engine, for
// iPhone and Mac visitors - need Playwright's WebKit build:
// `npx playwright install webkit`.
const channel = process.env.E2E_CHANNEL ?? (process.platform === "win32" ? "msedge" : "chrome");
export const PREVIEW_URL = "http://localhost:4173";

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.js",
  // the first analysis downloads ~32 MB of models
  timeout: 120_000,
  expect: { timeout: 30_000 },
  // one worker: every worker downloads and compiles the models once, and
  // the specs share that loaded page (see fixtures.js)
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: PREVIEW_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 }, channel }, testIgnore: /mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, testMatch: /mobile/ },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 900 } }, testIgnore: /mobile/ },
    { name: "iphone", use: { ...devices["iPhone 14"] }, testMatch: /mobile/ },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --strictPort",
    url: PREVIEW_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});

import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// MediaPipe's JS API and its WebAssembly runtime must be the exact same
// version, or the task graph fails to load with an opaque error. Read the
// installed version here so the WASM URL in src/lib/vision.js can never drift
// from package.json after an upgrade.
const mediapipeVersion = JSON.parse(
  readFileSync(
    new URL("./node_modules/@mediapipe/tasks-vision/package.json", import.meta.url)
  )
).version;

// Every header production sends on every path (vercel.json), so a local
// `npm run preview` - and the end-to-end tests that run against it - see
// exactly what visitors get: the CSP plus nosniff, referrer and permissions
// policies. (The CSP itself is written in csp.js; a unit test keeps
// vercel.json in sync with it.)
const productionHeaders = Object.fromEntries(
  JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url)))
    .headers.find((rule) => rule.source === "/(.*)")
    .headers.map(({ key, value }) => [key, value])
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __MEDIAPIPE_VERSION__: JSON.stringify(mediapipeVersion),
  },
  server: {
    port: 5173, // no CSP in dev: Vite's hot reload needs inline scripts and a websocket
  },
  preview: {
    port: 4173,
    headers: productionHeaders,
  },
  test: {
    globals: true, // `describe`/`test`/`expect`/`vi` without importing them
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"], // e2e/ is Playwright's (npm run test:e2e)
    setupFiles: "./src/setupTests.js",
    css: false, // don't process CSS imports during tests
  },
});

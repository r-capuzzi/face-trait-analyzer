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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __MEDIAPIPE_VERSION__: JSON.stringify(mediapipeVersion),
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true, // `describe`/`test`/`expect`/`vi` without importing them
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: false, // don't process CSS imports during tests
  },
});

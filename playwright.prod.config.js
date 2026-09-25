import base from "./playwright.config.js";

// The same end-to-end tests against the deployed site: `npm run test:e2e:prod`.
// Run it after a deploy to prove production (Vercel's headers, the CDN
// copies of the models, the real bundle) works, not just the local build.
export const PRODUCTION_URL = process.env.E2E_BASE_URL ?? "https://face-trait-analyzer.vercel.app";

export default {
  ...base,
  use: { ...base.use, baseURL: PRODUCTION_URL },
  projects: base.projects.map((p) => ({ ...p, use: { ...p.use, baseURL: PRODUCTION_URL } })),
  webServer: undefined,
};

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CSP } from "../csp.js";

// tests run from the project root (jsdom gives import.meta.url an http: scheme)
const vercel = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
const header = (key) =>
  vercel.headers.flatMap((h) => h.headers).find((h) => h.key === key)?.value;

test("production (vercel.json) serves exactly the policy `npm run preview` is tested with", () => {
  expect(header("Content-Security-Policy")).toBe(CSP);
});

test("the policy only allows network requests to the model and runtime hosts", () => {
  const connect = CSP.split("; ").find((d) => d.startsWith("connect-src"));
  expect(connect.split(" ").slice(1).sort()).toEqual(
    ["'self'", "https://cdn.jsdelivr.net", "https://storage.googleapis.com"].sort()
  );
  // no blanket escape hatches
  expect(CSP).not.toMatch(/'unsafe-eval'|'unsafe-inline'|\*/);
});

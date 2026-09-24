// Content Security Policy: makes "your photo never leaves your device" a
// rule the BROWSER enforces, not just a promise in the UI. The page may only
// fetch from itself, jsDelivr (MediaPipe's WebAssembly runtime) and Google's
// model bucket; any other request - an analytics beacon, an upload - is
// blocked before it leaves the tab.
//
// Used by vite.config.js (`npm run preview`) and mirrored verbatim in
// vercel.json (production); a test keeps the two in sync.

export const CSP = [
  "default-src 'self'",
  // MediaPipe inserts a <script> for its WASM loader from jsDelivr, and
  // compiling WebAssembly needs 'wasm-unsafe-eval' (not full 'unsafe-eval')
  "script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com",
  "img-src 'self' data: blob:",
  "style-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImageFile } from "../lib/imageLoad";
import { getVision } from "../lib/vision";
import { analyze } from "../lib/analyze";
import { applyGains, gainsFromReference } from "../lib/whiteBalance";

// status: idle -> loading-image -> loading-models -> analyzing -> done | error
const IDLE = { status: "idle" };

// Let React paint the new status before a synchronous, CPU-heavy step
// (MediaPipe's detect() blocks the main thread for a few hundred ms).
// requestAnimationFrame never fires in a background tab, so a short timeout
// races it - otherwise switching tabs mid-analysis would stall forever.
const nextPaint = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
    setTimeout(resolve, 50);
  });

export function useAnalysis() {
  const [state, setState] = useState(IDLE);
  // the latest committed state, for event handlers (see correctColors)
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  // Each run gets an id; results from a superseded run (user picked another
  // photo mid-analysis) are dropped instead of overwriting the newer one.
  const runId = useRef(0);

  const analyzeFile = useCallback(async (file) => {
    const id = ++runId.current;
    const stale = () => id !== runId.current;
    try {
      setState({ status: "loading-image" });
      const image = await loadImageFile(file);
      if (stale()) return;

      setState({ status: "loading-models", image });
      const vision = await getVision();
      if (stale()) return;

      setState({ status: "analyzing", image });
      await nextPaint();
      const detection = vision.detect(image.canvas);
      const result = analyze(image, detection);
      if (stale()) return;

      // detection is kept so a color correction can re-measure without
      // running the models again (landmarks don't depend on color)
      setState({ status: "done", image, result, detection, original: { image, result } });
    } catch (err) {
      if (stale()) return;
      if (!err.code) console.error(err); // expected errors (no face, HEIC) aren't bugs
      setState({
        status: "error",
        error: err.code
          ? err.message // our own errors already carry user-facing text
          : "Something went wrong while analyzing the photo. Check your connection (the face models download on first use) and try again.",
      });
    }
  }, []);

  // Re-measure with the lighting's color cast removed, using the spot at
  // (x, y) - image pixels - as the neutral reference. Always computed from
  // the original photo, so a second pick replaces the first instead of
  // stacking on top of it. Reads the latest state from a ref rather than
  // inside a setState updater: updaters must stay cheap and pure (React may
  // call them twice), and re-analyzing is neither. Returns whether the spot
  // was usable.
  const correctColors = useCallback((x, y) => {
    const s = latest.current;
    if (s.status !== "done") return false;
    const { image } = s.original;
    const wb = gainsFromReference(image.imageData, x, y);
    if (!wb.ok) {
      setState({ ...s, correctionError: wb.reason });
      return false;
    }
    const corrected = { ...image, imageData: applyGains(image.imageData, wb.gains) };
    setState({
      ...s,
      image: corrected,
      result: analyze(corrected, s.detection),
      correction: wb.reference,
      correctionError: null,
    });
    return true;
  }, []);

  const clearCorrectionError = useCallback(() => {
    setState((s) => (s.correctionError ? { ...s, correctionError: null } : s));
  }, []);

  const undoCorrection = useCallback(() => {
    setState((s) =>
      s.status === "done" ? { ...s, ...s.original, correction: null, correctionError: null } : s
    );
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    setState(IDLE);
  }, []);

  return { state, analyzeFile, reset, correctColors, undoCorrection, clearCorrectionError };
}

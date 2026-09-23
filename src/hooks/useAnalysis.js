import { useCallback, useRef, useState } from "react";
import { loadImageFile } from "../lib/imageLoad";
import { getVision } from "../lib/vision";
import { analyze } from "../lib/analyze";

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

      setState({ status: "done", image, result });
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

  const reset = useCallback(() => {
    runId.current++;
    setState(IDLE);
  }, []);

  return { state, analyzeFile, reset };
}

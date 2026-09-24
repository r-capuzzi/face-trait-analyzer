import { useState } from "react";
import Icon from "./Icon";

// Copies a plain-text summary of the results (labels and numbers, never
// the image) so a visitor can paste it somewhere, e.g. to report a result
// that looks wrong. If the browser blocks the clipboard, the text is shown
// for copying by hand instead.
export default function CopySummary({ getText }) {
  const [status, setStatus] = useState(null); // null | "copied" | "manual"
  const [text, setText] = useState("");

  async function copy() {
    const summary = getText();
    setText(summary);
    try {
      await navigator.clipboard.writeText(summary);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="copy-summary">
      <button type="button" className="button button--ghost button--small" onClick={copy}>
        <Icon name="copy" size={16} /> Copy results summary
      </button>
      <p className="copy-summary__status" role="status">
        {status === "copied" && "Copied. It holds labels and numbers only, never your photo."}
      </p>
      {status === "manual" && (
        <label className="copy-summary__manual">
          Your browser blocked copying. Select this text and copy it:
          <textarea readOnly value={text} rows={8} onFocus={(e) => e.target.select()} />
        </label>
      )}
    </div>
  );
}

import Icon from "./Icon";
import { MODEL_DOWNLOAD_MB } from "../lib/vision";

const STEPS = [
  { status: "loading-image", label: "Reading your photo" },
  { status: "loading-models", label: `Loading face models (~${MODEL_DOWNLOAD_MB} MB, first time only)` },
  { status: "analyzing", label: "Finding your face and measuring" },
];

// A three-step progress list: done steps get a check, the current one a
// spinner. role="status" announces the current step to screen readers.
export default function ProcessingStatus({ status }) {
  const current = STEPS.findIndex((s) => s.status === status);
  if (current === -1) return null;
  return (
    <div className="progress" role="status">
      <ol>
        {STEPS.map((s, i) => {
          const state = i < current ? "done" : i === current ? "active" : "todo";
          return (
            <li key={s.status} className={`progress__step is-${state}`} aria-current={state === "active" ? "step" : undefined}>
              <span className="progress__dot">
                {state === "done" ? <Icon name="check" size={14} /> : state === "active" ? <span className="spinner" /> : null}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import { MODEL_DOWNLOAD_MB } from "../lib/vision";

const MESSAGES = {
  "loading-image": "Reading your photo...",
  "loading-models": `Loading the face models (about ${MODEL_DOWNLOAD_MB} MB, first time only)...`,
  analyzing: "Finding your face and measuring...",
};

export default function ProcessingStatus({ status }) {
  const message = MESSAGES[status];
  if (!message) return null;
  return (
    <p className="status" role="status">
      <span className="status__spinner" aria-hidden="true" />
      {message}
    </p>
  );
}

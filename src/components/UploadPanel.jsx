import { useState } from "react";
import Icon from "./Icon";
import { preloadVision } from "../lib/vision";

const TIPS = [
  { icon: "face", text: "Face the camera, eyes open, relaxed expression" },
  { icon: "sun", text: "Soft daylight from in front, no flash" },
  { icon: "filter", text: "No filters, beauty mode or heavy makeup" },
  { icon: "ruler", text: "About 1.5 m away is best for face shape" },
];

export default function UploadPanel({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false);

  function pick(files) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <section className="upload-card" aria-label="Add a photo">
      <label
        className={`dropzone ${dragging ? "is-dragging" : ""} ${disabled ? "is-disabled" : ""}`}
        onPointerEnter={preloadVision}
        onFocus={preloadVision}
        onDragEnter={preloadVision}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept="image/*,.heic,.heif"
          disabled={disabled}
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
        />
        <span className="dropzone__icon">
          <Icon name="image" size={30} />
        </span>
        <span className="dropzone__title">Choose a photo or drop it here</span>
        <span className="dropzone__button">Browse photos</span>
        <span className="dropzone__privacy">
          <Icon name="shield" size={16} /> Analyzed on this device. Never uploaded.
        </span>
      </label>

      <ul className="tips" aria-label="Tips for an accurate result">
        {TIPS.map((t) => (
          <li key={t.text}>
            <Icon name={t.icon} size={18} />
            {t.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useState } from "react";

export default function UploadPanel({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false);

  function pick(files) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      className={`upload ${dragging ? "upload--drag" : ""} ${disabled ? "upload--disabled" : ""}`}
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
      <span className="upload__title">Choose a photo or drop it here</span>
      <span className="upload__hint">
        Front-facing, eyes open, in daylight, with no filters. Your photo stays on this device.
      </span>
    </label>
  );
}

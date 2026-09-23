import { useId } from "react";

// Lets the user overrule the measurement (dyed hair, colored contacts, odd
// lighting). The explanation below then follows their answer, so the
// education still works when the camera gets it wrong.
export default function CorrectionControl({ categories, measured, value, onChange }) {
  const id = useId();
  return (
    <div className="correct">
      <label htmlFor={id}>{measured ? "Not right? Correct it:" : "Pick yours to read about it:"}</label>
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{measured ? "Use the measurement" : "Choose..."}</option>
        {Object.entries(categories).map(([key, c]) => (
          <option key={key} value={key}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

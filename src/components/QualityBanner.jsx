import Icon from "./Icon";

// Photo-quality findings, shown once above the color cards. Each one also
// lowers the confidence of the traits it affects.
export default function QualityBanner({ issues, warnings }) {
  const all = [...warnings, ...issues.map((i) => i.message)];
  if (all.length === 0) {
    return (
      <p className="callout callout--ok">
        <Icon name="check" size={18} /> Photo check: no problems found.
      </p>
    );
  }
  return (
    <div className="callout callout--warn" role="status">
      <Icon name="alert" size={18} />
      <div>
        <strong>Photo check</strong>
        <ul>
          {all.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="callout__note">These lower the confidence of the affected results.</p>
      </div>
    </div>
  );
}

// Photo-quality findings, shown once above the trait cards. Each one also
// lowers the confidence of the traits it affects.
export default function QualityBanner({ issues, warnings }) {
  const all = [...warnings, ...issues.map((i) => i.message)];
  if (all.length === 0) {
    return <p className="quality quality--ok">Photo check: no problems found.</p>;
  }
  return (
    <div className="quality" role="status">
      <strong>Photo check</strong>
      <ul>
        {all.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="quality__note">These lower the confidence of the affected results below.</p>
    </div>
  );
}

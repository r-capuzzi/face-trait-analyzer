// The eye's PIE score (Andersen 2013) on a -1..+1 bar: how much of the
// iris is pigmented vs. unpigmented.
export default function PigmentBar({ pie, eyes, heterochromiaNote }) {
  const pct = (v) => `${((1 - v) / 2) * 100}%`; // +1 (blue) on the left
  return (
    <div className="pigment">
      <div className="pigment__bar" role="img" aria-label={`Pigment index ${pie.toFixed(2)} on a scale from +1 (no pigment, blue) to -1 (fully pigmented, brown)`}>
        <span className="pigment__marker" style={{ left: pct(pie) }} />
        {eyes.right && eyes.left && (
          <>
            <span className="pigment__eye" style={{ left: pct(eyes.right.pie) }} title="Right eye" />
            <span className="pigment__eye" style={{ left: pct(eyes.left.pie) }} title="Left eye" />
          </>
        )}
      </div>
      <div className="pigment__labels">
        <span>Less pigment (blue)</span>
        <span>More pigment (brown)</span>
      </div>
      <p className="pigment__caption">
        Pixel index {pie.toFixed(2)}: {Math.round(((1 + pie) / 2) * 100)}% of the sampled iris
        pixels read as unpigmented.
      </p>
      {heterochromiaNote && <p className="warning">{heterochromiaNote}</p>}
    </div>
  );
}

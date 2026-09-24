import { useMemo } from "react";
import { labToHex } from "../lib/color";
import Cite, { citationOrder } from "./Cite";
import CorrectionControl from "./CorrectionControl";
import GeneticsDetails from "./GeneticsDetails";

const CONFIDENCE_TEXT = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

// One trait: what was measured, what the genetics says about that result,
// and the sources. `measurement` is the trait module's output; `details` is
// trait-specific visualization (e.g. the eye's pigment bar).
export default function TraitCard({ content, measurement, override, onOverride, details }) {
  const order = useMemo(() => citationOrder(content), [content]);
  const ok = measurement?.status === "ok";
  const measured = ok ? measurement.category : null;
  const shown = override ?? measured;
  const category = shown ? content.categories[shown] : null;
  const confidence = ok ? measurement.confidence : null;
  const labelOf = (key) => content.categories[key]?.label ?? key;
  const cite = (keys) => <Cite keys={keys} traitId={content.id} order={order} />;

  return (
    <article className="trait" aria-labelledby={`trait-${content.id}`}>
      <header className="trait__header">
        <h2 id={`trait-${content.id}`}>{content.title}</h2>
        {ok && (
          <div className="trait__result">
            <span
              className="swatch"
              style={{ background: labToHex(measurement.lab) }}
              title="Median measured color"
              aria-hidden="true"
            />
            <span>
              {confidence?.between && measurement.runnerUp ? (
                <>
                  Measured: between <strong>{labelOf(measured)}</strong> and{" "}
                  <strong>{labelOf(measurement.runnerUp)}</strong>
                </>
              ) : (
                <>
                  Measured: <strong>{labelOf(measured)}</strong>
                </>
              )}
            </span>
            {confidence && (
              <span className={`badge badge--${confidence.level}`}>{CONFIDENCE_TEXT[confidence.level]}</span>
            )}
          </div>
        )}
      </header>

      {!ok && <p className="trait__unmeasured">{measurement?.reason ?? "Not measured."}</p>}
      {ok && details}

      <CorrectionControl
        categories={content.categories}
        measured={Boolean(measured)}
        value={override}
        onChange={onOverride}
      />

      {category && (
        <section className="trait__meaning">
          <h3>
            {override && override !== measured ? `If your ${content.title.toLowerCase()} is ` : ""}
            {category.label}
          </h3>
          <p>{category.summary}</p>
          <h4>What this suggests about your genes</h4>
          <p>
            {category.hint.text}
            {cite(category.hint.cite)}
          </p>
        </section>
      )}

      <GeneticsDetails content={content} order={order} cite={cite} />
    </article>
  );
}

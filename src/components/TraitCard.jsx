import { useMemo } from "react";
import { labToHex } from "../lib/color";
import Cite, { citationOrder } from "./Cite";
import CardHeader, { ConfidenceMeter, accentOf } from "./CardHeader";
import CorrectionControl from "./CorrectionControl";
import GeneticsDetails from "./GeneticsDetails";

// One color trait: what was measured, what the genetics says about that
// result, and the sources. `measurement` is the trait module's output;
// `details` is a trait-specific visualization (e.g. the eye's pigment bar).
export default function TraitCard({ content, measurement, override, onOverride, details }) {
  const order = useMemo(() => citationOrder(content), [content]);
  const ok = measurement?.status === "ok";
  const measured = ok ? measurement.category : null;
  const shown = override ?? measured;
  const category = shown ? content.categories[shown] : null;
  const confidence = ok ? measurement.confidence : null;
  const labelOf = (key) => content.categories[key]?.label ?? key;
  const cite = (keys) => <Cite keys={keys} traitId={content.id} order={order} />;
  const headingId = `trait-${content.id}`;

  return (
    <article className="card" data-accent={accentOf(content.id)} aria-labelledby={headingId}>
      <CardHeader id={content.id} title={content.title} headingId={headingId}>
        {confidence && <ConfidenceMeter level={confidence.level} />}
      </CardHeader>

      {ok ? (
        <div className="result">
          <span
            className="result__swatch"
            style={{ background: labToHex(measurement.lab) }}
            title="Median measured color"
            aria-hidden="true"
          />
          <div>
            <span className="result__label">Measured</span>
            <p className="result__value">
              {confidence?.between && measurement.runnerUp ? (
                <>
                  Between {labelOf(measured)} <span className="result__and">and</span>{" "}
                  {labelOf(measurement.runnerUp)}
                </>
              ) : (
                labelOf(measured)
              )}
            </p>
          </div>
        </div>
      ) : (
        <p className="card__unmeasured">{measurement?.reason ?? "Not measured."}</p>
      )}

      {ok && details}

      <CorrectionControl
        categories={content.categories}
        measured={Boolean(measured)}
        value={override}
        onChange={onOverride}
      />

      {category && (
        <section className="meaning">
          <h3>
            {/* "If your ... is" only when overruling an actual measurement */}
            {measured && override && override !== measured ? `If your ${content.title.toLowerCase()} is ` : ""}
            {category.label}
          </h3>
          <p className="meaning__summary">{category.summary}</p>
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

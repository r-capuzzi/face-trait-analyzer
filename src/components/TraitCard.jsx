import { useMemo } from "react";
import { labToHex } from "../lib/color";
import Cite, { citationOrder } from "./Cite";
import CorrectionControl from "./CorrectionControl";

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

      <details className="trait__more">
        <summary>How it works: the genetics</summary>
        {content.mechanism.map((m) => (
          <p key={m.text}>
            {m.text}
            {cite(m.cite)}
          </p>
        ))}

        <h4>Key genes</h4>
        <ul className="genes">
          {content.genes.map((g) => (
            <li key={g.symbol}>
              <strong>{g.symbol}</strong> {g.variant && <code>{g.variant}</code>}
              <p>{g.role}</p>
              <p>
                {g.effect}
                {cite(g.cite)}
              </p>
              {g.note && <p className="genes__note">{g.note}</p>}
            </li>
          ))}
        </ul>

        <h4>Myth vs. reality</h4>
        {content.myths.map((m) => (
          <div key={m.myth} className="myth">
            <p>
              <strong>Myth:</strong> {m.myth}
            </p>
            <p>
              <strong>Reality:</strong> {m.reality}
              {cite(m.cite)}
            </p>
          </div>
        ))}

        <h4>Limits of this measurement</h4>
        <ul>
          {content.limitations.map((l) => {
            const { text, cite: keys } = typeof l === "string" ? { text: l } : l;
            return (
              <li key={text}>
                {text}
                {cite(keys)}
              </li>
            );
          })}
        </ul>

        <h4>Sources</h4>
        <ol className="sources">
          {[...order.keys()].map((k) => (
            <li key={k} id={`src-${content.id}-${k}`}>
              {content.sources[k].citation}{" "}
              <a href={`https://doi.org/${content.sources[k].doi}`} target="_blank" rel="noreferrer">
                doi:{content.sources[k].doi}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

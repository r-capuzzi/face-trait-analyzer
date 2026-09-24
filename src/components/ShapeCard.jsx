import { useMemo } from "react";
import Cite, { citationOrder } from "./Cite";
import CardHeader, { accentOf } from "./CardHeader";
import EvolutionDetails from "./EvolutionDetails";
import GeneticsDetails from "./GeneticsDetails";
import Icon from "./Icon";

// Where a value sits on a gauge's [min, max] track, as a CSS percentage.
const at = (v, { min, max }) => `${(Math.min(max, Math.max(min, v)) - min) / (max - min) * 100}%`;

// For measures with a classical-art canon: a track showing the canon tick
// and where this face falls. The canon is a myth being tested, not a target,
// so the canon tick is neutral and the person's marker isn't colored good/bad.
function CanonGauge({ value, canon }) {
  return (
    <div className="gauge" aria-hidden="true">
      <div className="gauge__track">
        <span className="gauge__canon" style={{ left: at(canon.value, canon.gauge) }}>
          <span className="gauge__canon-label">canon</span>
        </span>
        <span className="gauge__you" style={{ left: at(value, canon.gauge) }} />
      </div>
    </div>
  );
}

// One face-shape feature: its measurements (always relative to the person's
// own face), photo notes that distort them, and the genetics.
export default function ShapeCard({ content, part }) {
  const order = useMemo(() => citationOrder(content), [content]);
  const cite = (keys) => <Cite keys={keys} traitId={content.id} order={order} />;
  // shape parts have no status; eyebrows do (hidden by bangs, etc.)
  const unmeasured = part.status !== undefined && part.status !== "ok";
  const headingId = `shape-${content.id}`;

  return (
    <article className="card" data-accent={accentOf(content.id)} aria-labelledby={headingId}>
      <CardHeader id={content.id} title={content.title} headingId={headingId} />

      {unmeasured && <p className="card__unmeasured">{part.reason}</p>}

      {part.notes?.length > 0 && (
        <div className="callout callout--warn">
          <Icon name="alert" size={18} />
          <ul>
            {part.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {!unmeasured && (
        <dl className="measures">
          {content.measures.map((m) => {
            const v = part[m.key];
            const missing = v === null || v === undefined;
            return (
              <div key={m.key} className="measure">
                <dt>{m.label}</dt>
                <dd>
                  <strong className="measure__value">{missing ? "–" : m.format(v)}</strong>
                  <span className="measure__text">
                    {missing ? "Couldn't be measured in this photo." : m.describe(v)}
                  </span>
                  {m.canon && !missing && <CanonGauge value={v} canon={m.canon} />}
                  {m.canon && (
                    <span className="measure__canon">
                      {m.canon.text}
                      {cite(m.canon.cite)}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <section className="meaning">
        <h4>What this suggests about your genes</h4>
        <p>
          {content.hint.text}
          {cite(content.hint.cite)}
        </p>
      </section>

      <EvolutionDetails content={content} cite={cite} />
      <GeneticsDetails content={content} order={order} cite={cite} />
    </article>
  );
}

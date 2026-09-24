import { useMemo } from "react";
import Cite, { citationOrder } from "./Cite";
import GeneticsDetails from "./GeneticsDetails";

// One face-shape feature: its measured proportions (always relative to the
// person's own face), photo notes that distort them, and the genetics.
export default function ShapeCard({ content, part }) {
  const order = useMemo(() => citationOrder(content), [content]);
  const cite = (keys) => <Cite keys={keys} traitId={content.id} order={order} />;

  return (
    <article className="trait" aria-labelledby={`shape-${content.id}`}>
      <header className="trait__header">
        <h2 id={`shape-${content.id}`}>{content.title}</h2>
      </header>

      {part.notes.length > 0 && (
        <ul className="warning shape__notes">
          {part.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <dl className="measures">
        {content.measures.map((m) => {
          const v = part[m.key];
          return (
            <div key={m.key} className="measure">
              <dt>{m.label}</dt>
              <dd>
                <strong className="measure__value">{v === null || v === undefined ? "–" : m.format(v)}</strong>
                <span>{v === null || v === undefined ? "Couldn't be measured in this photo." : m.describe(v)}</span>
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

      <section className="trait__meaning">
        <h4>What this suggests about your genes</h4>
        <p>
          {content.hint.text}
          {cite(content.hint.cite)}
        </p>
      </section>

      <GeneticsDetails content={content} order={order} cite={cite} />
    </article>
  );
}

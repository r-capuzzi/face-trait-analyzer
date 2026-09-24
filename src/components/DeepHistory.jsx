import { useMemo } from "react";
import Cite, { citationOrder } from "./Cite";
import Icon from "./Icon";
import SourceList from "./SourceList";
import { EVIDENCE } from "../data/evolution";

// Section 04: the cards' "Why it evolved" points laid out in time, oldest
// first, each linking back to the cards it explains.
export default function DeepHistory({ content }) {
  const order = useMemo(() => citationOrder(content), [content]);
  const cite = (keys) => <Cite keys={keys} traitId={content.id} order={order} />;

  return (
    <article className="card timeline-card" data-accent="shape" aria-label="Timeline of how human faces evolved">
      <ol className="timeline">
        {content.events.map((e) => (
          <li key={e.title} className="timeline__event">
            <span className="timeline__when">{e.when}</span>
            <div className="timeline__body">
              <h3>{e.title}</h3>
              <span className={`evidence evidence--${e.evidence}`}>{EVIDENCE[e.evidence]}</span>
              <p>
                {e.text}
                {cite(e.cite)}
              </p>
              <p className="timeline__cards">
                See{" "}
                {e.cards.map(([id, label], i) => (
                  <span key={id}>
                    {i > 0 && " · "}
                    <a href={`#${id}`}>{label}</a>
                  </span>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <details className="more">
        <summary>
          <Icon name="book" size={18} />
          Sources
          <Icon name="chevron" size={18} className="more__chevron" />
        </summary>
        <SourceList content={content} order={order} />
      </details>
    </article>
  );
}

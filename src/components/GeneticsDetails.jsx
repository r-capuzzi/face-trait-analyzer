import Icon from "./Icon";

// The collapsible "How it works" section shared by color and shape cards:
// mechanism, key genes (if any), myths, limitations and numbered sources.
export default function GeneticsDetails({ content, order, cite }) {
  return (
    <details className="more">
      <summary>
        <Icon name="book" size={18} />
        How it works: the genetics
        <Icon name="chevron" size={18} className="more__chevron" />
      </summary>
      {content.mechanism.map((m) => (
        <p key={m.text}>
          {m.text}
          {cite(m.cite)}
        </p>
      ))}

      {content.genes && (
        <>
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
        </>
      )}

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
        {[...order.keys()].map((k) => {
          const src = content.sources[k];
          // a few journals don't issue DOIs (and database entries have none);
          // those sources carry a URL instead. encodeURI: some old DOIs contain <>.
          const href = src.doi ? `https://doi.org/${encodeURI(src.doi)}` : src.url;
          return (
            <li key={k} id={`src-${content.id}-${k}`}>
              {src.citation}{" "}
              <a href={href} target="_blank" rel="noreferrer">
                {src.doi ? `doi:${src.doi}` : (src.linkLabel ?? "full text")}
              </a>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

// The numbered source list a card's (or the timeline's) citation markers
// link to. `order` maps each cited key to its number, so the list shows
// exactly what was cited, in first-cited order.
export default function SourceList({ content, order }) {
  return (
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
  );
}

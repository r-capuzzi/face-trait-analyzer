// Numbered citation markers like [1, 3] linking to the card's source list.
// `order` maps a source key to its 1-based number within that card.
export default function Cite({ keys, traitId, order }) {
  if (!keys?.length) return null;
  // show numbers ascending ([1, 2, 3], not [3, 1, 2]) whatever order they were cited in
  const sorted = [...keys].sort((a, b) => order.get(a) - order.get(b));
  return (
    <sup className="cite">
      [
      {sorted.map((k, i) => (
        <span key={k}>
          {i > 0 && ", "}
          <a href={`#src-${traitId}-${k}`}>{order.get(k)}</a>
        </span>
      ))}
      ]
    </sup>
  );
}

// Source keys in first-use order across a content object, so numbering
// follows reading order.
export function citationOrder(content) {
  const seen = new Map();
  const visit = (node) => {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === "object") {
      if (Array.isArray(node.cite)) {
        for (const k of node.cite) if (!seen.has(k)) seen.set(k, seen.size + 1);
      }
      Object.entries(node).forEach(([key, v]) => key !== "sources" && visit(v));
    }
  };
  visit(content);
  return seen;
}

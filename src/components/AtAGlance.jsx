import { glanceValue } from "../lib/summary";

// A compact summary above the long results: the three color results (each
// linking to its card) and jump links to the numbered sections.
const SHORT = { eye: "Eyes", hair: "Hair", skin: "Skin" };

export default function AtAGlance({ traits, sections }) {
  return (
    <nav className="glance" aria-label="Results at a glance">
      <ul className="glance__results">
        {traits.map(({ content, measurement, override }) => (
          <li key={content.id}>
            <a href={`#trait-${content.id}`}>
              <span className="glance__label">{SHORT[content.id] ?? content.title}</span>
              <span className="glance__value">{glanceValue(content, measurement, override)}</span>
            </a>
          </li>
        ))}
      </ul>
      <ul className="glance__sections">
        {sections.map(([number, title]) => (
          <li key={number}>
            <a href={`#section-${number}`}>
              <span aria-hidden="true">{number}</span> {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

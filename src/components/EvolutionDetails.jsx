import Icon from "./Icon";
import { EVIDENCE } from "../data/evolution";

// "Why it evolved": how the trait came to vary in our species, each point
// labeled with how strong the evidence behind it is. The label is text, not
// just a color, so it reads the same to everyone.
export default function EvolutionDetails({ content, cite }) {
  if (!content.history?.length) return null;
  return (
    <details className="more">
      <summary>
        <Icon name="tree" size={18} />
        Why it evolved
        <Icon name="chevron" size={18} className="more__chevron" />
      </summary>
      <p className="history__frame">
        How this trait came to vary among humans. It's the history of our species, not a reading of your own
        ancestry, and evolutionary explanations range from measured to guesswork, so each point says how strong
        the evidence is.
      </p>
      <ul className="history">
        {content.history.map((h) => (
          <li key={h.text}>
            <span className={`evidence evidence--${h.evidence}`}>{EVIDENCE[h.evidence]}</span>
            <p>
              {h.text}
              {cite(h.cite)}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

import Icon from "./Icon";

// Icon + accent color per card, keyed by the content id.
const STYLE = {
  eye: { icon: "eye", accent: "eye", kicker: "Pigment" },
  hair: { icon: "hair", accent: "hair", kicker: "Pigment" },
  skin: { icon: "skin", accent: "skin", kicker: "Pigment" },
  face: { icon: "face", accent: "shape", kicker: "Shape" },
  eyes: { icon: "eye", accent: "shape", kicker: "Shape" },
  brows: { icon: "brow", accent: "brow", kicker: "Hair" },
  hairline: { icon: "hair", accent: "hair", kicker: "Hair" },
  beard: { icon: "beard", accent: "brow", kicker: "Hair" },
  nose: { icon: "nose", accent: "shape", kicker: "Shape" },
  lips: { icon: "lips", accent: "shape", kicker: "Shape" },
  texture: { icon: "hair", accent: "hair", kicker: "You tell us" },
  freckles: { icon: "freckles", accent: "skin", kicker: "You tell us" },
};

export const accentOf = (id) => STYLE[id]?.accent ?? "shape";

export default function CardHeader({ id, title, headingId, children }) {
  const s = STYLE[id] ?? { icon: "face", kicker: "" };
  return (
    <header className="card__header">
      <span className="card__badge">
        <Icon name={s.icon} size={22} />
      </span>
      <div className="card__titles">
        <span className="card__kicker">{s.kicker}</span>
        <h2 id={headingId}>{title}</h2>
      </div>
      {children && <div className="card__aside">{children}</div>}
    </header>
  );
}

const LEVEL_TEXT = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
const LEVEL_BARS = { low: 1, medium: 2, high: 3 };

// Three bars, filled up to the level - readable at a glance, with the words
// alongside so it never relies on the visual alone.
export function ConfidenceMeter({ level }) {
  return (
    <span className={`meter meter--${level}`}>
      <span className="meter__bars" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= LEVEL_BARS[level] ? "is-on" : ""} />
        ))}
      </span>
      <span className="meter__text">{LEVEL_TEXT[level]}</span>
    </span>
  );
}

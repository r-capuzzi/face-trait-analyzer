import { MONK_ATTRIBUTION, MONK_SCALE } from "../data/monk";
import { EXPOSURE_STOPS, ITA_BANDS, itaExposureRange } from "../lib/traits/skinTone";

// ITA° runs roughly from -50 (darkest) to +70 (lightest) in real skin.
const ITA_MIN = -50;
const ITA_MAX = 70;
const pos = (v) => `${((Math.min(ITA_MAX, Math.max(ITA_MIN, v)) - ITA_MIN) / (ITA_MAX - ITA_MIN)) * 100}%`;

export default function SkinDetails({ skin }) {
  const range = itaExposureRange(skin.lab);
  return (
    <div className="details">
      <div className="ita" role="img" aria-label={`Individual Typology Angle ${skin.ita.toFixed(0)} degrees`}>
        <div className="ita__bar">
          {ITA_BANDS.slice(0, -1).map((b) => (
            <span key={b.key} className="ita__tick" style={{ left: pos(b.max) }} />
          ))}
          <span className="ita__marker" style={{ left: pos(skin.ita) }} />
        </div>
        <div className="pigment__labels">
          <span>Darker (lower ITA°)</span>
          <span>Lighter (higher ITA°)</span>
        </div>
      </div>
      <p className="details__caption">
        ITA {skin.ita.toFixed(0)}°, from the median of {skin.patches.length} skin patches (
        {skin.patches.map((p) => p.name).join(", ")}). The same skin in a photo {EXPOSURE_STOPS === 0.5 ? "half a stop" : `${EXPOSURE_STOPS} stops`} darker
        or brighter would read ITA {range.darker.toFixed(0)}° to {range.brighter.toFixed(0)}°: exposure moves ITA, and
        a photo alone can't pin exposure down.
      </p>

      <div className="monk" aria-label={`Closest Monk Skin Tone: ${skin.monk.tone} of 10`}>
        {MONK_SCALE.map((m) => (
          <span
            key={m.tone}
            className={`monk__swatch ${m.tone === skin.monk.tone ? "monk__swatch--match" : ""}`}
            style={{ background: m.hex }}
            title={`Monk ${m.tone}`}
          />
        ))}
      </div>
      <p className="details__caption">
        Closest Monk Skin Tone: <strong>{skin.monk.tone}</strong> of 10. {MONK_ATTRIBUTION}
      </p>
    </div>
  );
}

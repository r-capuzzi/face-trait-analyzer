import { HAIR_RULE } from "../lib/traits/hairColor";

export default function HairDetails({ hair }) {
  const grayPct = Math.round(hair.grayFraction * 100);
  return (
    <div className="details">
      <p className="details__caption">
        Median of {hair.pixels.length.toLocaleString()} sampled hair pixels (shine and shadow trimmed).
      </p>
      {hair.category !== "gray" && hair.grayFraction >= HAIR_RULE.someGrayFraction && (
        <p className="details__caption">About {grayPct}% of the sampled hair reads gray or white.</p>
      )}
    </div>
  );
}

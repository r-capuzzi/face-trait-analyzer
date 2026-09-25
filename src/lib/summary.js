// A plain-text summary of one analysis for the visitor to copy, for example
// to report a result that looks wrong ("it said hazel, my eyes are blue").
// Labels and rounded numbers only: nothing in it can reconstruct the photo.
import { COLOR_CARDS, SELF_REPORTED, SHAPE_CARDS } from "../data/cards";

// What a color card currently says, in a few words: the visitor's own pick
// wins, a low-confidence result keeps its "or", and unmeasured says so.
export function glanceValue(content, measurement, override) {
  const label = (k) => content.categories[k]?.label ?? k;
  if (override) return `${label(override)} (your pick)`;
  if (measurement?.status !== "ok") return "Not measured";
  const { category, runnerUp, confidence } = measurement;
  return confidence?.between && runnerUp ? `${label(category)} or ${label(runnerUp)}` : label(category);
}

const r = (v, digits = 0) => (Number.isFinite(v) ? v.toFixed(digits) : "?");

// The few numbers behind each color result that matter for checking it.
const COLOR_DETAIL = {
  eye: (t) => `pixel index ${r(t.pie, 2)}, green share ${r((t.greenShare ?? 0) * 100)}%`,
  hair: (t) => `lightness L* ${r(t.lab?.L)}, chroma ${r(t.chroma, 1)}`,
  skin: (t) => `ITA ${r(t.ita)}°, closest Monk swatch ${t.monk?.tone ?? "?"}`,
};

export function summarizeResult(result, { overrides = {}, correction = null, date = new Date() } = {}) {
  const { traits, quality, warnings } = result;
  const lines = [`Trait Genetics Explainer results (${date.toISOString().slice(0, 10)})`];
  if (correction) lines.push("Colors corrected for the lighting using a picked white or gray spot.");

  lines.push("", "COLOR");
  for (const { key, content } of COLOR_CARDS) {
    const t = traits[key];
    let line = `${content.title}: ${glanceValue(content, t, null)}`;
    if (t.status === "ok") line += ` (${t.confidence?.level ?? "?"} confidence; ${COLOR_DETAIL[key](t)})`;
    else line += ` (${t.reason})`;
    const pick = overrides[key];
    if (pick) line += `. You picked: ${content.categories[pick]?.label ?? pick}`;
    lines.push(line);
  }

  lines.push("", "FACE SHAPE");
  for (const { content, part } of SHAPE_CARDS) {
    const p = part(traits);
    if (p.status !== undefined && p.status !== "ok") {
      lines.push(`${content.title}: not measured (${p.reason})`);
      continue;
    }
    const values = content.measures
      .filter((m) => p[m.key] !== null && p[m.key] !== undefined)
      .map((m) => `${m.label} ${m.format(p[m.key])}`);
    lines.push(`${content.title}: ${values.join("; ") || "not measured"}`);
    for (const note of p.notes ?? []) lines.push(`  note: ${note}`);
  }

  const checks = [...warnings, ...quality.issues.map((i) => i.message)];
  lines.push("", "PHOTO CHECK", ...(checks.length ? checks.map((c) => `- ${c}`) : ["No problems found."]));

  const picked = SELF_REPORTED.filter((c) => overrides[c.id]);
  if (picked.length) {
    lines.push("", "YOU TOLD US");
    for (const c of picked) lines.push(`${c.title}: ${c.categories[overrides[c.id]]?.label ?? overrides[c.id]}`);
  }
  return lines.join("\n");
}

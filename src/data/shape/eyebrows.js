// Eyebrow content. Claims checked against Adhikari et al. 2016 (Nat Commun
// 7:10815) full text via Europe PMC (2026-09-23).
import { unibrowLevel } from "../../lib/traits/eyebrows";
import { FACE_SOURCES } from "./common";

const pct = (v) => `${Math.round(v * 100)}%`;
// the study's three-point monobrow scale was none / medium / high
const UNIBROW_LABEL = { none: "None", medium: "Partial", high: "Full" };

const eyebrows = {
  id: "brows",
  title: "Eyebrows",
  measures: [
    {
      key: "unibrow",
      label: "Unibrow",
      format: (v) => UNIBROW_LABEL[unibrowLevel(v)],
      describe: (v) => `${pct(v)} of the skin between your brows reads as hair.`,
    },
    {
      key: "thickness",
      label: "Thickness",
      format: pct,
      describe: (v) => `On average your brows are about ${pct(v)} as tall as the distance between your pupils.`,
    },
    {
      key: "fill",
      label: "Fill",
      format: pct,
      describe: (v) => `${pct(v)} of the eyebrow outline reads as hair. Denser brows fill more of it.`,
    },
    {
      key: "arch",
      label: "Arch",
      format: pct,
      describe: (v) =>
        v < 0.03
          ? "Your brows run nearly straight from end to end."
          : `The top of your brows rises about ${pct(v)} of their length above a straight line between their ends.`,
    },
  ],

  history: [
    {
      evidence: "hypothesis",
      text: "Mobile eyebrows came with a new forehead. Our Middle Pleistocene ancestors had large brow ridges; a virtual-anatomy study found them bigger than needed for the eye sockets or for biting, and proposed that replacing them with a vertical forehead let eyebrows move freely and signal subtle, friendly emotions.",
      cite: ["godinho2018"],
    },
    {
      evidence: "hypothesis",
      text: "Brow ridges kept shrinking within our own species: since the Middle Pleistocene, the average brow ridge has become less prominent and the upper face shorter. One proposal links this to lower testosterone reactivity and rising social tolerance, which would have made life in larger, more cooperative groups possible.",
      cite: ["cieri2014"],
    },
    {
      evidence: "leading",
      text: "Eyebrows matter for recognizing people: in one experiment, removing the eyebrows from familiar faces hurt recognition more than removing the eyes.",
      cite: ["sadr2003"],
    },
    {
      evidence: "unknown",
      text: "Differences in brow thickness, and the unibrow, have no known evolutionary explanation.",
      cite: [],
    },
  ],

  mechanism: [
    {
      text: "The first genes linked to these traits came from a study that scored eyebrow thickness (low, medium or high) and unibrow (none, medium or high) from photos of about 2,900 men. Women weren't scored because most had shaped their eyebrows.",
      cite: ["adhikari2016hair"],
    },
    {
      text: "Eyebrow thickness was linked to a variant in FOXL2. Rare mutations in that gene cause BPES, an eyelid condition often accompanied by thick eyebrows, and in mouse embryos the gene is active around the eyes at the time hair forms.",
      cite: ["adhikari2016hair"],
    },
    {
      text: "The unibrow was linked to a variant near PAX3, a key gene in embryonic development. Rare PAX3 mutations cause Waardenburg syndrome type 1, in which about 85% of people have a unibrow. PAX3 is also linked to the dip at the top of the nose between the eyes.",
      cite: ["adhikari2016hair", "adhikari2016face"],
    },
    {
      text: "Facial hair traits travel together a little: unibrow, eyebrow thickness and beard density were weakly correlated (r = 0.14–0.24). Eyebrow thickness also declined with age (r = −0.17).",
      cite: ["adhikari2016hair"],
    },
  ],
  hint: {
    text: "Each of these variants has a small effect among many, and grooming changes brows far more than any single gene, so no genotype can be read from them.",
    cite: ["adhikari2016hair"],
  },
  myths: [
    {
      myth: "A unibrow means something is medically wrong.",
      reality:
        "A unibrow is ordinary variation, linked to a variant near PAX3 with a small effect. Only rare PAX3 mutations cause Waardenburg syndrome, where the unibrow comes with other features such as hearing loss and pigmentation changes.",
      cite: ["adhikari2016hair"],
    },
  ],
  limitations: [
    {
      text: "Plucking, threading, waxing, tinting or microblading change exactly what's measured here. If you shape your brows, these numbers describe the grooming, not the genes. That's why the genetics study scored men only.",
      cite: ["adhikari2016hair"],
    },
    "Hair is found by comparing each pixel with the skin just above your brows. Very light or fine brows can't be told apart from skin, and a deep shadow between the brows can look like hair.",
    "Bangs and glasses frames over the brows are left out of the measurement.",
    "Arch comes from the face model's outline of your brows, so it describes their overall curve, not the exact edge of every hair.",
  ],
  sources: FACE_SOURCES,
};

export default eyebrows;

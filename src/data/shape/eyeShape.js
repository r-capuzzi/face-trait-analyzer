// Eye shape content. Claims checked against source abstracts via Europe PMC
// (2026-09-23). Shared face-genetics sources live in ./common.js.
import { FACE_SOURCES, FACE_MECHANISM } from "./common";

const eyeShape = {
  id: "eyes",
  title: "Eye shape",
  measures: [
    {
      key: "openness",
      label: "Openness",
      format: (v) => v.toFixed(2),
      describe: (v) => `Each eye opening is about ${Math.round(v * 100)}% as tall as it is wide.`,
    },
    {
      key: "tilt",
      label: "Corner tilt",
      format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}°`,
      describe: (v) =>
        Math.abs(v) < 1
          ? "The outer and inner corners of your eyes sit at about the same height."
          : v > 0
            ? `The outer corners sit a little higher than the inner corners (${v.toFixed(1)}° upward).`
            : `The outer corners sit a little lower than the inner corners (${Math.abs(v).toFixed(1)}° downward).`,
    },
    {
      key: "spacing",
      label: "Spacing",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) => `The gap between your eyes is ${v.toFixed(2)} times the width of one eye.`,
    },
  ],

  mechanism: [
    ...FACE_MECHANISM,
    {
      text: "In one study of 7,569 adults, variants in two DNA regions, near the genes HOXD1–MTX2 and WDR27, were linked to eye shape. Each has a small effect.",
      cite: ["cha2018"],
    },
    {
      text: "PAX3, the gene linked to the unibrow, is also linked to the position of the nasion: the dip at the top of the nose, between the eyes.",
      cite: ["adhikari2016face", "adhikari2016hair"],
    },
  ],
  hint: {
    text: "Eye shape is polygenic: many variants with small effects, plus the underlying bone and soft tissue. No genotype can be read from it.",
    cite: ["white2021", "cha2018"],
  },
  myths: [
    {
      myth: "Eye shape comes from one gene inherited from one parent.",
      reality:
        "Studies find several separate DNA regions with small effects on eye shape, and face shape overall involves over 200 genetic signals.",
      cite: ["cha2018", "white2021"],
    },
  ],
  limitations: [
    "Smiling and squinting narrow the eye opening, so openness is only meaningful with a relaxed face and eyes looking at the camera.",
    "Landmarks are the model's estimate of where your eyelids and eye corners are. Heavy eyeliner, lashes or glasses frames can shift them.",
  ],
  sources: FACE_SOURCES,
};

export default eyeShape;

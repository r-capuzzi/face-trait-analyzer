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

  history: [
    {
      evidence: "strong",
      text: "Compared with nearly half of all primate species, humans show the largest share of the white of the eye (sclera) and the most horizontally stretched eye opening.",
      cite: ["kobayashi2001"],
    },
    {
      evidence: "hypothesis",
      text: "Why is debated. The original proposal: a wide, stretched eye widens the view when scanning with the eyes, and a pale sclera makes gaze direction easy to read, helping cooperation. A 2025 review argues the second part lacks solid support: human eye coloring isn't uniquely conspicuous among primates and varies between people.",
      cite: ["kobayashi2001", "pereagarcia2025"],
    },
    {
      evidence: "leading",
      text: "Eye size tracks daylight: people living farther from the equator have larger eye sockets, an index of eyeball size, while sharpness of vision in daylight is the same across latitudes. The researchers argue larger eyes evolved to make up for dimmer light and shorter winter days.",
      cite: ["pearce2012"],
    },
    {
      evidence: "strong",
      text: "Neanderthals had larger eye sockets than the modern humans of their time.",
      cite: ["pearce2013"],
    },
    {
      evidence: "strong",
      text: "The small pink fold in the inner corner of each eye, the plica semilunaris, is counted among the vestigial structures of the human head: leftovers that have lost most or all of their original role.",
      cite: ["dhawan2023"],
    },
    {
      evidence: "unknown",
      text: "Differences in eye shape between individuals, as opposed to eye size, have no established evolutionary explanation.",
      cite: [],
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

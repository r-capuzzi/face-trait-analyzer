// Face proportions content. Claims checked against source abstracts via
// Europe PMC (2026-09-23 / 24).
import { FACE_SOURCES, FACE_MECHANISM } from "./common";

const pct = (v) => `${Math.round(v * 100)}%`;

const faceProportions = {
  id: "face",
  title: "Face proportions",
  measures: [
    {
      key: "widthToHeight",
      label: "Width vs. height",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) =>
        `Your face is ${v.toFixed(2)} times as wide as it is tall, measured from the bridge of the nose to the chin. The forehead is left out because hairlines vary.`,
    },
    {
      key: "midToLower",
      label: "Midface vs. lower face",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) =>
        `From the bridge of your nose to its base is ${v.toFixed(2)} times the distance from the base of your nose to your chin.`,
      canon: {
        value: 1,
        gauge: { min: 0.5, max: 1.3 },
        text: "The classical canon splits the face into equal thirds. When these canons were tested on 153 young adults, the vertical ones fit real faces worst of all.",
        cite: ["farkas1985"],
      },
    },
    {
      key: "jawToFace",
      label: "Jaw vs. face width",
      format: pct,
      describe: (v) => `Across its angles, your jaw is about ${pct(v)} as wide as the widest part of your face.`,
    },
    {
      key: "chinToLower",
      label: "Chin height",
      format: pct,
      describe: (v) =>
        `From the bottom of your lower lip to the tip of your chin is ${pct(v)} of your lower face (the base of the nose to the chin).`,
    },
  ],

  history: [
    {
      evidence: "strong",
      text: "Most differences in skull and face shape between populations match random drift, the chance changes that build up as populations separate, rather than natural selection. A population living in extreme cold was the exception: its skull breadth and nose appear to have adapted.",
      cite: ["roseman2004"],
    },
    {
      evidence: "leading",
      text: "Jaws respond to diet as they grow. Hunter-gatherers have consistently longer, narrower lower jaws than farmers, most likely because softer food changes how the jaw develops, and that mismatch between jaw and teeth is a reason crowded teeth are so common today.",
      cite: ["cramon2011"],
    },
    {
      evidence: "unknown",
      text: "The chin is unique to modern humans, and why we have one is unresolved: explanations range from speech, chewing and mate choice to a side effect of the face shrinking back, and none has won out.",
      cite: ["pampush2016"],
    },
  ],

  mechanism: [
    {
      text: "Genes shape the face as a whole: in one family study, most facial measurements were strongly genetically correlated with each other, indicating a large overlap in the variants that influence them. Widths were slightly more heritable than heights.",
      cite: ["cole2017"],
    },
    {
      text: "The jaw has a well-studied example: a variant in EDAR is linked to how far the chin juts forward, and mice with altered Edar function grow jaws of a different length.",
      cite: ["adhikari2016face"],
    },
    {
      text: "Proportions also change as you grow: the same canon study found differences between 6-, 12- and 18-year-olds.",
      cite: ["farkas1985"],
    },
    ...FACE_MECHANISM,
  ],
  hint: {
    text: "Face proportions are polygenic, with many variants of small, overlapping effect, so no genotype can be read from them.",
    cite: ["cole2017", "white2021"],
  },
  myths: [
    {
      myth: "Well-proportioned faces are divided into three equal parts.",
      reality:
        "The \"equal thirds\" canon comes from art, not measurement. Tested on real young adults, the vertical canons matched worst of all, and the researchers found a large variability in normal faces.",
      cite: ["farkas1985"],
    },
  ],
  limitations: [
    "Tilting your head up or down changes the heights much more than the widths. Look straight at the camera.",
    "An open mouth lengthens the lower face, and a beard can hide the real line of the jaw and chin from the face model.",
    "The jaw angles and chin are estimated by the face model from the outline of your face, including soft tissue, not bone.",
  ],
  sources: FACE_SOURCES,
};

export default faceProportions;

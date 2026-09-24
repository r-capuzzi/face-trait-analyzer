// Lip and mouth content. Claims checked against source abstracts via Europe
// PMC (2026-09-23).
import { FACE_SOURCES, FACE_MECHANISM } from "./common";

const lipShape = {
  id: "lips",
  title: "Lips and mouth",
  measures: [
    {
      key: "mouthToNose",
      label: "Mouth width vs. nose",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) => `Your mouth, corner to corner, is ${v.toFixed(2)} times as wide as your nose.`,
    },
    {
      key: "lowerToUpper",
      label: "Lower vs. upper lip",
      format: (v) => (v === null ? "–" : `${v.toFixed(2)}×`),
      describe: (v) =>
        v === null
          ? "The upper lip couldn't be measured in this photo."
          : `At the center, your lower lip is ${v.toFixed(2)} times as tall as your upper lip.`,
    },
    {
      key: "fullness",
      label: "Lip height vs. width",
      format: (v) => `${Math.round(v * 100)}%`,
      describe: (v) => `Both lips together are about ${Math.round(v * 100)}% as tall as your mouth is wide.`,
    },
    {
      key: "bow",
      label: "Cupid's bow",
      format: (v) => `${Math.round(v * 100)}%`,
      describe: (v) =>
        v < 0.05
          ? "The center of your upper lip is nearly flat in this photo, with little dip between the two peaks."
          : `The dip between the two peaks of your upper lip is about ${Math.round(v * 100)}% of the upper lip's height.`,
    },
  ],

  history: [
    {
      evidence: "strong",
      text: "The muscles that move the lips are old: chimpanzees have nearly the same facial-expression muscles as humans. What sets human lips apart is their fine structure.",
      cite: ["burrows2006", "rotenstreich2025"],
    },
    {
      evidence: "hypothesis",
      text: "Human lips are built differently from other primates': in a study of 15 primate species, only humans had a hook-shaped lip muscle together with fat-rich, low-connective-tissue lips. The authors propose this gives the fine control that speech needs, while noting they have no direct functional evidence.",
      cite: ["rotenstreich2025"],
    },
    {
      evidence: "unknown",
      text: "Why lip shape and fullness vary between people has no established evolutionary explanation.",
      cite: [],
    },
  ],

  mechanism: [
    {
      text: "In a study of more than 6,000 people, one DNA region on chromosome 1 that affects lip thickness includes a stretch of DNA inherited from Denisovans, an archaic human group that interbred with modern humans.",
      cite: ["bonfante2021"],
    },
    ...FACE_MECHANISM,
  ],
  hint: {
    text: "Lip and mouth shape are polygenic, so no genotype can be read from them. They're also some of the most expression-sensitive features on the face.",
    cite: ["white2021", "bonfante2021"],
  },
  myths: [
    {
      myth: "A few genes decide the shape of your face.",
      reality:
        "Over 200 genetic signals are linked to normal facial variation, and some regions act on several features at once. A face is the combined result of hundreds of small effects.",
      cite: ["white2021"],
    },
  ],
  limitations: [
    "Any expression changes these numbers: smiling widens the mouth and thins the lips, and pressing the lips together hides some of their height. Use a relaxed, closed-mouth photo.",
    "Lip edges are the model's estimate. Lip liner, lipstick or facial hair can shift where it places them.",
  ],
  sources: FACE_SOURCES,
};

export default lipShape;

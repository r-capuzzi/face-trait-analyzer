// Forehead & hairline content. Claims checked against source abstracts via
// Europe PMC (2026-09-24).
import { FACE_SOURCES, FACE_MECHANISM } from "./common";

const hairline = {
  id: "hairline",
  title: "Forehead & hairline",
  measures: [
    {
      key: "upperToMid",
      label: "Forehead vs. midface",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) =>
        `From your hairline to the bridge of your nose is ${v.toFixed(2)} times the distance from the bridge of your nose to its base.`,
      canon: {
        value: 1,
        gauge: { min: 0.6, max: 2 },
        text: "The canon's top third says these should be equal. In the study that tested the canons, the vertical proportions fit real faces worst of all.",
        cite: ["farkas1985"],
      },
    },
  ],

  history: [
    {
      evidence: "strong",
      text: "Modern humans have a short face tucked beneath a large, rounded braincase, with a vertical forehead where our Middle Pleistocene relatives had heavy brow ridges. (For why losing the ridges may have mattered, see Eyebrows.)",
      cite: ["lacruz2019", "godinho2018"],
    },
    {
      evidence: "unknown",
      text: "Male-pattern baldness is common and highly heritable, yet no evolutionary explanation for it has been established.",
      cite: ["heilmann2017"],
    },
  ],

  mechanism: [
    {
      text: "Forehead height depends on where the hairline sits, and for many people that moves with age. The most common kind of hair loss, male-pattern baldness, is driven by androgens, highly heritable, and mostly a matter of genetic predisposition.",
      cite: ["hillmer2005", "heilmann2017"],
    },
    {
      text: "Its biggest single genetic factor is the androgen receptor gene (AR): variation in AR was the key prerequisite for early-onset hair loss in one study. AR sits on the X chromosome.",
      cite: ["hillmer2005"],
    },
    {
      text: "It's far from the only factor: a study of about 22,500 men found 63 regions of DNA involved, including genes such as FGF5, IRF4 and DKK2, which together explained about 39% of the variation.",
      cite: ["heilmann2017"],
    },
    {
      text: "Predicting it from DNA is still modest: a model built on 117 variants reached an AUC of about 0.7 for telling any hair loss from none.",
      cite: ["chen2023"],
    },
    ...FACE_MECHANISM,
  ],
  hint: {
    text: "Hairline position is polygenic and changes with age, so no genotype can be read from a photo.",
    cite: ["heilmann2017", "chen2023"],
  },
  myths: [
    {
      myth: "Baldness is inherited from your mother's side.",
      reality:
        "Partly true. The biggest single factor, AR, is on the X chromosome, which men inherit from their mother. But dozens of other regions of DNA (63 in one study) sit on other chromosomes and come from both parents.",
      cite: ["hillmer2005", "heilmann2017"],
    },
  ],
  limitations: [
    "The hairline comes from where the segmentation model starts labeling hair. Fine, sparse hairs at the edge may be counted as skin, which makes the forehead measure a little taller.",
    "Only the center of the hairline is measured, so receding temples aren't captured.",
    "Bangs, a side part lying across the forehead, a hat or a shaved head all hide the hairline, and the card says so rather than guessing.",
  ],
  sources: FACE_SOURCES,
};

export default hairline;

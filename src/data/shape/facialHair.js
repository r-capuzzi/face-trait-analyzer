// Facial hair content. Claims checked against Adhikari et al. 2016 (Nat
// Commun 7:10815) full text via Europe PMC (2026-09-24).
import { beardLevel } from "../../lib/traits/facialHair";
import { FACE_SOURCES } from "./common";

const pct = (v) => `${Math.round(v * 100)}%`;
// coverage, not length: close-trimmed stubble over the whole jaw is "full"
const LEVEL = { none: "None visible", light: "Light", moderate: "Moderate", full: "Full coverage" };

const facialHair = {
  id: "beard",
  title: "Facial hair",
  measures: [
    {
      key: "coverage",
      label: "Overall",
      format: (v) => LEVEL[beardLevel(v)],
      describe: (v) =>
        `${pct(v)} of the mustache, chin and jaw areas reads as hair. This is how much area is covered, not how long the hair is.` +
        // the four clean-shaven test faces read 1.5-11.6% (shadows, skin texture)
        (beardLevel(v) === "none"
          ? " Shadows and skin texture alone read as up to about 12% on clean-shaven faces, so this counts as none."
          : ""),
    },
    {
      key: "mustache",
      label: "Mustache area",
      format: pct,
      describe: (v) => `${pct(v)} of the area between your nose and upper lip reads as hair.`,
    },
    {
      key: "chin",
      label: "Chin",
      format: pct,
      describe: (v) => `${pct(v)} of your chin reads as hair.`,
    },
    {
      key: "sides",
      label: "Jaw & cheeks",
      format: pct,
      describe: (v) => `${pct(v)} of the area along your jaw reads as hair.`,
    },
  ],

  history: [
    {
      evidence: "hypothesis",
      text: "Darwin thought beards evolved because women found them attractive. When tested in two cultures (New Zealand and Samoa), women didn't rate bearded faces as more attractive, but beards made men look older and higher-status, and angry bearded faces looked more aggressive. That fits beards evolving mainly through competition between men.",
      cite: ["dixson2012"],
    },
    {
      evidence: "hypothesis",
      text: "The gene most strongly linked to beard thickness, EDAR, is also one whose 370A variant spread through strong natural selection, probably for its effects on other organs rather than on beards.",
      cite: ["adhikari2016hair", "kamberov2013"],
    },
  ],

  mechanism: [
    {
      text: "The first genes linked to beard thickness came from a study that scored it (low, medium or high) from photos of about 2,900 men, rating shaved and unshaved men separately. The strongest link was EDAR, followed by LNX1, PREP and FOXP2.",
      cite: ["adhikari2016hair"],
    },
    {
      text: "EDAR is part of a signaling pathway that, before birth, sets the location, size and shape of hair follicles, teeth and glands.",
      cite: ["adhikari2016hair"],
    },
    {
      text: "A beard grows in two stages: hair follicles are patterned in the embryo, then after puberty androgens transform their fine hair into thick terminal hair.",
      cite: ["adhikari2016hair"],
    },
  ],
  hint: {
    text: "Beard growth is polygenic and hormone-driven, and shaving and grooming change it more than any single gene, so no genotype can be read from it.",
    cite: ["adhikari2016hair"],
  },
  myths: [
    {
      myth: "Beard thickness is fixed once puberty ends.",
      reality:
        "In the same study, beard density kept rising with age (r = 0.28). It was also weakly correlated with eyebrow density and the unibrow (r = 0.14–0.24).",
      cite: ["adhikari2016hair"],
    },
  ],
  limitations: [
    "Shaving and grooming change exactly what's measured, so this describes your face today, not what you could grow.",
    "Hair is found by comparing each pixel with your upper cheeks and requiring hair-like texture, so smooth shadows don't count. Very light or fine facial hair can't be told apart from skin.",
    "Tested so far on clean-shaven photos (which correctly read as none) and on simulated beards, but not yet on photos of real beards, so treat the levels as approximate.",
  ],
  sources: FACE_SOURCES,
};

export default facialHair;

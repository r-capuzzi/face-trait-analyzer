// Nose shape content. Claims checked against source abstracts via Europe
// PMC (2026-09-23); the selfie figure is from Ward 2018 as reported by
// Rutgers / ScienceDaily (the paper has no abstract in the databases).
import { FACE_SOURCES, FACE_MECHANISM } from "./common";

const noseShape = {
  id: "nose",
  title: "Nose width",
  measures: [
    {
      key: "toEyeGap",
      label: "Width vs. eye gap",
      format: (v) => `${v.toFixed(2)}×`,
      describe: (v) => `Your nose (at the widest point of the nose wings) is ${v.toFixed(2)} times the gap between your eyes.`,
      canon: {
        value: 1,
        gauge: { min: 0.6, max: 1.8 }, // display range only, not a norm
        text: "The classical art \"canon\" says these should be equal. In a study of 153 young adults, that held for only 40%.",
        cite: ["farkas1985"],
      },
    },
    {
      key: "toFaceWidth",
      label: "Width vs. face width",
      format: (v) => `${Math.round(v * 100)}%`,
      describe: (v) => `Your nose spans about ${Math.round(v * 100)}% of your face's width.`,
      canon: {
        value: 0.25,
        gauge: { min: 0.15, max: 0.45 },
        text: "The canon says a quarter of the face's width. That held for 37% of the same young adults.",
        cite: ["farkas1985"],
      },
    },
  ],

  history: [
    {
      evidence: "hypothesis",
      text: "A projecting outer nose is unique to humans among living apes, and its skeletal signs appear with Homo erectus about 1.6 million years ago. The study that dated it argued it helped conserve moisture in dry, open landscapes, by adding turbulence and cooling the air we breathe out.",
      cite: ["franciscus1988"],
    },
    {
      evidence: "leading",
      text: "The nose warms and humidifies the air we breathe. Nostril width varies across the world more than random drift alone would predict, and it correlates with temperature and absolute humidity, pointing to adaptation to climate. The researchers call this a simplified explanation of a complex history that may also involve other forces, such as mate choice.",
      cite: ["zaidi2017"],
    },
    {
      evidence: "strong",
      text: "The inside of the nose tracks climate too: the bony nasal cavity is shaped to increase contact between air and tissue in cold, dry climates.",
      cite: ["noback2011"],
    },
    {
      evidence: "strong",
      text: "Extreme cold is one of the few places where skull shape clearly departed from random drift, and the nose was among the features affected.",
      cite: ["roseman2004"],
    },
  ],

  mechanism: [
    {
      text: "In a study of about 6,000 people that scored 14 facial features, most of the genetic hits were for the nose: variants near GLI3 and PAX1 were linked to the width of the nose wings, RUNX2 to the width of the nose bridge, and DCHS2 to how the base between the nostrils angles.",
      cite: ["adhikari2016face"],
    },
    {
      text: "Another study linked variants near SOX9 and DHX35 to nose shape, and replicated six previously known nose loci.",
      cite: ["cha2018"],
    },
    ...FACE_MECHANISM,
  ],
  hint: {
    text: "Nose shape is polygenic: several genes with individually small effects, so no genotype can be read from a photo.",
    cite: ["adhikari2016face", "white2021"],
  },
  myths: [
    {
      myth: "Beautiful faces follow classical proportions, with the nose exactly as wide as the gap between the eyes.",
      reality:
        "When these neoclassical art \"canons\" were tested on real people, even the best-fitting ones described only about 40% of faces. The researchers concluded the canons don't represent average proportions, and real faces vary widely.",
      cite: ["farkas1985"],
    },
    {
      myth: "A selfie shows your nose as it really is.",
      reality:
        "At selfie distance (about 30 cm), perspective makes the base of the nose look about 30% wider than in a photo taken from 1.5 m.",
      cite: ["ward2018"],
    },
  ],
  limitations: [
    {
      text: "Camera distance matters a lot for the nose: an arm's-length selfie makes it measure wider. For this measurement, have someone take the photo from about 1.5 m away.",
      cite: ["ward2018"],
    },
    {
      text: "Smiling widens the nose: in one study of 50 people, the nose base got wider during a smile in 92% of them. A relaxed face gives the true resting width.",
      cite: ["beiraghi2016"],
    },
    "Nose width is measured at the outer edges of the nose wings, as estimated by the face model. Face width is the widest part of the face outline, close to cheekbone width. From the front, a 2D photo can't capture nose length, height or bridge shape.",
  ],
  sources: FACE_SOURCES,
};

export default noseShape;

// "How faces got this way": the "Why it evolved" points from the cards,
// placed in time. Every date and claim comes from a source already verified
// for a card (see evolution.js); dates are only given where the source
// gives one. Each event's evidence label is that of its weakest claim.
// `cards` are the heading ids of the related cards.
import { evolutionSources } from "./evolution";

const timeline = {
  id: "timeline",
  events: [
    {
      when: "About 25 million years ago",
      title: "Ears that turn toward sounds",
      evidence: "leading",
      text: "An ear-turning system from ancestors this far back may survive as a \"neural fossil\": the vestigial muscles around our ears still fire toward sounds.",
      cite: ["strauss2020"],
      cards: [["trait-earlobes", "Earlobes"]],
    },
    {
      when: "The last 6 million years",
      title: "Our lineage's face takes shape",
      evidence: "leading",
      text: "Fossils of our lineage over this span show how the modern face arose, shaped by chewing, breathing and social signaling. The earliest members probably had light skin under dark body hair, as chimpanzees do.",
      cite: ["lacruz2019", "jablonski2000"],
      cards: [["shape-face", "Face proportions"], ["trait-skin", "Skin tone"]],
    },
    {
      when: "Early in our genus",
      title: "Losing body hair, gaining dark skin",
      evidence: "leading",
      text: "Body hair was lost but scalp hair kept, and dark, melanin-rich skin evolved, most likely to protect sweat glands and folate from UV light.",
      cite: ["jablonski2000", "lasisi2023"],
      cards: [["trait-skin", "Skin tone"], ["trait-texture", "Hair texture"]],
    },
    {
      when: "About 1.6 million years ago",
      title: "Homo erectus: a projecting nose, smaller teeth",
      evidence: "hypothesis",
      text: "The skeletal signs of a projecting outer nose appear, possibly to save moisture in dry landscapes. Teeth and chewing muscles are smaller than in earlier hominins, and eating meat and slicing or pounding food cut the chewing needed.",
      cite: ["franciscus1988", "zink2016"],
      cards: [["shape-nose", "Nose"], ["shape-face", "Face proportions"]],
    },
    {
      when: "Middle Pleistocene",
      title: "Brow ridges give way to foreheads",
      evidence: "hypothesis",
      text: "Our ancestors had heavy brow ridges. In modern humans a vertical forehead replaced them, possibly freeing the eyebrows to signal emotions, and within our own species brow ridges kept shrinking.",
      cite: ["godinho2018", "cieri2014"],
      cards: [["shape-brows", "Eyebrows"], ["shape-hairline", "Forehead & hairline"]],
    },
    {
      when: "Neanderthals",
      title: "Cousins who varied too",
      evidence: "leading",
      text: "Neanderthals had larger eye sockets than the modern humans of their time and noses that moved more air. Some carried their own red-hair variant of MC1R, and DNA inherited from them still shifts skin tone, hair color and tanning in present-day Europeans.",
      cite: ["pearce2013", "wroe2018", "lalueza2007", "dannemann2017"],
      cards: [["trait-hair", "Hair color"], ["trait-freckles", "Freckles"], ["shape-eyes", "Eye shape"]],
    },
    {
      when: "About 30,000 years ago",
      title: "EDAR 370A arises",
      evidence: "strong",
      text: "A variant of EDAR that thickens hair arises, probably in central China, and becomes one of the strongest signals of recent selection in the genome.",
      cite: ["kamberov2013"],
      cards: [["trait-texture", "Hair texture"], ["trait-earlobes", "Earlobes"], ["shape-beard", "Facial hair"]],
    },
    {
      when: "About 20,000 years ago",
      title: "The last Ice Age",
      evidence: "hypothesis",
      text: "One hypothesis places EDAR's selection here, in the low-sunlight Arctic, where more branched milk ducts may have helped mothers pass vitamin D to their babies.",
      cite: ["hlusko2018"],
      cards: [["trait-texture", "Hair texture"]],
    },
    {
      when: "About 7,000 years ago",
      title: "Blue-eyed hunter-gatherers",
      evidence: "strong",
      text: "The hunter-gatherers sampled from this era all carried the blue-eye variant, yet a 7,000-year-old hunter-gatherer from Spain still had the older, darker versions of several skin genes: eyes and skin changed on different timelines.",
      cite: ["mathieson2015", "olalde2014"],
      cards: [["trait-eye", "Eye color"], ["trait-skin", "Skin tone"]],
    },
    {
      when: "With farming",
      title: "Farmers bring light skin, and softer food",
      evidence: "leading",
      text: "The main light-skin variant of SLC24A5 reached Europe mostly with farmers migrating from Anatolia. Softer farmed food changed how jaws grow, leaving them shorter and wider than hunter-gatherers'.",
      cite: ["mathieson2015", "cramon2011"],
      cards: [["trait-skin", "Skin tone"], ["shape-face", "Face proportions"]],
    },
    {
      when: "The last 5,000 years",
      title: "Selection for lighter pigment",
      evidence: "strong",
      text: "Ancient DNA shows strong natural selection favoring lighter skin, hair and eyes in Europe, estimated at 2 to 10% per generation.",
      cite: ["wilde2014"],
      cards: [["trait-eye", "Eye color"], ["trait-hair", "Hair color"]],
    },
  ],
  sources: evolutionSources(
    "strauss2020", "lacruz2019", "jablonski2000", "lasisi2023", "franciscus1988", "zink2016", "godinho2018",
    "cieri2014", "pearce2013", "wroe2018", "lalueza2007", "dannemann2017", "kamberov2013", "hlusko2018",
    "mathieson2015", "olalde2014", "cramon2011", "wilde2014"
  ),
};

export default timeline;

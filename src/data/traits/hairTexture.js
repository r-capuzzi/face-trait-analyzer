// Hair texture (self-reported: photos can't reliably measure curl - styling,
// length and lighting all change how hair looks). Claims checked against
// source abstracts / full text via Europe PMC (2026-09-23).
import { evolutionSources } from "../evolution";

const POLYGENIC = {
  text: "Hair shape is polygenic, so no genotype can be read from it. The best-known variant, near TCHH, explained only about 6% of the variation in the study that found it; other variants near WNT10A, OFCC1 and PRSS53 add their own small effects.",
  cite: ["medland2009", "eriksson2010", "adhikari2016hair"],
};

const hairTexture = {
  id: "texture",
  title: "Hair texture",
  selfReport:
    "A photo can't reliably measure curl (styling, length and lighting all change how hair looks), so tell us yours.",

  history: [
    {
      evidence: "strong",
      text: "Our ancestors lost most of their body hair early in the evolution of our genus but kept it on the scalp, leaving humans unusual among mammals: the earliest members of our lineage were probably covered in dark hair, as chimpanzees are.",
      cite: ["jablonski2000", "lasisi2023"],
    },
    {
      evidence: "hypothesis",
      text: "Scalp hair may be a sunshade. In tests with a heated manikin wearing wigs under simulated sunlight, hair cut the sun's heat reaching the scalp, and tightly curled hair did so best, suggesting it could have helped our ancestors stay cool under strong sun.",
      cite: ["lasisi2023"],
    },
    {
      evidence: "strong",
      text: "Thick hair got a boost from natural selection: the EDAR 370A variant, one of the strongest signals of recent selection in the human genome, arose about 30,000 years ago, probably in central China. Mice carrying it grow thicker hair.",
      cite: ["kamberov2013"],
    },
    {
      evidence: "hypothesis",
      text: "Why EDAR 370A was favored is debated, because the gene does many things. Candidates include more active sweat glands and, in one hypothesis, more branched milk ducts that helped mothers pass vitamin D to their babies in the low-sunlight Arctic during the last Ice Age, about 20,000 years ago.",
      cite: ["kamberov2013", "hlusko2018"],
    },
  ],

  mechanism: [
    {
      text: "Curly hair grows from a curved follicle with a bent, golf-club-shaped bulb. Cells divide more on one side of it, so the hair is built asymmetrically and keeps its curve even when grown in a dish.",
      cite: ["thibaut2005"],
    },
    {
      text: "Two of the genes linked to hair shape, TCHH and PRSS53, are both active in the same place: the inner root sheath, the layer that molds the hair as it grows.",
      cite: ["medland2009", "adhikari2016hair"],
    },
  ],

  categories: {
    straight: {
      label: "Straight",
      summary: "Grows from a straight follicle.",
      hint: {
        text: "Variants near TCHH were linked to straight hair in a study of Australians of European descent, and a variant in EDAR has a similar straight-hair effect in other populations. " + POLYGENIC.text,
        cite: ["medland2009", ...POLYGENIC.cite],
      },
    },
    wavy: { label: "Wavy", summary: "In between straight and curly.", hint: POLYGENIC },
    curly: { label: "Curly", summary: "Grows from a curved follicle.", hint: POLYGENIC },
    coily: { label: "Very curly / coily", summary: "Tightly curved follicles.", hint: POLYGENIC },
  },

  genes: [
    {
      symbol: "TCHH",
      variant: "trichohyalin",
      role: "A protein of the inner root sheath, the layer that shapes the growing hair.",
      effect: "Linked to straight hair; explained about 6% of hair-shape variation in the study that found it.",
      cite: ["medland2009"],
    },
    {
      symbol: "WNT10A · OFCC1",
      variant: "",
      role: "Two more genes found near variants linked to hair shape.",
      effect: "Both were newly linked to hair shape in a large study based on participants' own reports.",
      cite: ["eriksson2010"],
    },
    {
      symbol: "PRSS53",
      variant: "Q30R",
      role: "An enzyme made in the hair follicle's inner root sheath; the Q30R change affects how it's processed and released.",
      effect: "A newly found hair-shape locus in a study of over 6,000 people.",
      cite: ["adhikari2016hair"],
    },
  ],

  myths: [
    {
      myth: "Curly hair is simply dominant over straight hair.",
      reality:
        "Hair shape doesn't follow a single-gene rule. Even the strongest known variant explains only about 6% of the variation, alongside many other genes.",
      cite: ["medland2009", "eriksson2010"],
    },
  ],

  limitations: [
    "This card uses what you tell it, not your photo.",
    "Heat styling, perms, relaxers and keratin treatments change texture, so pick your natural, untreated hair.",
  ],

  sources: {
    ...evolutionSources("lasisi2023", "kamberov2013", "hlusko2018", "jablonski2000"),
    medland2009: {
      citation:
        "Medland SE et al. (2009). Common variants in the trichohyalin gene are associated with straight hair in Europeans. Am J Hum Genet 85:750–755.",
      doi: "10.1016/j.ajhg.2009.10.009",
    },
    eriksson2010: {
      citation:
        "Eriksson N et al. (2010). Web-based, participant-driven studies yield novel genetic associations for common traits. PLoS Genet 6:e1000993.",
      doi: "10.1371/journal.pgen.1000993",
    },
    adhikari2016hair: {
      citation:
        "Adhikari K et al. (2016). A genome-wide association scan in admixed Latin Americans identifies loci influencing facial and scalp hair features. Nat Commun 7:10815.",
      doi: "10.1038/ncomms10815",
    },
    thibaut2005: {
      citation: "Thibaut S et al. (2005). Human hair shape is programmed from the bulb. Br J Dermatol 152:632–638.",
      doi: "10.1111/j.1365-2133.2005.06521.x",
    },
  },
};

export default hairTexture;

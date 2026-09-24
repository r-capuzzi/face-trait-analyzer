// Freckles (self-reported: photos can't reliably count them - resolution,
// makeup, filters and skin-smoothing all hide freckles). Claims checked
// against source abstracts via Europe PMC (2026-09-23).
import { evolutionSources } from "../evolution";

const FRECKLE_GENES_HINT = {
  text: "Freckling has been linked to variants in several pigmentation genes, including MC1R, IRF4 and BNC2, each with its own effect. Having freckles, or not, can't pin down a genotype.",
  cite: ["eriksson2010", "praetorius2013", "yamaguchi2012"],
};

const freckles = {
  id: "freckles",
  title: "Freckles",
  selfReport:
    "Photos can't reliably count freckles (resolution, makeup, filters and skin smoothing all hide them), so tell us yours.",

  history: [
    {
      evidence: "leading",
      text: "Freckles probably have no advantage of their own. MC1R, one of the main genes behind them, is held unchanged by strong selection in Africa; outside Africa that constraint relaxed and variants built up as random drift would predict, including the kinds that make freckling more likely.",
      cite: ["harding2000", "eriksson2010"],
    },
    {
      evidence: "strong",
      text: "Part of the story traces to Neanderthals. Two stretches of DNA near BNC2, a gene linked to freckling, entered Europeans from Neanderthals; one Neanderthal version is now carried on more than two-thirds of European chromosomes and is linked to tanning poorly and getting more sunburns in childhood.",
      cite: ["dannemann2017", "eriksson2010"],
    },
  ],

  mechanism: [
    {
      text: "Freckles are small spots where pigment cells make more melanin than the skin around them.",
      cite: [],
    },
    {
      text: "The IRF4 variant linked to freckles works through a genetic switch: it weakens an enhancer that boosts IRF4 in pigment cells, and IRF4 in turn helps switch on tyrosinase, the key enzyme in melanin production. The same variant is linked to how sensitive skin is to the sun.",
      cite: ["praetorius2013"],
    },
    {
      text: "MC1R's link to freckling isn't limited to red-haired people. In a study of 653 people in Japan, the MC1R variant V92M raised the odds of freckling.",
      cite: ["yamaguchi2012"],
    },
  ],

  categories: {
    none: {
      label: "No freckles",
      summary: "No freckles, or very few.",
      hint: FRECKLE_GENES_HINT,
    },
    some: {
      label: "Some freckles",
      summary: "A scattering, often across the nose and cheeks.",
      hint: FRECKLE_GENES_HINT,
    },
    many: {
      label: "Many freckles",
      summary: "Dense freckling.",
      hint: {
        text: "Many freckles often goes with variants in MC1R, the gene best known for red hair, and in IRF4. But several genes contribute, so it still can't pin down a genotype.",
        cite: ["eriksson2010", "praetorius2013", "yamaguchi2012"],
      },
    },
  },

  genes: [
    {
      symbol: "MC1R",
      variant: "e.g. V92M",
      role: "The receptor that tilts pigment cells between black-brown and red-yellow melanin.",
      effect: "Confirmed as a pigmentation gene (for hair color, eye color and freckling) in a large self-report study; its V92M variant raised the odds of freckling in a Japanese sample.",
      cite: ["eriksson2010", "yamaguchi2012"],
    },
    {
      symbol: "IRF4",
      variant: "rs12203592",
      role: "Helps switch on tyrosinase, the key enzyme in melanin production.",
      effect: "Linked to freckles, sun sensitivity, eye color and hair color.",
      cite: ["praetorius2013"],
    },
    {
      symbol: "BNC2",
      variant: "rs2153271",
      role: "A gene newly linked to freckling in a large study based on participants' own reports.",
      effect: "One more small, independent contributor.",
      cite: ["eriksson2010"],
    },
  ],

  myths: [
    {
      myth: "Only redheads get freckles.",
      reality:
        "Freckling involves several genes. MC1R variants raise the odds of freckling even in people without red hair, as a study in Japan found.",
      cite: ["yamaguchi2012", "eriksson2010"],
    },
  ],

  limitations: [
    "This card uses what you tell it, not your photo.",
    "Freckles (ephelides) are different from moles and age spots. If a spot changes shape, size or color, have a doctor look at it.",
  ],

  sources: {
    ...evolutionSources("harding2000", "dannemann2017", "yamaguchi2012"),
    eriksson2010: {
      citation:
        "Eriksson N et al. (2010). Web-based, participant-driven studies yield novel genetic associations for common traits. PLoS Genet 6:e1000993.",
      doi: "10.1371/journal.pgen.1000993",
    },
    praetorius2013: {
      citation:
        "Praetorius C et al. (2013). A polymorphism in IRF4 affects human pigmentation through a tyrosinase-dependent MITF/TFAP2A pathway. Cell 155:1022–1033.",
      doi: "10.1016/j.cell.2013.10.022",
    },
  },
};

export default freckles;

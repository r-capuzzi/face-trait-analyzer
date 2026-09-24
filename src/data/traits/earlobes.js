// Earlobes (self-reported: a front-facing photo usually hides the lobes
// behind hair or shows them edge-on; the genetics studies scored them from
// photos taken at a 45° angle). Claims checked against source abstracts and
// full text via Europe PMC (2026-09-24).
import { evolutionSources } from "../evolution";

const POLYGENIC = {
  text: "Earlobe attachment is polygenic: the largest study, of 74,660 people, found 49 DNA regions linked to it. With that many small effects, your earlobes can't reveal a genotype.",
  cite: ["shaffer2017"],
};

const earlobes = {
  id: "earlobes",
  title: "Earlobes",
  selfReport:
    "A front-facing photo usually hides your earlobes behind hair or shows them edge-on (studies photograph them from the side), so tell us yours.",

  history: [
    {
      evidence: "unknown",
      text: "Earlobe shape has no known function or evolutionary advantage.",
      cite: [],
    },
    {
      evidence: "hypothesis",
      text: "One earlobe gene did evolve under selection, probably for something else. EDAR's 370A variant, linked to lobe size and attachment, spread through strong natural selection; the leading ideas for why involve sweat glands or milk ducts, so ear shape likely changed along the way. One gene shaping several traits (pleiotropy) is common in evolution.",
      cite: ["adhikari2015", "kamberov2013", "hlusko2018"],
    },
  ],

  mechanism: [
    {
      text: "Earlobes aren't simply free or attached. Researchers score them on a scale (free, partially attached or attached), and as early as 1937 a geneticist pointed out that the trait varies continuously, the way polygenic traits do.",
      cite: ["shaffer2017"],
    },
    {
      text: "Many of the genes near the linked DNA regions are active where the ear forms: the study confirmed their activity in human fetal ear tissue and in the matching embryonic tissue in mice.",
      cite: ["shaffer2017"],
    },
    {
      text: "Several of those genes cause syndromes with ear malformations when a mutation breaks them. The researchers suggest that milder variants in the same genes, which change when or how much a gene is used, tune ordinary ear shape.",
      cite: ["shaffer2017"],
    },
  ],

  categories: {
    free: {
      label: "Free",
      summary: "The lobe hangs below the point where the ear joins the head.",
      hint: POLYGENIC,
    },
    partial: {
      label: "Partially attached",
      summary: "In between: a small hanging lobe.",
      hint: POLYGENIC,
    },
    attached: {
      label: "Attached",
      summary: "The lobe joins the side of the head, with little or nothing hanging below.",
      hint: POLYGENIC,
    },
  },

  genes: [
    {
      symbol: "EDAR",
      variant: "rs3827760 (V370A)",
      role: "A receptor that guides how skin-derived organs such as hair, teeth and glands develop in the embryo.",
      effect:
        "In 5,062 Latin Americans the same variant was linked to four ear traits, including lobe size and lobe attachment; mice lacking working Edar grow abnormally shaped outer ears. EDAR also turned up in the 74,660-person study.",
      cite: ["adhikari2015", "shaffer2017"],
    },
    {
      symbol: "SP5 · PAX9 · ADGRG6 · KIAA1217 · MRPS22",
      variant: "",
      role: "Candidate genes in the other five regions found from trained raters' scores.",
      effect: "The self-reported 23andMe answers found all six of these regions again.",
      cite: ["shaffer2017"],
    },
    {
      symbol: "ZFHX3",
      variant: "rs74030209",
      role: "A gene newly linked to earlobe attachment in a separate study.",
      effect: "Found in 9,977 people in China who described their own earlobes.",
      cite: ["wang2022"],
    },
  ],

  myths: [
    {
      myth: "Free earlobes are dominant and attached earlobes are recessive, a classic single-gene trait.",
      reality:
        "Earlobe attachment has been taught as a textbook single-gene trait for nearly a century, but the 49 DNA regions found so far show it's polygenic, and lobes range from free to attached instead of falling into two types.",
      cite: ["shaffer2017"],
    },
  ],

  limitations: [
    "This card uses what you tell it, not your photo.",
    {
      text: "Self-reports work for this trait: in the big study, people's own free-or-attached answers found the same six regions as trained raters' three-point scores.",
      cite: ["shaffer2017"],
    },
  ],

  sources: {
    ...evolutionSources("kamberov2013", "hlusko2018"),
    shaffer2017: {
      citation:
        "Shaffer JR et al. (2017). Multiethnic GWAS reveals polygenic architecture of earlobe attachment. Am J Hum Genet 101:913–924.",
      doi: "10.1016/j.ajhg.2017.10.001",
    },
    adhikari2015: {
      citation:
        "Adhikari K et al. (2015). A genome-wide association study identifies multiple loci for variation in human ear morphology. Nat Commun 6:7500.",
      doi: "10.1038/ncomms8500",
    },
    wang2022: {
      citation:
        "Wang P et al. (2022). Novel genetic associations with five aesthetic facial traits: a genome-wide association study in the Chinese population. Front Genet 13:967684.",
      doi: "10.3389/fgene.2022.967684",
    },
  },
};

export default earlobes;

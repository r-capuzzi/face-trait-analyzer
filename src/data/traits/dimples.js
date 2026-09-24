// Dimples (self-reported: cheek dimples usually show only mid-smile, and
// both kinds are shallow dents that lighting easily hides). Claims checked
// against source abstracts / full text via Europe PMC and the GWAS Catalog
// (2026-09-24).
import { evolutionSources } from "../evolution";

const CHIN_POLYGENIC = {
  text: "Chin dimples are polygenic: the one large genetic study estimated about 57 DNA regions linked to them, each raising the odds only slightly. No genotype can be read from a chin.",
  cite: ["pickrell2016", "gwasChin"],
};

const CHEEK_UNKNOWN = {
  text: "Cheek dimples have no genetic study listed in the GWAS Catalog, the main registry of genome-wide studies, so there's nothing known that would let a genotype be read from them.",
  cite: ["gwasCatalog"],
};

const dimples = {
  id: "dimples",
  title: "Dimples",
  selfReport:
    "Cheek dimples usually appear only mid-smile, and lighting easily hides a shallow dent, so tell us yours.",

  history: [
    {
      evidence: "unknown",
      text: "Cheek dimples have no known evolutionary purpose. If they come from a split smile muscle, they're one of many harmless variations in the face's muscles: the same anatomy study found such variation to be common.",
      cite: ["pessa1998"],
    },
    {
      evidence: "strong",
      text: "The smile muscle is far older than our species: chimpanzees have nearly the same facial-expression muscles as humans, including a zygomaticus major with two layers.",
      cite: ["burrows2006"],
    },
    {
      evidence: "unknown",
      text: "Chin dimples sit on a feature that is itself a puzzle: the chin is unique to modern humans, and a century of explanations (speech, chewing, mate choice, or a side effect of the face shrinking back) hasn't produced a consensus.",
      cite: ["pampush2016"],
    },
  ],

  mechanism: [
    {
      text: "Cheek dimples may come from a variant smile muscle. In 50 dissected half-faces, 17 (34%) had a split zygomaticus major, the muscle that lifts the corner of the mouth. Its lower bundle was sometimes tethered to the skin, and the anatomists proposed that this tether pulls the skin into a dimple during a smile.",
      cite: ["pessa1998"],
    },
    {
      text: "Chin dimples (a cleft chin) were studied in about 71,000 23andMe customers who reported whether they have one, as one of 42 traits in a single analysis.",
      cite: ["pickrell2016"],
    },
    {
      text: "One of the chin-dimple regions lies near TBX15, a gene that also turned up for the folds and cartilage of the outer ear, a reminder that face-shape genes often act on several features at once.",
      cite: ["gwasChin", "adhikari2015"],
    },
  ],

  categories: {
    none: {
      label: "No dimples",
      summary: "No dimple in the cheeks or chin.",
      hint: {
        text: `${CHIN_POLYGENIC.text} ${CHEEK_UNKNOWN.text}`,
        cite: [...CHIN_POLYGENIC.cite, ...CHEEK_UNKNOWN.cite],
      },
    },
    cheek: {
      label: "Cheek dimples",
      summary: "One or two dents that show up in the cheeks when you smile.",
      hint: CHEEK_UNKNOWN,
    },
    chin: {
      label: "Chin dimple",
      summary: "A dent or short vertical line at the middle of the chin, also called a cleft chin.",
      hint: CHIN_POLYGENIC,
    },
    both: {
      label: "Cheek and chin dimples",
      summary: "Dimples in both places.",
      hint: {
        text: `${CHIN_POLYGENIC.text} ${CHEEK_UNKNOWN.text}`,
        cite: [...CHIN_POLYGENIC.cite, ...CHEEK_UNKNOWN.cite],
      },
    },
  },

  genes: [
    {
      symbol: "SHFM1 · GREM1 · CRB1 · EYA1 · BMP4",
      variant: "",
      role: "Genes reported near the five strongest chin-dimple signals.",
      effect: "Each variant changes the odds of a chin dimple only modestly (odds ratios of about 1.1 to 1.35 per copy).",
      cite: ["gwasChin"],
    },
    {
      symbol: "TBX15",
      variant: "rs1766786",
      role: "A key regulator of cartilage and skeletal development in mice.",
      effect: "Linked to chin dimples, and separately to the fold of the outer ear (the antihelix) and the size of the antitragus.",
      cite: ["gwasChin", "adhikari2015"],
    },
  ],

  myths: [
    {
      myth: "Dimples are a simple dominant trait: one gene, and a parent with dimples passes them on.",
      reality:
        "For chin dimples, the only large study points to dozens of DNA regions, not one gene. For cheek dimples, the GWAS Catalog lists no genome-wide study at all, so the classroom rule hasn't been tested at that scale.",
      cite: ["pickrell2016", "gwasCatalog"],
    },
  ],

  limitations: [
    "This card uses what you tell it, not your photo.",
    "A dent from an injury or cosmetic surgery isn't the trait studied here.",
    {
      text: "The chin-dimple study used self-reports from customers of European ancestry, and no repeat in an independent sample is listed yet.",
      cite: ["gwasChin"],
    },
  ],

  sources: {
    ...evolutionSources("pampush2016", "burrows2006"),
    pessa1998: {
      citation:
        "Pessa JE et al. (1998). Double or bifid zygomaticus major muscle: anatomy, incidence, and clinical correlation. Clin Anat 11:310–313.",
      doi: "10.1002/(SICI)1098-2353(1998)11:5<310::AID-CA3>3.0.CO;2-T",
    },
    pickrell2016: {
      citation:
        "Pickrell JK et al. (2016). Detection and interpretation of shared genetic influences on 42 human traits. Nat Genet 48:709–717.",
      doi: "10.1038/ng.3570",
    },
    gwasChin: {
      citation: "GWAS Catalog study GCST003989: chin dimples (from Pickrell et al. 2016), with its 46 listed associations.",
      doi: null,
      url: "https://www.ebi.ac.uk/gwas/studies/GCST003989",
      linkLabel: "catalog entry",
    },
    gwasCatalog: {
      citation:
        "NHGRI-EBI GWAS Catalog. Searched for cheek dimples on 2026-09-24: the only dimple study listed is for chin dimples.",
      doi: null,
      url: "https://www.ebi.ac.uk/gwas/search?query=dimples",
      linkLabel: "search",
    },
    adhikari2015: {
      citation:
        "Adhikari K et al. (2015). A genome-wide association study identifies multiple loci for variation in human ear morphology. Nat Commun 6:7500.",
      doi: "10.1038/ncomms8500",
    },
  },
};

export default dimples;

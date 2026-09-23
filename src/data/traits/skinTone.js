// Skin tone genetics content. Claims and numbers checked against each
// source's abstract via Europe PMC (2026-09-23).
//
// Deliberately no genotype hint per category: skin pigmentation is highly
// polygenic, and the app never maps a skin tone to a population.

const POLYGENIC_HINT = {
  text: "Skin color can't be traced back to a genotype. It is highly heritable but highly polygenic: roughly 15 genes had been directly linked to it, yet in some populations the known variants explain only a small fraction of the variation, and which genes matter differs from place to place.",
  cite: ["martin2017", "crawford2017"],
};

const band = (label, range, summary) => ({
  label: `${label} (ITA ${range})`,
  summary,
  hint: POLYGENIC_HINT,
});

const skinTone = {
  id: "skin",
  title: "Skin tone",

  mechanism: [
    {
      text: "Skin color mostly reflects how much melanin the skin's pigment cells make and how it is packaged. Lighter skin has fewer, smaller and less dense melanin-filled compartments (melanosomes).",
      cite: ["lamason2005"],
    },
    {
      text: "Why skin color varies: it tracks ultraviolet (UV) levels. Darker skin protects against UV damage and lighter skin makes vitamin D more easily where UV is weak. Skin color is a compromise between those two needs.",
      cite: ["jablonski2000"],
    },
    {
      text: "Skin color doesn't sort people into groups. It varies continuously, the same dark-pigmentation variants are shared by populations on different continents, and the genetic architecture of skin color differs from place to place.",
      cite: ["crawford2017", "martin2017"],
    },
  ],

  categories: {
    veryLight: band("Very light", "> 55°", "The lightest ITA category."),
    light: band("Light", "41–55°", "Light skin."),
    intermediate: band("Intermediate", "28–41°", "Between light and tan."),
    tan: band("Tan", "10–28°", "Tan skin."),
    brown: band("Brown", "−30–10°", "Brown skin."),
    dark: band("Dark", "< −30°", "The darkest ITA category."),
  },

  genes: [
    {
      symbol: "SLC24A5",
      variant: "a single amino-acid change",
      role: "An ion exchanger in the membrane of the pigment-making compartment (melanosome). The zebrafish \"golden\" mutant, which has pale stripes, is a broken version of this gene.",
      effect: "A key pigmentation gene: the variant correlates with lighter skin in genetically mixed populations.",
      cite: ["lamason2005"],
    },
    {
      symbol: "MFSD12 · DDB1/TMEM138",
      variant: "",
      role: "MFSD12 makes a lysosomal protein that affects melanin production in zebrafish and mice. Variants near DDB1/TMEM138 affect genes involved in the UV response.",
      effect: "Found in a study of diverse African genomes, where skin pigmentation varies widely.",
      cite: ["crawford2017"],
    },
    {
      symbol: "OCA2 · HERC2 · SLC45A2 · TYR · MC1R",
      variant: "",
      role: "Core pigmentation genes shared with eye and hair color.",
      effect: "HERC2/OCA2 variants are associated with skin pigmentation in African populations as well, and MC1R variants go with fair skin that tans poorly.",
      cite: ["crawford2017", "valverde1995"],
    },
    {
      symbol: "Forensic prediction",
      variant: "36 SNPs",
      role: "The HIrisPlex-S forensic test predicts a skin-color category from 36 DNA variants.",
      effect: "Even a rough category needs dozens of variants.",
      cite: ["chaitanya2018"],
    },
  ],

  myths: [
    {
      myth: "Your Fitzpatrick skin type (I–VI) is your skin color.",
      reality:
        "Fitzpatrick types are \"sun-reactive skin types\": they classify how skin burns and tans, not its color. ITA, used here, is a direct color measurement.",
      cite: ["fitzpatrick1988", "chardon1991"],
    },
    {
      myth: "Skin color is controlled by a few genes.",
      reality:
        "About 15 genes had been directly linked to it, which made it look simple, but a global survey showed skin pigmentation is far more polygenic than assumed.",
      cite: ["martin2017"],
    },
  ],

  limitations: [
    {
      text: "ITA was designed for a colorimeter pressed against skin under controlled light. From a photo, camera white balance, exposure and room lighting all shift the number, so treat the category as approximate.",
      cite: ["chardon1991", "delbino2006"],
    },
    {
      text: "Phone-camera ITA has matched a colorimeter only when photos were taken with the flash off and minimal ambient light, and that was in a small study of four people. Ordinary photos aren't taken that way, so this app never gives skin tone a \"high\" confidence. Bright studio or flash lighting tends to make skin read lighter.",
      cite: ["burrow2025"],
    },
    {
      text: "Faces are sun-exposed and often wear makeup. Tanning measurably shifts skin color in the L*a*b* space ITA is computed from, and foundation changes it too, so this reading reflects your face today, not your baseline skin.",
      cite: ["chardon1991"],
    },
    "The Monk swatch shows where the measurement sits on a 10-tone reference scale. It's for representation, not a medical or genetic category.",
  ],

  sources: {
    lamason2005: {
      citation:
        "Lamason RL et al. (2005). SLC24A5, a putative cation exchanger, affects pigmentation in zebrafish and humans. Science 310:1782–1786.",
      doi: "10.1126/science.1116238",
    },
    crawford2017: {
      citation:
        "Crawford NG et al. (2017). Loci associated with skin pigmentation identified in African populations. Science 358:eaan8433.",
      doi: "10.1126/science.aan8433",
    },
    martin2017: {
      citation:
        "Martin AR et al. (2017). An unexpectedly complex architecture for skin pigmentation in Africans. Cell 171:1340–1353.",
      doi: "10.1016/j.cell.2017.11.015",
    },
    jablonski2000: {
      citation: "Jablonski NG, Chaplin G (2000). The evolution of human skin coloration. J Hum Evol 39:57–106.",
      doi: "10.1006/jhev.2000.0403",
    },
    chaitanya2018: {
      citation:
        "Chaitanya L et al. (2018). The HIrisPlex-S system for eye, hair and skin colour prediction from DNA: introduction and forensic developmental validation. Forensic Sci Int Genet 35:123–135.",
      doi: "10.1016/j.fsigen.2018.04.004",
    },
    chardon1991: {
      citation:
        "Chardon A, Cretois I, Hourseau C (1991). Skin colour typology and suntanning pathways. Int J Cosmet Sci 13:191–208.",
      doi: "10.1111/j.1467-2494.1991.tb00561.x",
    },
    delbino2006: {
      citation:
        "Del Bino S et al. (2006). Relationship between skin response to ultraviolet exposure and skin color type. Pigment Cell Res 19:606–614.",
      doi: "10.1111/j.1600-0749.2006.00338.x",
    },
    fitzpatrick1988: {
      citation:
        "Fitzpatrick TB (1988). The validity and practicality of sun-reactive skin types I through VI. Arch Dermatol 124:869–871.",
      doi: "10.1001/archderm.124.6.869",
    },
    burrow2025: {
      citation:
        "Burrow JA et al. (2025). Smartphone tristimulus colorimetry for skin-tone analysis at common pulse oximetry anatomical sites. Biophotonics Discov 2:032504.",
      doi: "10.1117/1.bios.2.3.032504",
    },
    valverde1995: {
      citation:
        "Valverde P et al. (1995). Variants of the melanocyte-stimulating hormone receptor gene are associated with red hair and fair skin in humans. Nat Genet 11:328–330.",
      doi: "10.1038/ng1195-328",
    },
  },
};

export default skinTone;

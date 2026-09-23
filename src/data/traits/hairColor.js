// Hair color genetics content. Claims and numbers checked against each
// source's abstract or full text via Europe PMC (2026-09-23).

const hairColor = {
  id: "hair",
  title: "Hair color",

  mechanism: [
    {
      text: "Hair color comes from two kinds of melanin: black-brown eumelanin and red-yellow pheomelanin. The balance between them is controlled partly by a receptor called MC1R, which pushes pigment cells toward making eumelanin.",
      cite: ["valverde1995"],
    },
    {
      text: "Apart from red, natural hair color forms a continuum from black through dark and light brown to blonde, shaped by hundreds of genetic variants.",
      cite: ["morgan2018"],
    },
    {
      text: "One large study of almost 300,000 people found 124 regions of DNA linked to hair color. Together they explained 34.6% of the heritability of red hair, 24.8% of blond and 26.1% of black, so much of it is still unexplained.",
      cite: ["hysi2018"],
    },
  ],

  categories: {
    black: {
      label: "Black",
      summary: "Lots of eumelanin.",
      hint: {
        text: "Black hair is polygenic: no single variant explains it, so a genotype can't be read from it. It is the hair color DNA tests predict best (87.5% accuracy in the HIrisPlex study, compared with 69.5% for blond).",
        cite: ["walsh2013", "morgan2018"],
      },
    },
    brown: {
      label: "Brown",
      summary: "The middle of the black-to-blonde continuum.",
      hint: {
        text: "Brown sits in the middle of a continuum shaped by hundreds of variants, so there's no single gene to point to. The same pigmentation genes that shape eye and skin color (HERC2/OCA2, SLC45A2, TYR, IRF4 and others) all contribute.",
        cite: ["morgan2018", "adhikari2016"],
      },
    },
    blond: {
      label: "Blond",
      summary: "Less eumelanin.",
      hint: {
        text: "Blonde hair is linked to over 200 genetic variants. One of the best understood is rs12821256 near the KITLG gene: it weakens a genetic switch that boosts KITLG in hair follicles, and mice engineered with the human version grow lighter hair. It is one contributor among many, not \"the blond gene\".",
        cite: ["morgan2018", "guenther2014"],
      },
    },
    red: {
      label: "Red / auburn",
      summary: "Pheomelanin dominates.",
      hint: {
        text: "Red hair points strongly to MC1R: variants in it were found in over 80% of people with red hair, but in fewer than 20% of people with brown or black hair. Variants such as R151C, R160W and D294H are the classic ones. MC1R is necessary but not always sufficient: most people who carry two MC1R variants actually have blonde or light brown hair.",
        cite: ["valverde1995", "box1997", "morgan2018"],
      },
    },
    gray: {
      label: "Gray / white",
      summary: "Hairs growing with little or no pigment.",
      hint: {
        text: "Graying is mostly about age, not inheritance: its heritability (0.27) was the lowest of any hair trait in one large study. The first gene found to be linked to graying is IRF4, through the variant rs12203592.",
        cite: ["adhikari2016"],
      },
    },
  },

  genes: [
    {
      symbol: "MC1R",
      variant: "R151C, R160W, D294H, among others",
      role: "A receptor on pigment cells. When it works fully, cells make black-brown eumelanin; weakened versions shift production toward red-yellow pheomelanin.",
      effect: "The main genetic cause of red hair, though with variable effect. It explains 73% of the SNP heritability of red hair in UK Biobank, and other genes bring that to about 90%.",
      cite: ["valverde1995", "box1997", "morgan2018"],
    },
    {
      symbol: "KITLG",
      variant: "rs12821256",
      role: "A growth factor for pigment cells. The variant sits in an enhancer active in developing hair follicles and weakens it.",
      effect: "Associated with classic blond hair in the northern Europeans studied, and confirmed in mice carrying the human sequence.",
      cite: ["guenther2014"],
    },
    {
      symbol: "IRF4",
      variant: "rs12203592",
      role: "A transcription factor that works with the pigment master-regulator MITF to switch on tyrosinase, the key enzyme in melanin production.",
      effect: "Linked to hair color, freckling, sun sensitivity and eye color, and the first gene found to be linked to graying.",
      cite: ["praetorius2013", "adhikari2016"],
    },
    {
      symbol: "HERC2/OCA2 · SLC45A2 · TYR · SLC24A5",
      variant: "",
      role: "Core pigmentation genes shared with eye and skin color.",
      effect: "All showed genome-wide significant association with hair color in a study of over 6,000 Latin Americans.",
      cite: ["adhikari2016"],
    },
  ],

  myths: [
    {
      myth: "Red hair comes from one gene, so two carriers always have red-haired kids.",
      reality:
        "MC1R is the main factor, but it is \"necessary but not always sufficient\". Twins with the same MC1R variants can differ in hair color, and most people with two MC1R variants aren't red-haired at all.",
      cite: ["box1997", "morgan2018"],
    },
  ],

  limitations: [
    {
      text: "Photos are a rough way to measure hair color. In one study, photo measurements only moderately matched a lab spectrophotometer (r = 0.51–0.63) and read hair much lighter on average, so this app never gives hair color a \"high\" confidence.",
      cite: ["vaughn2009"],
    },
    "Dyed, highlighted or sun-lightened hair is measured as it looks. Use \"Correct it\" to read about your natural color.",
    "Shine and shadow between strands are trimmed off, but strong backlighting can still make dark hair read lighter.",
  ],

  sources: {
    valverde1995: {
      citation:
        "Valverde P et al. (1995). Variants of the melanocyte-stimulating hormone receptor gene are associated with red hair and fair skin in humans. Nat Genet 11:328–330.",
      doi: "10.1038/ng1195-328",
    },
    box1997: {
      citation:
        "Box NF et al. (1997). Characterization of melanocyte stimulating hormone receptor variant alleles in twins with red hair. Hum Mol Genet 6:1891–1897.",
      doi: "10.1093/hmg/6.11.1891",
    },
    morgan2018: {
      citation:
        "Morgan MD et al. (2018). Genome-wide study of hair colour in UK Biobank explains most of the SNP heritability. Nat Commun 9:5271.",
      doi: "10.1038/s41467-018-07691-z",
    },
    hysi2018: {
      citation:
        "Hysi PG et al. (2018). Genome-wide association meta-analysis of individuals of European ancestry identifies new loci explaining a substantial fraction of hair color variation and heritability. Nat Genet 50:652–656.",
      doi: "10.1038/s41588-018-0100-5",
    },
    guenther2014: {
      citation:
        "Guenther CA et al. (2014). A molecular basis for classic blond hair color in Europeans. Nat Genet 46:748–752.",
      doi: "10.1038/ng.2991",
    },
    walsh2013: {
      citation:
        "Walsh S et al. (2013). The HIrisPlex system for simultaneous prediction of hair and eye colour from DNA. Forensic Sci Int Genet 7:98–115.",
      doi: "10.1016/j.fsigen.2012.07.005",
    },
    adhikari2016: {
      citation:
        "Adhikari K et al. (2016). A genome-wide association scan in admixed Latin Americans identifies loci influencing facial and scalp hair features. Nat Commun 7:10815.",
      doi: "10.1038/ncomms10815",
    },
    praetorius2013: {
      citation:
        "Praetorius C et al. (2013). A polymorphism in IRF4 affects human pigmentation through a tyrosinase-dependent MITF/TFAP2A pathway. Cell 155:1022–1033.",
      doi: "10.1016/j.cell.2013.10.022",
    },
    vaughn2009: {
      citation:
        "Vaughn MR, van Oorschot RA, Baindur-Hudson S (2009). A comparison of hair colour measurement by digital image analysis with reflective spectrophotometry. Forensic Sci Int 183:97–101.",
      doi: "10.1016/j.forsciint.2008.11.002",
    },
  },
};

export default hairColor;

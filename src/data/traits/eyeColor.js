// Eye color genetics content. Every claim cites a source in `sources`, and
// every number was checked against that paper's abstract (2026-09-23).
// Keep wording hedged where the science is: this is education, not a test.

const eyeColor = {
  id: "eye",
  title: "Eye color",

  mechanism: [
    {
      text: "Eye color comes from how much melanin pigment is in the iris.",
      cite: ["sturmLarsson2009"],
    },
    {
      text: "There is no blue pigment. An iris with very little melanin looks blue because of how light scatters inside it, the same kind of scattering that makes the sky look blue.",
      cite: ["wollstein2017"],
    },
    {
      text: "More melanin shifts the color through green and hazel to brown. Green and hazel irises mix unpigmented areas with yellowish-brown pigment.",
      cite: ["wollstein2017"],
    },
  ],

  categories: {
    blue: {
      label: "Blue / gray",
      summary: "Little melanin in the iris; the color is scattered light.",
      hint: {
        text: "This strongly suggests two copies of the \"blue\" version (G) of the variant rs12913832 near the HERC2 gene. In one study, people with that genotype (GG) scored 0.99 on average on a scale where +1 is a fully blue iris. It's the most likely genotype, not a certainty: other genes, such as an OCA2 variant, can modify it.",
        cite: ["andersen2013", "sturm2008"],
      },
    },
    intermediate: {
      label: "Green / hazel",
      summary: "A mix of unpigmented and pigmented areas.",
      hint: {
        text: "Green and hazel are the hardest eye colors to predict, even from DNA: accuracy (AUC) was 0.74, compared with 0.92 for blue and 0.93 for brown. People with one copy of each rs12913832 version (GA) show a wide range of eye colors, so a genotype can't be read from this color.",
        cite: ["liu2010", "andersen2013"],
      },
    },
    brown: {
      label: "Brown",
      summary: "Plenty of melanin in the iris.",
      hint: {
        text: "Brown usually means at least one copy of the \"brown\" version (A) of rs12913832, but a photo can't tell one copy from two: both genotypes average strongly brown (-0.71 for GA and -0.87 for AA on the same -1 to +1 scale).",
        cite: ["andersen2013"],
      },
    },
  },

  genes: [
    {
      symbol: "HERC2",
      variant: "rs12913832",
      role: "The variant sits inside HERC2 but acts as an enhancer (a genetic switch) for its neighbor OCA2. The brown version helps the DNA fold into a loop that turns OCA2 up; the blue version weakens that loop, so iris cells make less melanin.",
      effect: "The biggest single factor. On its own it predicted blue vs. brown better than any other variant tested (R² = 0.68, in samples of up to 3,000 Europeans), and it accounted for 45–48% of the variation in measured iris hue and saturation in a separate photo-based study.",
      note: "Papers write this variant's letters as G/A or as C/T. Those are the same variant read from the two strands of the DNA: blue is G (or C), brown is A (or T).",
      cite: ["visser2012", "sturm2008", "liu2010", "eiberg2008"],
    },
    {
      symbol: "OCA2",
      variant: "rs1800407",
      role: "Makes a protein that pigment cells need to produce melanin. HERC2's switch controls how much of it is made.",
      effect: "A \"penetrance modifier\": it can shift the eye color that rs12913832 would otherwise predict.",
      cite: ["sturm2008", "white2011"],
    },
    {
      symbol: "SLC24A4 · TYR · SLC45A2 · IRF4",
      variant: "rs12896399 · rs1393350 · rs16891982 · rs12203592",
      role: "Other pigmentation genes with smaller effects on eye color.",
      effect: "Together with the two above, these make up the six-SNP IrisPlex forensic test.",
      cite: ["walsh2011", "andersen2013"],
    },
  ],

  myths: [
    {
      myth: "Brown is dominant and blue is recessive, so two blue-eyed parents can't have a brown-eyed child.",
      reality:
        "The simple dominant/recessive model is \"too simplistic\". Eye color is polygenic, with interacting genes (epistasis) and incomplete dominance, so unexpected combinations are rare but possible.",
      cite: ["sturmLarsson2009", "white2011"],
    },
  ],

  limitations: [
    "Photo colors depend on the light and the camera. Warm indoor light can make blue eyes read greener, and dim light can make any eye read darker.",
    "Colored contact lenses are measured as they look. Use \"Correct it\" if that applies.",
    {
      text: "Real iris color is continuous: measured in CIELAB color coordinates, irises show variation that categories like \"brown\", \"blue\" and \"green\" miss. The three categories here are a simplification.",
      cite: ["edwards2016"],
    },
  ],

  heterochromia:
    "Your two eyes measured quite differently. That can be real heterochromia or just uneven lighting, such as one side of your face nearer a window. Retake the photo facing the light to check. If one eye's color has changed recently, mention it to an eye doctor.",

  sources: {
    eiberg2008: {
      citation:
        "Eiberg H et al. (2008). Blue eye color in humans may be caused by a perfectly associated founder mutation in a regulatory element located within the HERC2 gene inhibiting OCA2 expression. Hum Genet 123:177–187.",
      doi: "10.1007/s00439-007-0460-x",
    },
    sturm2008: {
      citation:
        "Sturm RA et al. (2008). A single SNP in an evolutionary conserved region within intron 86 of the HERC2 gene determines human blue-brown eye color. Am J Hum Genet 82:424–431.",
      doi: "10.1016/j.ajhg.2007.11.005",
    },
    visser2012: {
      citation:
        "Visser M, Kayser M, Palstra RJ (2012). HERC2 rs12913832 modulates human pigmentation by attenuating chromatin-loop formation between a long-range enhancer and the OCA2 promoter. Genome Res 22:446–455.",
      doi: "10.1101/gr.128652.111",
    },
    walsh2011: {
      citation:
        "Walsh S et al. (2011). IrisPlex: a sensitive DNA tool for accurate prediction of blue and brown eye colour in the absence of ancestry information. Forensic Sci Int Genet 5:170–180.",
      doi: "10.1016/j.fsigen.2010.02.004",
    },
    liu2010: {
      citation:
        "Liu F et al. (2010). Digital quantification of human eye color highlights genetic association of three new loci. PLoS Genet 6:e1000934.",
      doi: "10.1371/journal.pgen.1000934",
    },
    andersen2013: {
      citation:
        "Andersen JD et al. (2013). Genetic analyses of the human eye colours using a novel objective method for eye colour classification. Forensic Sci Int Genet 7:508–515.",
      doi: "10.1016/j.fsigen.2013.05.003",
    },
    wollstein2017: {
      citation:
        "Wollstein A et al. (2017). Novel quantitative pigmentation phenotyping enhances genetic association, epistasis, and prediction of human eye colour. Sci Rep 7:43359.",
      doi: "10.1038/srep43359",
    },
    sturmLarsson2009: {
      citation:
        "Sturm RA, Larsson M (2009). Genetics of human iris colour and patterns. Pigment Cell Melanoma Res 22:544–562.",
      doi: "10.1111/j.1755-148x.2009.00606.x",
    },
    white2011: {
      citation:
        "White D, Rabago-Smith M (2011). Genotype–phenotype associations and human eye color. J Hum Genet 56:5–7.",
      doi: "10.1038/jhg.2010.126",
    },
    edwards2016: {
      citation:
        "Edwards M et al. (2016). Iris pigmentation as a quantitative trait: variation in populations of European, East Asian and South Asian ancestry and association with candidate gene polymorphisms. Pigment Cell Melanoma Res 29:141–162.",
      doi: "10.1111/pcmr.12435",
    },
  },
};

export default eyeColor;

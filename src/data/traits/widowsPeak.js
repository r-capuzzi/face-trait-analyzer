// Widow's peak (self-reported: the hair model's mask is 256×256, far too
// coarse to trace the V at the center of a hairline). Claims checked against
// the source's full text via Europe PMC (2026-09-24).

const WEAK_PREDICTOR = {
  text: "A DNA score built from that study predicted widow's peak only a little better than a coin toss (AUC 0.56–0.60, where 0.5 is chance), so no genotype can be read from a hairline.",
  cite: ["wang2022"],
};

const widowsPeak = {
  id: "peak",
  title: "Widow's peak",
  selfReport:
    "The hair outline this app uses is too coarse to trace the small V at the center of a hairline, so tell us yours.",

  mechanism: [
    {
      text: "A widow's peak is a V-shaped point where the hairline dips down at the center of the forehead.",
      cite: [],
    },
    {
      text: "It's long been described as inherited, yet the first genome-wide study of it appeared only in 2022. In 11,946 people in China who described their own hairline, it found two DNA regions: one near the RNA genes GMDS-AS1 and LINC01600, one near SPRED2.",
      cite: ["wang2022"],
    },
    {
      text: "In the same study, common DNA variants together accounted for about 30% of the variation in widow's peak (SNP heritability 0.30).",
      cite: ["wang2022"],
    },
  ],

  categories: {
    yes: {
      label: "Widow's peak",
      summary: "The hairline dips to a V at the center of the forehead.",
      hint: WEAK_PREDICTOR,
    },
    no: {
      label: "No widow's peak",
      summary: "The hairline runs straight or curves evenly across the forehead.",
      hint: WEAK_PREDICTOR,
    },
  },

  genes: [
    {
      symbol: "GMDS-AS1",
      variant: "rs4959669",
      role: "An RNA gene; the study's authors say more work is needed to find out how it could shape the hairline.",
      effect: "The strongest signal for widow's peak.",
      cite: ["wang2022"],
    },
    {
      symbol: "SPRED2",
      variant: "rs13423753",
      role: "The gene nearest the study's second signal.",
      effect: "A second, independent region linked to widow's peak.",
      cite: ["wang2022"],
    },
  ],

  myths: [
    {
      myth: "Widow's peak is a simple dominant trait.",
      reality:
        "It's widely called inherited, but no genome-wide results for it were published until 2022. That first study points to more than one DNA region and predicts poorly, not the pattern a single dominant gene would give.",
      cite: ["wang2022"],
    },
  ],

  limitations: [
    "This card uses what you tell it, not your photo.",
    {
      text: "The only genetic study so far used self-reports from one population and hasn't been repeated elsewhere.",
      cite: ["wang2022"],
    },
    {
      text: "Hairlines change shape with age, from childhood into adulthood, so the one you have now may not be the one you started with.",
      cite: ["rassman2013"],
    },
  ],

  sources: {
    rassman2013: {
      citation: "Rassman WR, Pak JP, Kim J (2013). Phenotype of normal hairline maturation. Facial Plast Surg Clin North Am 21:317–324.",
      doi: "10.1016/j.fsc.2013.04.001",
    },
    wang2022: {
      citation:
        "Wang P et al. (2022). Novel genetic associations with five aesthetic facial traits: a genome-wide association study in the Chinese population. Front Genet 13:967684.",
      doi: "10.3389/fgene.2022.967684",
    },
  },
};

export default widowsPeak;

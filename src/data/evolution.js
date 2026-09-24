// Sources for the "Why it evolved" sections, shared across cards. Each was
// checked against its abstract (and full text where noted in the cards) via
// Europe PMC, OpenAlex and Crossref (2026-09-24).
//
// Evidence levels, from the strength of the evidence for the explanation -
// not how interesting it is. Evolutionary explanations range from measured
// (skin color tracks UV) to untested stories, and saying which is which is
// the point of the section.
export const EVIDENCE = {
  strong: "Well supported",
  leading: "Leading explanation",
  hypothesis: "Hypothesis",
  unknown: "Unknown",
};

export const EVOLUTION_SOURCES = {
  jablonski2010: {
    citation:
      "Jablonski NG, Chaplin G (2010). Human skin pigmentation as an adaptation to UV radiation. Proc Natl Acad Sci USA 107 Suppl 2:8962–8968.",
    doi: "10.1073/pnas.0914628107",
  },
  norton2007: {
    citation:
      "Norton HL et al. (2007). Genetic evidence for the convergent evolution of light skin in Europeans and East Asians. Mol Biol Evol 24:710–722.",
    doi: "10.1093/molbev/msl203",
  },
  mathieson2015: {
    citation: "Mathieson I et al. (2015). Genome-wide patterns of selection in 230 ancient Eurasians. Nature 528:499–503.",
    doi: "10.1038/nature16152",
  },
  wilde2014: {
    citation:
      "Wilde S et al. (2014). Direct evidence for positive selection of skin, hair, and eye pigmentation in Europeans during the last 5,000 y. Proc Natl Acad Sci USA 111:4832–4837.",
    doi: "10.1073/pnas.1316513111",
  },
  harding2000: {
    citation: "Harding RM et al. (2000). Evidence for variable selective pressures at MC1R. Am J Hum Genet 66:1351–1361.",
    doi: "10.1086/302863",
  },
  kenny2012: {
    citation: "Kenny EE et al. (2012). Melanesian blond hair is caused by an amino acid change in TYRP1. Science 336:554.",
    doi: "10.1126/science.1217849",
  },
  lasisi2023: {
    citation:
      "Lasisi T et al. (2023). Human scalp hair as a thermoregulatory adaptation. Proc Natl Acad Sci USA 120:e2301760120.",
    doi: "10.1073/pnas.2301760120",
  },
  kamberov2013: {
    citation:
      "Kamberov YG et al. (2013). Modeling recent human evolution in mice by expression of a selected EDAR variant. Cell 152:691–702.",
    doi: "10.1016/j.cell.2013.01.016",
  },
  hlusko2018: {
    citation:
      "Hlusko LJ et al. (2018). Environmental selection during the last ice age on the mother-to-infant transmission of vitamin D and fatty acids through breast milk. Proc Natl Acad Sci USA 115:E4426–E4432.",
    doi: "10.1073/pnas.1711788115",
  },
  pampush2016: {
    citation: "Pampush JD, Daegling DJ (2016). The enduring puzzle of the human chin. Evol Anthropol 25:20–35.",
    doi: "10.1002/evan.21471",
  },
  roseman2004: {
    citation:
      "Roseman CC (2004). Detecting interregionally diversifying natural selection on modern human cranial form by using matched molecular and morphometric data. Proc Natl Acad Sci USA 101:12824–12829.",
    doi: "10.1073/pnas.0402637101",
  },
  cramon2011: {
    citation:
      "von Cramon-Taubadel N (2011). Global human mandibular variation reflects differences in agricultural and hunter-gatherer subsistence strategies. Proc Natl Acad Sci USA 108:19546–19551.",
    doi: "10.1073/pnas.1113050108",
  },
  noback2011: {
    citation:
      "Noback ML, Harvati K, Spoor F (2011). Climate-related variation of the human nasal cavity. Am J Phys Anthropol 145:599–614.",
    doi: "10.1002/ajpa.21523",
  },
  godinho2018: {
    citation:
      "Godinho RM, Spikins P, O'Higgins P (2018). Supraorbital morphology and social dynamics in human evolution. Nat Ecol Evol 2:956–961.",
    doi: "10.1038/s41559-018-0528-0",
  },
  sadr2003: {
    citation: "Sadr J, Jarudi I, Sinha P (2003). The role of eyebrows in face recognition. Perception 32:285–293.",
    doi: "10.1068/p5027",
  },
  kobayashi2001: {
    citation:
      "Kobayashi H, Kohshima S (2001). Unique morphology of the human eye and its adaptive meaning: comparative studies on external morphology of the primate eye. J Hum Evol 40:419–435.",
    doi: "10.1006/jhev.2001.0468",
  },
  pereagarcia2025: {
    citation:
      "Perea-García JO, Teuben A, Caspar KR (2025). Look past the cooperative eye hypothesis: reconsidering the evolution of human eye appearance. Biol Rev 100:2038–2054.",
    doi: "10.1111/brv.70033",
  },
  dixson2012: {
    citation:
      "Dixson BJW, Vasey PL (2012). Beards augment perceptions of men's age, social status, and aggressiveness, but not attractiveness. Behav Ecol 23:481–490.",
    doi: "10.1093/beheco/arr214",
  },
  rotenstreich2025: {
    citation:
      "Rotenstreich L et al. (2025). Patterns of interspecific variation in labial microarchitecture among anthropoid primates and the evolution of the hominin lips. Anat Rec (online ahead of print).",
    doi: "10.1002/ar.70103",
  },
};

// A card's own subset, so its numbered source list holds only what it cites.
export const evolutionSources = (...keys) => Object.fromEntries(keys.map((k) => [k, EVOLUTION_SOURCES[k]]));

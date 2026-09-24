// Sources and background shared by the face-shape cards. Each claim was
// checked against its source's abstract via Europe PMC (2026-09-23).
import { evolutionSources } from "../evolution";

export const FACE_MECHANISM = [
  {
    text: "Most of the face forms in the embryo from cranial neural crest cells. The DNA regions linked to facial shape are enriched in genetic switches (enhancers) that are active in exactly those cells.",
    cite: ["claes2018", "white2021"],
  },
  {
    text: "Facial measurements are moderately to strongly heritable: 28–67% in one family study. Horizontal measurements such as widths were slightly more heritable than vertical ones.",
    cite: ["cole2017"],
  },
  {
    text: "Face shape is highly polygenic. A study of 8,246 people found 203 genetic signals linked to normal facial variation, and some DNA regions affect several parts of the face at once.",
    cite: ["white2021"],
  },
];

export const FACE_SOURCES = {
  ...evolutionSources("roseman2004", "cramon2011", "pampush2016", "godinho2018", "kobayashi2001", "pereagarcia2025", "sadr2003", "noback2011", "rotenstreich2025", "dixson2012", "kamberov2013", "burrows2006", "lacruz2019", "zink2016", "franciscus1988", "dhawan2023", "hillmer2009", "parisi2012", "pearce2012", "pearce2013", "wroe2018", "cieri2014"),
  claes2018: {
    citation:
      "Claes P et al. (2018). Genome-wide mapping of global-to-local genetic effects on human facial shape. Nat Genet 50:414–423.",
    doi: "10.1038/s41588-018-0057-4",
  },
  white2021: {
    citation: "White JD et al. (2021). Insights into the genetic architecture of the human face. Nat Genet 53:45–53.",
    doi: "10.1038/s41588-020-00741-7",
  },
  cole2017: {
    citation:
      "Cole JB et al. (2017). Human facial shape and size heritability and genetic correlations. Genetics 205:967–978.",
    doi: "10.1534/genetics.116.193185",
  },
  cha2018: {
    citation:
      "Cha S et al. (2018). Identification of five novel genetic loci related to facial morphology by genome-wide association studies. BMC Genomics 19:481.",
    doi: "10.1186/s12864-018-4865-9",
  },
  adhikari2016face: {
    citation:
      "Adhikari K et al. (2016). A genome-wide association scan implicates DCHS2, RUNX2, GLI3, PAX1 and EDAR in human facial variation. Nat Commun 7:11616.",
    doi: "10.1038/ncomms11616",
  },
  adhikari2016hair: {
    citation:
      "Adhikari K et al. (2016). A genome-wide association scan in admixed Latin Americans identifies loci influencing facial and scalp hair features. Nat Commun 7:10815.",
    doi: "10.1038/ncomms10815",
  },
  farkas1985: {
    citation:
      "Farkas LG, Hreczko TA, Kolar JC (1985). Vertical and horizontal proportions of the face in young adult North American Caucasians: revision of neoclassical canons. Plast Reconstr Surg 75:328–338.",
    doi: "10.1097/00006534-198503000-00005",
  },
  ward2018: {
    citation:
      "Ward B, Ward M, Fried O, Paskhover B (2018). Nasal distortion in short-distance photographs: the selfie effect. JAMA Facial Plast Surg 20:333–335.",
    doi: "10.1001/jamafacial.2018.0009",
  },
  zaidi2017: {
    citation:
      "Zaidi AA et al. (2017). Investigating the case of human nose shape and climate adaptation. PLoS Genet 13:e1006616.",
    doi: "10.1371/journal.pgen.1006616",
  },
  beiraghi2016: {
    citation:
      "Beiraghi-Toosi A, Rezaei E, Zanjani E (2016). Relationship between hyperactivity of depressor septi nasi muscle and changes of alar base and flaring during smile. World J Plast Surg 5:45–50.",
    doi: null,
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4904138/",
  },
  hillmer2005: {
    citation:
      "Hillmer AM et al. (2005). Genetic variation in the human androgen receptor gene is the major determinant of common early-onset androgenetic alopecia. Am J Hum Genet 77:140–148.",
    doi: "10.1086/431425",
  },
  heilmann2017: {
    citation:
      "Heilmann-Heimbach S et al. (2017). Meta-analysis identifies novel risk loci and yields systematic insights into the biology of male-pattern baldness. Nat Commun 8:14694.",
    doi: "10.1038/ncomms14694",
  },
  chen2023: {
    citation:
      "Chen Y et al. (2023). Genetic prediction of male pattern baldness based on large independent datasets. Eur J Hum Genet 31:321–328.",
    doi: "10.1038/s41431-022-01201-y",
  },
  bonfante2021: {
    citation:
      "Bonfante B et al. (2021). A GWAS in Latin Americans identifies novel face shape loci, implicating VPS13B and a Denisovan introgressed region in facial variation. Sci Adv 7:eabc6160.",
    doi: "10.1126/sciadv.abc6160",
  },
};

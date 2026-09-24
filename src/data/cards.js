// Which content goes with which part of the analysis result, shared by the
// page (App.jsx) and the plain-text summary (lib/summary.js) so the two can
// never list different cards.
import eyeColor from "./traits/eyeColor";
import hairColor from "./traits/hairColor";
import skinTone from "./traits/skinTone";
import faceProportions from "./shape/faceProportions";
import hairline from "./shape/hairline";
import eyeShape from "./shape/eyeShape";
import eyebrows from "./shape/eyebrows";
import noseShape from "./shape/noseShape";
import lipShape from "./shape/lipShape";
import facialHair from "./shape/facialHair";
import hairTexture from "./traits/hairTexture";
import widowsPeak from "./traits/widowsPeak";
import freckles from "./traits/freckles";
import dimples from "./traits/dimples";
import earlobes from "./traits/earlobes";

// Color traits: key in result.traits -> content.
export const COLOR_CARDS = [
  { key: "eye", content: eyeColor },
  { key: "hair", content: hairColor },
  { key: "skin", content: skinTone },
];

// Face-shape cards: content + where its measurements live in the result.
const shapePart = (name) => (t) => (t.shape.status === "ok" ? t.shape[name] : t.shape);
export const SHAPE_CARDS = [
  { content: faceProportions, part: shapePart("face") },
  { content: hairline, part: (t) => t.hairline },
  { content: eyeShape, part: shapePart("eyes") },
  { content: eyebrows, part: (t) => t.brows },
  { content: noseShape, part: shapePart("nose") },
  { content: lipShape, part: shapePart("lips") },
  { content: facialHair, part: (t) => t.beard },
];

// Traits a photo can't measure reliably: the visitor picks theirs.
export const SELF_REPORTED = [hairTexture, widowsPeak, freckles, dimples, earlobes];

// Monk Skin Tone (MST) Scale: 10 reference tones developed by Dr. Ellis
// Monk with Google. Licensed CC BY 4.0 - https://skintone.google
// Used here only to SHOW where a measurement falls on an inclusive,
// widely used reference; it is not a medical or genetic scale.
export const MONK_SCALE = [
  "#f6ede4",
  "#f3e7db",
  "#f7ead0",
  "#eadaba",
  "#d7bd96",
  "#a07e56",
  "#825c43",
  "#604134",
  "#3a312a",
  "#292420",
].map((hex, i) => ({ tone: i + 1, hex }));

export const MONK_ATTRIBUTION =
  "Monk Skin Tone Scale by Dr. Ellis Monk and Google, licensed CC BY 4.0 (skintone.google).";

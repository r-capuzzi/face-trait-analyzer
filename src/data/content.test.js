// Every card's claims point at numbered sources. These checks keep the
// numbering honest as content grows: no citation to a source that isn't
// listed (it would render as "[undefined]"), no listed source that nothing
// cites, and every source links somewhere a reader can check it.
import { citationOrder } from "../components/Cite";
import eyeColor from "./traits/eyeColor";
import hairColor from "./traits/hairColor";
import skinTone from "./traits/skinTone";
import hairTexture from "./traits/hairTexture";
import freckles from "./traits/freckles";
import widowsPeak from "./traits/widowsPeak";
import dimples from "./traits/dimples";
import earlobes from "./traits/earlobes";
import faceProportions from "./shape/faceProportions";
import hairline from "./shape/hairline";
import eyeShape from "./shape/eyeShape";
import eyebrows from "./shape/eyebrows";
import noseShape from "./shape/noseShape";
import lipShape from "./shape/lipShape";
import facialHair from "./shape/facialHair";

const ALL = [
  eyeColor, hairColor, skinTone, hairTexture, freckles, widowsPeak, dimples, earlobes,
  faceProportions, hairline, eyeShape, eyebrows, noseShape, lipShape, facialHair,
];

describe.each(ALL.map((c) => [c.id, c]))("%s content", (_id, content) => {
  const cited = [...citationOrder(content).keys()];

  test("every citation points at a listed source", () => {
    expect(cited.filter((k) => !(k in content.sources))).toEqual([]);
  });

  test("every source it lists is cited somewhere", () => {
    // shape cards share one source list (FACE_SOURCES), so only the
    // standalone cards must use every source they carry
    if (content.measures) return;
    expect(Object.keys(content.sources).filter((k) => !cited.includes(k))).toEqual([]);
  });

  test("every source a reader can open", () => {
    for (const k of cited) {
      const src = content.sources[k];
      expect(Boolean(src.doi || src.url), k).toBe(true);
    }
  });
});

test("card ids are unique (they namespace the source anchors)", () => {
  const ids = ALL.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
});

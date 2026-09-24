// Every card's claims point at numbered sources. These checks keep the
// numbering honest as content grows: no citation to a source that isn't
// listed (it would render as "[undefined]"), no listed source that nothing
// cites, and every source links somewhere a reader can check it.
import { citationOrder } from "../components/Cite";
import { EVIDENCE } from "./evolution";
import { FACE_SOURCES } from "./shape/common";
import timeline from "./timeline";
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

  test("has a 'Why it evolved' section, every point labeled with a known evidence level", () => {
    expect(content.history?.length).toBeGreaterThan(0);
    for (const h of content.history) {
      expect(Object.keys(EVIDENCE)).toContain(h.evidence);
      expect(h.text.length).toBeGreaterThan(40);
    }
  });

  test("every source a reader can open", () => {
    for (const k of cited) {
      const src = content.sources[k];
      expect(Boolean(src.doi || src.url), k).toBe(true);
    }
  });
});

test("every shared face-shape source is cited by at least one shape card", () => {
  const cited = new Set(ALL.filter((c) => c.measures).flatMap((c) => [...citationOrder(c).keys()]));
  expect(Object.keys(FACE_SOURCES).filter((k) => !cited.has(k))).toEqual([]);
});

test("card ids are unique (they namespace the source anchors)", () => {
  const ids = ALL.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
});

describe("timeline (section 04)", () => {
  const cited = [...citationOrder(timeline).keys()];

  test("citations resolve, and every listed source is cited", () => {
    expect(cited.filter((k) => !(k in timeline.sources))).toEqual([]);
    expect(Object.keys(timeline.sources).filter((k) => !cited.includes(k))).toEqual([]);
  });

  test("every event has a valid evidence label and links to real cards", () => {
    // heading ids as the cards render them: color and self-report cards are
    // "trait-<id>", shape cards (the ones with measures) "shape-<id>"
    const ids = ALL.map((c) => (c.measures ? `shape-${c.id}` : `trait-${c.id}`));
    for (const e of timeline.events) {
      expect(Object.keys(EVIDENCE)).toContain(e.evidence);
      expect(e.cards.length).toBeGreaterThan(0);
      for (const [id] of e.cards) expect(ids).toContain(id);
    }
  });

  test("events run oldest first where they give numeric dates", () => {
    const years = (w) => {
      const m = w.match(/([\d,.]+)\s*(million)?/);
      return m ? Number(m[1].replace(/,/g, "")) * (m[2] ? 1e6 : 1) : null;
    };
    const dated = timeline.events.map((e) => years(e.when)).filter((y) => y !== null);
    expect(dated).toEqual([...dated].sort((a, b) => b - a));
  });
});

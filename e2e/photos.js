// The real photos the end-to-end tests analyze, and what a person looking
// at each one sees. Faces never go into git (test-photos/ is ignored), so a
// missing photo is fetched from its public source by global-setup.js:
// MediaPipe's sample bucket, or Wikimedia Commons (openly licensed; the
// source page, license and author are listed with each photo).
//
// Expectations are sets of acceptable answers, written from looking at each
// photo - not copied from the app's output - so a regression that makes the
// app confidently wrong fails, while an honest hedge passes:
//  - every category the app offers must be in the trait's list;
//  - `mustInclude`: a hedge must still contain the right answer;
//  - "unmeasurable": the trait is hidden (a headscarf) and must say so.
// Skin tone from an uncalibrated photo is loose (exposure moves it by a
// category or two), so its lists are a category wide either way.
//
// `knownIssues` names traits the app still gets wrong on this photo, with
// why. The test requires exactly those to fail: a fix, or a new mistake,
// both show up as a failure until this list is updated.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const PHOTO_DIR = fileURLToPath(new URL("../test-photos/", import.meta.url));
const BUCKET = "https://storage.googleapis.com/mediapipe-assets/";
const COMMONS = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";

export const PHOTOS = {
  // studio portrait, older man: dark brown eyes, graying salt-and-pepper
  // hair, light skin; small in frame (iris ~8 px), squinting slightly
  portrait: {
    file: "portrait.jpg",
    expect: { eye: ["brown"], hair: ["gray"], skin: ["very light", "light", "intermediate"] },
  },
  // bright, high-key studio photo: brown eyes, black hair, very light skin
  business: {
    file: "business-person.png",
    expect: { eye: ["brown"], hair: ["black"], skin: ["very light", "light"] },
  },
  // 256 px face: gray-green hazel eyes with a brown center, chestnut-brown
  // hair (it measures right at the black/brown lightness boundary)
  stylizer: {
    file: "face_stylizer_raw_face_demo.png",
    expect: {
      eye: ["brown", "intermediate"],
      hair: ["brown", "black"],
      mustInclude: { hair: "brown" },
      skin: ["very light", "light"],
    },
  },
  // two people shot from below, both with very dark brown hair
  twoPeople: {
    file: "man-woman-okay.jpg",
    expect: { hair: ["black", "brown"], warning: /More than one face/ },
  },

  // --- Wikimedia Commons ---
  // natural red hair, blue-green eyes, very light freckled skin
  // CC BY 2.0, dusdin on Flickr (cropped by Gridge):
  // https://commons.wikimedia.org/wiki/File:Woman_redhead_natural_portrait_1.jpg
  redhead: {
    file: "commons-redhead.jpg",
    url: COMMONS + "0/03/Woman_redhead_natural_portrait_1.jpg/1920px-Woman_redhead_natural_portrait_1.jpg",
    expect: { eye: ["blue", "intermediate"], hair: ["red"], skin: ["very light", "light"] },
  },
  // blond hair, light blue eyes, tanned skin, shiny forehead in flash
  // CC BY-SA 3.0, Frantogian: https://commons.wikimedia.org/wiki/File:Myriam_Abel.JPG
  blondBlue: {
    file: "commons-blond-blue.jpg",
    url: COMMONS + "6/6c/Myriam_Abel.JPG/1920px-Myriam_Abel.JPG",
    expect: {
      eye: ["blue", "intermediate"],
      hair: ["blond", "brown"],
      mustInclude: { eye: "blue", hair: "blond" },
      skin: ["light", "intermediate", "tan"],
    },
  },
  // platinum blond under a knit hat, vivid blue eyes, very light skin
  // CC BY-SA 2.0, Darren Stone: https://commons.wikimedia.org/wiki/File:Camiel_(4199904156).jpg
  blondHat: {
    file: "commons-blond-hat.jpg",
    url: COMMONS + "3/3e/Camiel_%284199904156%29.jpg/1920px-Camiel_%284199904156%29.jpg",
    expect: {
      eye: ["blue"],
      hair: ["blond"],
      skin: ["very light", "light"],
      // platinum blond in the shaded side strands measures nearly colorless
      // (chroma ~6), the same as gray hair; one photo isn't enough to find a
      // rule that separates them
      knownIssues: ["hair"],
    },
  },
  // green eyes, black hair, light skin; the photo has a cool cast
  // CC BY-SA 2.0, Vagelis Kalampalikis: https://commons.wikimedia.org/wiki/File:Green-eyed_woman1.jpg
  greenEyes: {
    file: "commons-green-eyes.jpg",
    url: COMMONS + "5/5b/Green-eyed_woman1.jpg/1920px-Green-eyed_woman1.jpg",
    expect: {
      eye: ["intermediate", "blue"],
      mustInclude: { eye: "intermediate" },
      hair: ["black", "brown"],
      skin: ["very light", "light"],
    },
  },
  // gray-green eyes behind dark-framed glasses, dark blond hair, light skin
  // CC BY-SA 3.0, Arild Vågen: https://commons.wikimedia.org/wiki/File:Sophie_%C3%96sterberg_Mars_2013_03.jpg
  glasses: {
    file: "commons-glasses.jpg",
    url: COMMONS + "9/9d/Sophie_%C3%96sterberg_Mars_2013_03.jpg/1920px-Sophie_%C3%96sterberg_Mars_2013_03.jpg",
    expect: {
      // through the lenses, in warm light, the app hedges toward brown; it
      // must flag the glasses and keep green/hazel in the answer
      eye: ["intermediate", "blue", "brown"],
      mustInclude: { eye: "intermediate" },
      hair: ["blond", "brown"],
      skin: ["very light", "light", "intermediate"],
      glasses: true,
    },
  },
  // older woman, brown skin, light brown eyes, hair under a headscarf
  // CC BY-SA 2.0, F Mira: https://commons.wikimedia.org/wiki/File:Faces_of_Cape_Verde3.jpg
  headscarf: {
    file: "commons-headscarf.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Faces_of_Cape_Verde3.jpg",
    expect: { eye: ["brown", "intermediate"], hair: "unmeasurable", skin: ["tan", "brown", "dark"] },
  },
  // medium-brown skin, dark brown eyes, hair under a hijab; side light
  // CC BY-SA 3.0, Pat David:
  // https://commons.wikimedia.org/wiki/File:Portraits_Libre_Graphics_Meeting_2016_London_(154546869).jpeg
  hijab: {
    file: "commons-hijab.jpg",
    url:
      COMMONS +
      "d/de/Portraits_Libre_Graphics_Meeting_2016_London_%28154546869%29.jpeg/1920px-Portraits_Libre_Graphics_Meeting_2016_London_%28154546869%29.jpeg",
    expect: {
      eye: ["brown"],
      hair: "unmeasurable",
      skin: ["intermediate", "tan", "brown"],
      // side light (one cheek L* 46, the other 74) and a cool cast (b* ~8)
      // read medium-brown skin as "very light"; the app flags uneven light
      knownIssues: ["skin"],
    },
  },
  // brown skin, dark brown eyes, black hair; bright studio light on white
  // CC BY-SA 4.0, JEAB99:
  // https://commons.wikimedia.org/wiki/File:Aadeel-Ahktar-Headshot-WhiteBackdrop-StartNgn.jpg
  studioMan: {
    file: "commons-studio-man.jpg",
    url:
      COMMONS +
      "4/47/Aadeel-Ahktar-Headshot-WhiteBackdrop-StartNgn.jpg/1920px-Aadeel-Ahktar-Headshot-WhiteBackdrop-StartNgn.jpg",
    expect: {
      eye: ["brown"],
      hair: ["black", "brown"],
      skin: ["intermediate", "tan", "brown"],
      // high-key studio light puts the lit cheek and forehead at L* 84-86:
      // brown skin reads "very light". Exposure can't be recovered from the
      // photo alone; the app flags the uneven light
      knownIssues: ["skin"],
    },
  },
  // blue-gray eyes, short graying brown hair, light skin; small in frame
  // CC BY-SA 4.0, Yuliia Maltseva: https://commons.wikimedia.org/wiki/File:Yaroslav_Nitsak.jpg
  suitMan: {
    file: "commons-suit-man.jpg",
    url: COMMONS + "0/07/Yaroslav_Nitsak.jpg/1920px-Yaroslav_Nitsak.jpg",
    expect: { eye: ["blue", "intermediate"], hair: ["brown", "gray"], skin: ["very light", "light"] },
  },
};

export const photoPath = (key) => PHOTO_DIR + PHOTOS[key].file;

// Wikimedia asks automated clients to identify themselves.
const USER_AGENT = "face-trait-analyzer-e2e/1.0 (https://github.com/r-capuzzi/face-trait-analyzer)";

export async function ensurePhotos() {
  mkdirSync(PHOTO_DIR, { recursive: true });
  for (const { file, url } of Object.values(PHOTOS)) {
    const path = PHOTO_DIR + file;
    if (existsSync(path)) continue;
    const res = await fetch(url ?? BUCKET + file, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`Couldn't fetch test photo ${file}: HTTP ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
}

// What a summary says about one trait, checked against the expectation:
// null if acceptable, otherwise a description of what's wrong.
export function traitMismatch(trait, reading, want, mustInclude) {
  if (want === undefined) return null;
  if (want === "unmeasurable") return reading?.measured ? `${trait}: measured, but it's hidden` : null;
  if (!reading?.measured) return `${trait}: not measured (${reading?.reason})`;
  const wrong = reading.categories.filter((c) => !want.includes(c));
  if (wrong.length) return `${trait}: said ${reading.categories.join(" or ")}`;
  if (mustInclude && !reading.categories.includes(mustInclude)) {
    return `${trait}: said ${reading.categories.join(" or ")}, missing ${mustInclude}`;
  }
  return null;
}

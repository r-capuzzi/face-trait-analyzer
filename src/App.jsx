import { useEffect, useRef, useState } from "react";
import UploadPanel from "./components/UploadPanel";
import ProcessingStatus from "./components/ProcessingStatus";
import PhotoOverlay from "./components/PhotoOverlay";
import TraitCard from "./components/TraitCard";
import PigmentBar from "./components/PigmentBar";
import HairDetails from "./components/HairDetails";
import SkinDetails from "./components/SkinDetails";
import QualityBanner from "./components/QualityBanner";
import AboutSection from "./components/AboutSection";
import ShapeCard from "./components/ShapeCard";
import ColorCorrection from "./components/ColorCorrection";
import DeepHistory from "./components/DeepHistory";
import AtAGlance from "./components/AtAGlance";
import CopySummary from "./components/CopySummary";
import { summarizeResult } from "./lib/summary";
import timeline from "./data/timeline";
import HeroArt from "./components/HeroArt";
import Icon from "./components/Icon";
import { useAnalysis } from "./hooks/useAnalysis";
import eyeColor from "./data/traits/eyeColor";
import hairColor from "./data/traits/hairColor";
import skinTone from "./data/traits/skinTone";
import { SELF_REPORTED, SHAPE_CARDS } from "./data/cards";
import "./App.css";

// Overlay layers; the dots double as a legend for the colors drawn on the photo.
const LAYERS = {
  regions: { label: "Sampled pixels", colors: ["#00e5ff", "#ff3cd2", "#ffa000", "#ff5a36"] },
  shape: { label: "Face measurements", colors: ["#ffd400", "#ff4fd8", "#b07cff", "#5dff7a", "#ffffff"] },
  mask: { label: "Hair / skin mask", colors: ["#ffaa00", "#00c8ff"] },
  landmarks: { label: "Face landmarks", colors: ["#00ff78"] },
};

// Trait cards in display order: content + trait-specific detail view.
const TRAITS = [
  {
    key: "eye",
    content: eyeColor,
    details: (t) => (
      <PigmentBar
        pie={t.pie}
        greenShare={t.greenShare}
        eyes={t.eyes}
        heterochromiaNote={t.heterochromia ? eyeColor.heterochromia : null}
      />
    ),
  },
  { key: "hair", content: hairColor, details: (t) => <HairDetails hair={t} /> },
  { key: "skin", content: skinTone, details: (t) => <SkinDetails skin={t} /> },
];

// The numbered sections, for their headers and the jump links above them.
const SECTIONS = [
  ["01", "Color"],
  ["02", "Face shape"],
  ["03", "What a photo can't measure"],
  ["04", "How faces got this way"],
];
const titleOf = (number) => SECTIONS.find(([n]) => n === number)[1];

export default function App() {
  const { state, analyzeFile, reset, correctColors, undoCorrection, clearCorrectionError } = useAnalysis();
  // choosing a white/gray spot on the photo for color correction
  const [picking, setPicking] = useState(false);
  const [layers, setLayers] = useState({ regions: true, shape: true, mask: false, landmarks: false });
  const [overrides, setOverrides] = useState({});
  const busy = ["loading-image", "loading-models", "analyzing"].includes(state.status);
  const resultsHeading = useRef(null);

  // The upload panel (and the focused file input) disappears when results
  // arrive; move focus to the results so keyboard and screen-reader users
  // land on them instead of being dropped back at the top of the page.
  useEffect(() => {
    if (state.status === "done") resultsHeading.current?.focus();
  }, [state.status]);

  function startOver() {
    setOverrides({});
    setPicking(false);
    reset();
  }

  function startPicking() {
    clearCorrectionError();
    setPicking(true);
  }

  const setOverride = (trait) => (value) => setOverrides((o) => ({ ...o, [trait]: value }));
  const result = state.result;

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">Photo · Traits · Genes</p>
          <h1>
            Trait Genetics <em>Explainer</em>
          </h1>
          <p className="hero__lede">
            Measures the color of your eyes, hair and skin and the shape of your eyes, eyebrows, nose
            and lips from a photo, then explains the genes behind each trait, why it evolved, and how
            well science understands both.
          </p>
          <ul className="promises">
            <li>
              <Icon name="shield" size={18} /> Your photo never leaves your device
            </li>
            <li>
              <Icon name="book" size={18} /> Every claim cited
            </li>
            <li>
              <Icon name="group" size={18} /> No ancestry or ethnicity guessing
            </li>
          </ul>
        </div>
        <HeroArt />
      </header>

      <main>
        {state.status !== "done" && (
          <UploadPanel
            onFile={(file) => {
              setOverrides({});
              setPicking(false);
              analyzeFile(file);
            }}
            disabled={busy}
          />
        )}
        <ProcessingStatus status={state.status} />
        {state.status === "error" && (
          <p className="callout callout--error" role="alert">
            <Icon name="alert" size={18} /> {state.error}
          </p>
        )}

        {state.status === "done" && (
          <section className="results" aria-labelledby="results-heading">
            <h2 id="results-heading" className="visually-hidden" tabIndex={-1} ref={resultsHeading}>
              Your results
            </h2>
            <aside className="results__photo">
              <div className="photo-frame">
                <PhotoOverlay
                  image={state.image}
                  result={result}
                  layers={layers}
                  picking={picking}
                  onPick={(x, y) => correctColors(x, y) && setPicking(false)}
                  onCancel={() => setPicking(false)}
                  marker={state.correction}
                />
              </div>
              <fieldset className="chips">
                <legend>Show on photo</legend>
                {Object.entries(LAYERS).map(([key, { label, colors }]) => (
                  <label key={key} className={`chip ${layers[key] ? "is-on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                    />
                    <span className="chip__dots" aria-hidden="true">
                      {colors.map((c) => (
                        <span key={c} style={{ background: c }} />
                      ))}
                    </span>
                    {label}
                  </label>
                ))}
              </fieldset>
              <ColorCorrection
                picking={picking}
                corrected={Boolean(state.correction)}
                error={state.correctionError}
                onStart={startPicking}
                onCancel={() => setPicking(false)}
                onUndo={undoCorrection}
              />
              <CopySummary getText={() => summarizeResult(result, { overrides, correction: state.correction })} />
              <button type="button" className="button button--ghost" onClick={startOver}>
                <Icon name="refresh" size={18} /> Analyze another photo
              </button>
            </aside>

            <div className="results__traits">
              <AtAGlance
                traits={TRAITS.map(({ key, content }) => ({
                  content,
                  measurement: result.traits[key],
                  override: overrides[key] ?? null,
                }))}
                sections={SECTIONS}
              />
              <SectionHeader number="01" lede="Pigment in your eyes, hair and skin." />
              {state.correction && (
                <p className="callout callout--ok">
                  <Icon name="target" size={18} /> Colors below are corrected for the lighting, using the white or
                  gray spot you picked on your photo.
                </p>
              )}
              <QualityBanner
                issues={result.quality.issues}
                warnings={result.warnings}
                onCorrectColors={state.correction ? null : startPicking}
              />
              {TRAITS.map(({ key, content, details }) => (
                <TraitCard
                  key={key}
                  content={content}
                  measurement={result.traits[key]}
                  override={overrides[key] ?? null}
                  onOverride={setOverride(key)}
                  details={result.traits[key].status === "ok" && details(result.traits[key])}
                />
              ))}

              <SectionHeader
                number="02"
                lede="Measured relative to your own face. There are no 'normal' ranges and no better or worse: published norms are split by ethnic group, and this tool doesn't compare you to groups. A relaxed face photographed from about 1.5 m works best."
              />
              {SHAPE_CARDS.map(({ content, part }) => (
                <ShapeCard key={content.id} content={content} part={part(result.traits)} />
              ))}

              <SectionHeader
                number="03"
                lede="Some traits don't show up reliably in a photo. Pick yours to read the genetics; nothing in this section comes from your picture."
              />
              {SELF_REPORTED.map((content) => (
                <TraitCard
                  key={content.id}
                  content={content}
                  measurement={{ status: "self-report", reason: content.selfReport }}
                  override={overrides[content.id] ?? null}
                  onOverride={setOverride(content.id)}
                />
              ))}

              <SectionHeader
                number="04"
                lede={
                  "The cards' \"Why it evolved\" points, in time order: from 25 million years ago to the last 5,000 years. It's the history of our species, not a reading of your own ancestry."
                }
              />
              <DeepHistory content={timeline} />
            </div>
          </section>
        )}
      </main>

      <AboutSection />
    </div>
  );
}

function SectionHeader({ number, lede }) {
  return (
    <header className="section-header" id={`section-${number}`}>
      <span className="section-header__number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h2>{titleOf(number)}</h2>
        <p>{lede}</p>
      </div>
    </header>
  );
}

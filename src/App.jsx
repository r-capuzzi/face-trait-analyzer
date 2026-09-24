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
import HeroArt from "./components/HeroArt";
import Icon from "./components/Icon";
import { useAnalysis } from "./hooks/useAnalysis";
import eyeColor from "./data/traits/eyeColor";
import hairColor from "./data/traits/hairColor";
import skinTone from "./data/traits/skinTone";
import eyeShape from "./data/shape/eyeShape";
import noseShape from "./data/shape/noseShape";
import lipShape from "./data/shape/lipShape";
import eyebrows from "./data/shape/eyebrows";
import faceProportions from "./data/shape/faceProportions";
import hairTexture from "./data/traits/hairTexture";
import freckles from "./data/traits/freckles";
import "./App.css";

// Overlay layers; the dots double as a legend for the colors drawn on the photo.
const LAYERS = {
  regions: { label: "Sampled pixels", colors: ["#00e5ff", "#ff3cd2", "#ffa000"] },
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
        eyes={t.eyes}
        heterochromiaNote={t.heterochromia ? eyeColor.heterochromia : null}
      />
    ),
  },
  { key: "hair", content: hairColor, details: (t) => <HairDetails hair={t} /> },
  { key: "skin", content: skinTone, details: (t) => <SkinDetails skin={t} /> },
];

// Face-shape cards: content + where its measurements live in the result.
const SHAPES = [
  { content: faceProportions, part: (t) => (t.shape.status === "ok" ? t.shape.face : t.shape) },
  { content: eyeShape, part: (t) => (t.shape.status === "ok" ? t.shape.eyes : t.shape) },
  { content: eyebrows, part: (t) => t.brows },
  { content: noseShape, part: (t) => (t.shape.status === "ok" ? t.shape.nose : t.shape) },
  { content: lipShape, part: (t) => (t.shape.status === "ok" ? t.shape.lips : t.shape) },
];

// Traits a photo can't measure reliably: the visitor picks theirs and reads
// the genetics. Nothing here comes from the photo.
const SELF_REPORTED = [hairTexture, freckles];

export default function App() {
  const { state, analyzeFile, reset } = useAnalysis();
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
    reset();
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
            and lips from a photo, then explains the genes behind each trait and how well science
            understands them.
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
                <PhotoOverlay image={state.image} result={result} layers={layers} />
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
              <button type="button" className="button button--ghost" onClick={startOver}>
                <Icon name="refresh" size={18} /> Analyze another photo
              </button>
            </aside>

            <div className="results__traits">
              <SectionHeader number="01" title="Color" lede="Pigment in your eyes, hair and skin." />
              <QualityBanner issues={result.quality.issues} warnings={result.warnings} />
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
                title="Face shape"
                lede="Measured relative to your own face. There are no 'normal' ranges and no better or worse: published norms are split by ethnic group, and this tool doesn't compare you to groups. A relaxed face photographed from about 1.5 m works best."
              />
              {SHAPES.map(({ content, part }) => (
                <ShapeCard key={content.id} content={content} part={part(result.traits)} />
              ))}

              <SectionHeader
                number="03"
                title="What a photo can't measure"
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
            </div>
          </section>
        )}
      </main>

      <AboutSection />
    </div>
  );
}

function SectionHeader({ number, title, lede }) {
  return (
    <header className="section-header">
      <span className="section-header__number" aria-hidden="true">
        {number}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{lede}</p>
      </div>
    </header>
  );
}

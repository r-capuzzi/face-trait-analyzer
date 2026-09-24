import { useState } from "react";
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
import { useAnalysis } from "./hooks/useAnalysis";
import eyeColor from "./data/traits/eyeColor";
import hairColor from "./data/traits/hairColor";
import skinTone from "./data/traits/skinTone";
import eyeShape from "./data/shape/eyeShape";
import noseShape from "./data/shape/noseShape";
import lipShape from "./data/shape/lipShape";
import "./App.css";

const LAYER_LABELS = {
  regions: "Sampled pixels",
  shape: "Face measurements",
  mask: "Hair / skin mask",
  landmarks: "Face landmarks",
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

const SHAPES = [eyeShape, noseShape, lipShape];

export default function App() {
  const { state, analyzeFile, reset } = useAnalysis();
  const [layers, setLayers] = useState({ regions: true, shape: true, mask: false, landmarks: false });
  const [overrides, setOverrides] = useState({});
  const busy = ["loading-image", "loading-models", "analyzing"].includes(state.status);

  function startOver() {
    setOverrides({});
    reset();
  }

  const setOverride = (trait) => (value) => setOverrides((o) => ({ ...o, [trait]: value }));
  const result = state.result;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Trait Genetics Explainer</h1>
        <p className="app__lede">
          Measures your eye, hair and skin color and the proportions of your eyes, nose and lips
          from a photo, then explains the genes behind each trait and how well science understands
          them. It runs entirely in your browser and never guesses ancestry or ethnicity.
        </p>
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
          <p className="error" role="alert">
            {state.error}
          </p>
        )}

        {state.status === "done" && (
          <section className="results">
            <div className="results__photo">
              <PhotoOverlay image={state.image} result={result} layers={layers} />
              <fieldset className="layers">
                <legend>Show on photo</legend>
                {Object.entries(LAYER_LABELS).map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <button type="button" className="button" onClick={startOver}>
                Analyze another photo
              </button>
            </div>

            <div className="results__traits">
              <h2 className="section-title">Color</h2>
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

              <section className="shape" aria-labelledby="shape-heading">
                <h2 id="shape-heading" className="section-title">Face shape</h2>
                <p className="section-lede">
                  Proportions within your own face. There are no 'normal' ranges and no better or worse:
                  published norms are split by ethnic group, and this tool doesn't compare you to groups.
                  For these, a relaxed face photographed from about 1.5 m works best.
                </p>
                {result.traits.shape.status === "ok" ? (
                  SHAPES.map((content) => (
                    <ShapeCard key={content.id} content={content} part={result.traits.shape[content.id]} />
                  ))
                ) : (
                  <p className="trait__unmeasured">{result.traits.shape.reason}</p>
                )}
              </section>
            </div>
          </section>
        )}
      </main>

      <AboutSection />
    </div>
  );
}

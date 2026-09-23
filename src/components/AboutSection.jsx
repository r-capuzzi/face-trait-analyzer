// What the tool does and doesn't do, where the photo goes (nowhere), and how
// to read the confidence labels.
export default function AboutSection() {
  return (
    <footer className="about">
      <h2>About this tool</h2>
      <div className="about__grid">
        <section>
          <h3>What it is</h3>
          <p>
            An educational explainer. It measures the color of your eyes, hair and skin in a photo and
            explains the genetics of each trait, with sources. It is <strong>not a genetic test</strong>:
            a photo can't reveal your genotype, and the explanations say how much (or how little) the
            science can infer.
          </p>
          <p>
            It treats each trait on its own and <strong>never guesses ancestry, ethnicity or race</strong>.
            Pigmentation varies continuously and doesn't sort people into groups.
          </p>
        </section>
        <section>
          <h3>Your photo stays on your device</h3>
          <p>
            All analysis runs in this browser tab. The only downloads are the face-detection models
            (from Google&apos;s MediaPipe) and their runtime (from jsDelivr); your photo is never uploaded,
            stored or sent anywhere. Reloading the page clears it.
          </p>
        </section>
        <section>
          <h3>Reading the results</h3>
          <p>
            <strong>Confidence</strong> starts from how clearly the measurement falls inside a category and
            drops for each photo problem that affects that trait (lighting color, blur, shadows and so on).
            A low-confidence result is shown as "between X and Y". Hair color and skin tone never go
            above medium, because studies show photos measure them only roughly outside controlled
            lighting.
          </p>
          <p>
            Camera white balance and room lighting shift every color. For the best result, use daylight
            from a window in front of you, no filters and no flash.
          </p>
        </section>
      </div>
    </footer>
  );
}

import Icon from "./Icon";

// What the tool does and doesn't do, where the photo goes (nowhere), and how
// to read the confidence labels.
export default function AboutSection() {
  return (
    <footer className="about">
      <h2>About this tool</h2>
      <div className="about__grid">
        <section className="about__item">
          <span className="about__icon">
            <Icon name="book" size={22} />
          </span>
          <h3>What it is</h3>
          <p>
            An educational explainer. It measures the color and shape of facial traits in a photo and
            explains the genetics and evolutionary history of each, with sources. It is <strong>not a genetic test</strong>: a
            photo can&apos;t reveal your genotype, and the explanations say how much (or how little) the
            science can infer.
          </p>
          <p>
            It treats each trait on its own and <strong>never guesses ancestry, ethnicity or race</strong>.
            These traits vary continuously and don&apos;t sort people into groups.
          </p>
        </section>
        <section className="about__item">
          <span className="about__icon">
            <Icon name="shield" size={22} />
          </span>
          <h3>Your photo stays on your device</h3>
          <p>
            All analysis runs in this browser tab. The only downloads are the face-detection models
            (from Google&apos;s MediaPipe) and their runtime (from jsDelivr); your photo is never uploaded,
            stored or sent anywhere. Reloading the page clears it.
          </p>
          <p>
            This isn&apos;t just a promise: the site&apos;s security policy tells your browser to block
            every connection except to those two sources, so even a bug couldn&apos;t send your photo
            anywhere.
          </p>
        </section>
        <section className="about__item">
          <span className="about__icon">
            <Icon name="sun" size={22} />
          </span>
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
            from a window in front of you, no filters and no flash. If the light was colored, use
            <strong> Correct the colors</strong> and pick something in the photo that should be white or gray.
          </p>
          <p>
            In <strong>Why it evolved</strong>, every point carries an evidence label, from{" "}
            <em>well supported</em> to <em>unknown</em>. Evolutionary explanations range from measured to
            guesswork, and some traits have no known purpose at all; the labels say which is which.
          </p>
        </section>
      </div>
      <p className="about__credits">
        Face models: MediaPipe (Apache 2.0). Monk Skin Tone Scale: Dr. Ellis Monk &amp; Google (CC BY 4.0).
        Typefaces: Fraunces and Inter (SIL Open Font License).
      </p>
    </footer>
  );
}

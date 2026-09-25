# Trait Genetics Explainer

Upload a photo and get your **eye, hair and skin color** and face shape measured, then read how the genes behind each trait work, why the trait evolved, how well science understands both, and what a photo can and can't tell you.

**Try it: [face-trait-analyzer.vercel.app](https://face-trait-analyzer.vercel.app)**

- **Private by design:** all analysis runs in the browser. The photo is never uploaded.
- **Traits, not labels:** each trait is explained on its own. The app never guesses ancestry, ethnicity or race.
- **Cited and conservative:** every genetics claim links to its source paper, every result has a confidence level, and uncertain results are shown as "between X and Y".

## How it works

```
photo ─► MediaPipe FaceLandmarker (478 landmarks) ──┐
      └► MediaPipe ImageSegmenter (hair/skin mask) ─┴─► plain-JS pixel sampling ─► CIELAB ─► trait classifiers
                                                                                              │
                                   photo-quality checks (pose, blur, exposure, color cast) ──► confidence
```

MediaPipe only finds *where* things are. All color measurement is plain JavaScript over pixel arrays ([`src/lib/traits/`](src/lib/traits)), so it is unit-tested on synthetic images without loading any model.

| Trait | Measured from | Method | Categories |
|---|---|---|---|
| Eye color | Iris ring inside the eyelids (pupil, catchlights and lashes excluded) | Pixel Index of the Eye: share of unpigmented vs. pigmented pixels (Andersen et al. 2013) | IrisPlex: blue, intermediate, brown |
| Hair color | Interior of the hair mask (edges, shine and shadow trimmed) | Lightness continuum (Morgan et al. 2018) plus red and gray rules | black, brown, blond, red, gray |
| Skin tone | Cheek and forehead patches within the face-skin mask | Individual Typology Angle (Chardon 1991) plus the nearest Monk Skin Tone swatch | six ITA categories |

### Face shape

Eye, nose and lip proportions come straight from landmark geometry ([`faceShape.js`](src/lib/traits/faceShape.js)). Each is measured in a face-aligned frame, so a tilted head gives the same numbers, and each is a **ratio within the person's own face**:

| Feature | Measures |
|---|---|
| Face proportions | face width ÷ height (nasal root to chin), midface ÷ lower face (with the "equal thirds" canon), jaw width ÷ face width, chin height (lower lip to chin) ÷ lower face |
| Eyes | openness (height ÷ width), corner tilt (degrees), spacing (inner-corner gap ÷ eye width) |
| Nose | width at the nose wings ÷ eye gap, and ÷ face width |
| Lips | mouth width ÷ nose width, lower ÷ upper lip height, lip height ÷ mouth width, Cupid's bow depth |
| Eyebrows | unibrow (share of the gap between the brows that reads as hair), thickness (hair area ÷ brow length), fill, arch |
| Forehead & hairline | hairline to nasal root ÷ midface, with the canon's "top third"; bangs, side parts, hats and shaved heads are detected and reported instead of measured |
| Facial hair | share of the mustache, chin and jaw zones that reads as hair (darker than the upper cheeks **and** hair-textured, or labeled hair by the segmenter) |

Facial hair required the most care. The first version read a clean-shaven, smiling face as "light" facial hair, because it counted shadows and smile lines. Three changes fixed it: comparing against the cheeks instead of the brightly lit forehead, requiring strand-like texture (so smooth shadows don't count), and skipping the jaw-side zones during a smile. Painted-on beards read "moderate" (sparse) and "full" (dense).

The first real bearded photo (close-trimmed stubble over the whole jaw) reads "full coverage" (67%): the card measures how much area is covered, not how long the hair is, and says so. Two more sample photos then caught a false positive: a smiling woman with long hair read as "light" (13%). The zones are sized from the mouth, a wide smile stretched them past the jawline, and her scalp hair there counts as hair. Now only pixels inside the face outline count, and the mustache and chin zones narrow during a smile. All four clean-shaven faces read "none" (1.5–11.6%). A head tilted back, as in a photo taken from below, shows the shadow under the jaw, so the card adds a note when the head is turned or tilted more than 20°.

Each landmark not taken from one of MediaPipe's contour constants (nasal root 168, nose base 2, chin 152, jaw angles 172/397, nose wings 129/358) was checked by plotting the candidates on a test photo.

The eye-color sample now finds the pupil's edge from the radial lightness profile instead of assuming it covers 35% of the iris radius. A dilated pupil (6 mm pupils against an ~11.7 mm iris are ordinary) was leaking into the sample and pushing blue eyes toward "intermediate". A test covers this case.

The segmentation model labels eyebrows as face skin, so brow hair ([`eyebrows.js`](src/lib/traits/eyebrows.js)) is found by comparing each pixel with a strip of forehead skin just above the brow. The same rule then works on any skin tone, which a test checks. Very light brows, where there isn't enough contrast, aren't measured, and a brow half-hidden by bangs is left out rather than averaged in. The genetics come from a study that scored brows in men only, because most women had shaped theirs (Adhikari 2016: FOXL2 for thickness, PAX3 for the unibrow), and the card says so.

There are no "normal ranges" or wide/narrow labels, because published facial norms are split by ethnic group. The only reference points are the neoclassical art canons, shown as a myth: Farkas (1985) found even the best-fitting canon held for only 40% of real faces. Expressions are flagged per card using MediaPipe's expression scores. Smiling flags lips and nose, since the nose base widens in 92% of smiles (Beiraghi-Toosi 2016), and squinting flags the eyes. Nose width also comes with the selfie caveat: at about 30 cm the nose base looks about 30% wider (Ward 2018).

### What a photo can't measure

Some traits don't show up reliably in a photo, so these cards ask you to pick yours and then explain the genetics. Nothing in this section comes from the photo.

| Trait | Why it isn't measured | What the genetics says |
|---|---|---|
| Hair texture | styling and lighting change how curl looks | TCHH, WNT10A, OFCC1, PRSS53: polygenic |
| Widow's peak | the 256×256 hair mask is too coarse to trace a small V | first genome-wide study only in 2022 (Wang): two regions, and a DNA predictor barely better than chance (AUC 0.56–0.60) |
| Freckles | resolution, makeup and filters hide them | MC1R, IRF4, BNC2 |
| Dimples | cheek dimples show only mid-smile | chin dimples: about 57 regions in a 71,000-person study (Pickrell 2016); cheek dimples: no genome-wide study in the GWAS Catalog, just an anatomy finding (a split smile muscle, Pessa 1998) |
| Earlobes | front-facing photos hide them; studies photograph ears from the side | 49 regions in 74,660 people (Shaffer 2017), not the single gene classrooms teach |

Three of these (earlobes, dimples, widow's peak) are classic "one gene, dominant or recessive" classroom examples. Each card explains what the studies actually found.

A test ([`content.test.js`](src/data/content.test.js)) checks every card's citations: nothing cites a source that isn't listed, nothing lists a source it never cites, and every source has a link. Its first run found an eye-color source that was listed but never shown.

### Why it evolved

Every card has a "Why it evolved" section: how the trait came to vary among humans, with each point labeled by the strength of its evidence (**well supported**, **leading explanation**, **hypothesis** or **unknown**). Evolutionary explanations range from measured to guesswork, and the labels keep that visible:

- **Skin color** is the best-supported case. It tracks UV levels worldwide (Jablonski & Chaplin 2000, 2010): dark skin protects folate, lighter skin lets the body make vitamin D where UV is weak, and light skin evolved more than once through different genes (Norton 2007). Ancient DNA shows the main European light-skin variant arrived mostly with farmers from Anatolia (Mathieson 2015).
- **Blond hair** evolved twice, via KITLG in northern Europe and TYRP1 in the Solomon Islands (Guenther 2014; Kenny 2012). **Red hair** fits relaxed selection on MC1R outside Africa, not an advantage (Harding 2000).
- **Established but unexplained:** strong selection for lighter eyes and hair in Europe over the last 5,000 years (Wilde 2014), and the EDAR 370A variant behind thicker hair (Kamberov 2013). Why they were favored is still debated.
- **Contested ideas are labeled as such.** Examples: the "cooperative eye" explanation for the white of the eye (Kobayashi 2001, disputed by Perea-García 2025), beards as a signal between men (Dixson & Vasey 2012), and mobile eyebrows replacing brow ridges (Godinho 2018).
- **Neanderthals left traces.** Neanderthal DNA in present-day Europeans affects skin tone and hair color in both directions (Dannemann & Kelso 2017). A Neanderthal-derived stretch near the freckle gene BNC2, now carried on more than two-thirds of European chromosomes, is linked to poor tanning. Some Neanderthals evolved their own red-hair variant of MC1R (Lalueza-Fox 2007).
- **Deep history:**
  - The projecting nose appeared with *Homo erectus* (Franciscus & Trinkaus 1988).
  - Meat and simple food processing cut chewing long before farming (Zink & Lieberman 2016).
  - Chimpanzees share our facial-expression muscles, including the smile muscle behind dimples (Burrows 2006).
  - Our vestigial ear muscles still fire toward sounds (Strauss 2020).
  - Eye sockets are larger farther from the equator, matching dimmer light (Pearce & Dunbar 2012).
  - Brow ridges kept shrinking within our own species (Cieri 2014).
  - The main baldness-risk version of the androgen receptor gene may have spread by hitchhiking on a favored neighbor (Hillmer 2009).
- **Some traits have no known purpose.** Earlobes, cheek dimples and the widow's peak are labeled "unknown" rather than given a made-up story. Most face and skull variation between populations fits random drift (Roseman 2004).

The section frames it as the history of our species, never as a reading of the viewer's own ancestry. A test requires every card to have one, with a valid evidence label on every point.

### How faces got this way

Section 04 lays the cards' evolutionary points out as a timeline ([`timeline.js`](src/data/timeline.js)). It starts about 25 million years ago with ears that turned toward sounds, runs through *Homo erectus*, Neanderthals, the EDAR variant, and farming, and ends with selection for lighter pigment in the last 5,000 years. Dates appear only where a source gives one. Each event carries the evidence label of its weakest claim and links back to the cards it explains. Tests check its citations, that its links point at real cards, and that dated events run oldest first.

### Reading the results

- **At a glance:** a bar above the results sums up eye, hair and skin color (including your own corrections) and links to the four sections.
- **Copy results summary:** a button in the photo panel copies a plain-text summary with labels, rounded numbers, photo-check notes and your picks. It never includes the image. If the browser blocks the clipboard, the text appears in a box to copy by hand. This is the easiest way to report a result that looks wrong.
- **Color-cast shortcut:** when the photo check detects a colored tint (from the whites of the eyes), the warning offers the color correction directly.

### Color correction

Warm or colored light tints every color the app measures. If something in the photo should be white or gray, you can click it (or move a crosshair with the arrow keys and press Enter). The app then removes the tint and re-measures, without running the face models again:

- **Method:** per-channel gains in linear light that make the picked spot neutral at its own brightness (a white-patch, von Kries-style correction; [`whiteBalance.js`](src/lib/whiteBalance.js)). Only the color of the light changes, not the exposure, so lightness-based measures like skin ITA aren't pushed around.
- **Refusals:** a blown-out spot (its color is lost), a very dark one (mostly noise) or a clearly colored one (a red shirt isn't a gray card) is refused with the reason.
- **Clipped pixels are left alone.** A channel stuck at 255 only means "at least this bright". Scaling it down would invent a color, and it would hide the pixel from the overexposure check. Testing on a real photo caught exactly that: the "blown out" warning disappeared after a correction until this was fixed.
- **Undo** and a second pick always start from the original photo, so corrections never stack.

Tests add a warm cast to a synthetic face and check that correcting it with a gray patch brings the iris color back to within ΔE 1.5 of the uncast photo.

### Privacy, enforced by the browser

A Content Security Policy ([`csp.js`](csp.js), mirrored in `vercel.json` and checked by a test) allows network requests only to the page itself, jsDelivr (the MediaPipe runtime) and Google's model bucket. Anything else is blocked by the browser before it leaves the tab. This was verified under `npm run preview`: a test upload to another site was stopped with a `connect-src` violation while the analysis ran normally. The Fraunces and Inter fonts are bundled rather than loaded from Google Fonts, so the policy needs no exceptions for them.

### Confidence

Confidence starts from how far a result sits from its category boundary. It then drops one level for each photo problem that affects that trait:

- head turned away from the camera, read from the pose matrix's diagonal so it doesn't depend on the matrix's storage order
- closed eyes
- blur (variance of the Laplacian)
- blown-out highlights
- uneven lighting across the face
- a color cast, detected from the whites of the eyes

Two traits never go above "medium":

- **Hair:** photo-based hair measurements agree only moderately with lab instruments (Vaughn et al. 2009).
- **Skin:** smartphone ITA has only been validated with the flash off and minimal ambient light (Burrow et al. 2025).

### Tested on real photos

The app has been run on four of MediaPipe's sample photos (not in the repo), five faces in all. Eye color came out right on the two portraits, and hair color on one. Testing them led to these changes:

- Salt-and-pepper hair (a colorless mid-gray median) now reads as gray instead of brown.
- Skin confidence is now capped.
- The facial-hair fixes above.

On the smallest face (a 256 px image, 6 px iris radius) the eyes look gray-green, and the app answers "between brown and green/hazel" at low confidence. A simulation that shrinks painted irises down to a 4 px radius showed that size alone doesn't bias the result. This iris is dark and nearly gray in the photo, and near-gray pixels are classified by lightness, so it sits right on the brown/blue line. Hedging is the honest answer there.

### Tested on a wider set of faces

Nine openly licensed portraits from Wikimedia Commons were added to the four MediaPipe samples, to cover what those lacked: blue and green eyes, blond and red hair, glasses, headscarves, and tan to brown skin. Each was labeled by eye before running the app, and each photo's source, license and author are listed in [`e2e/photos.js`](e2e/photos.js). They turned up a serious error: a dark brown iris with a slight magenta cast (hue 340°) read "Blue / gray" with high confidence, because every hue outside the warm band counted as unpigmented. Blue scattering sits at 250–270° on these photos, so unpigmented now means 100–300° only, and magenta and red count as pigment.

Three readings are still wrong and are declared as known issues in the tests, so a fix or a new mistake both show up:

- **Platinum blond under shade reads gray.** It measures nearly colorless (chroma ~6), the same as gray hair.
- **Two brown-skinned faces read "very light".** One is under high-key studio light (the lit cheek at L* 84–86), the other under side light with a cool cast. Both photos get the uneven-light warning, but a photo alone can't recover exposure.

### Stress-tested with altered copies

Each test photo was also run as the kinds of copies phones and apps produce: mirrored, re-compressed, darker, brighter, under warm or cool light, blurred and shrunk. Nothing about the person changes in these copies, so any change in the answer is the app's error. That turned up five problems, now fixed:

- **Eye color:** the top of the iris sits in the upper lid's shadow and holds most catchlights. On a brown eye those dark blue-green pixels voted "blue" (PIE −0.84 instead of −1). The sample now uses the lower half of the iris when it has enough pixels. Glare is rejected by its distance from the iris's median lightness (Leys et al. 2013) instead of by a fixed 15% trim, which let half of a studio portrait's catchlights through.
- **Green eyes read as blue:** each iris pixel counts as pigmented (warm hue) or not, and green pixels (yellow-green, hue 100–180°) landed on the blue side. Blue scattering carries no yellow; green is that scattering seen through a thin yellowish pigment layer. Now, when most of the unpigmented pixels are green, the answer is "Green / hazel" (IrisPlex's intermediate). No test photo has green eyes, so an end-to-end test recolors a real brown iris green, keeping its shading and catchlight. The previous live version called it blue.
- **Iris placement:** MediaPipe's iris circle can land a pixel or two off, and on the portrait's 8 px iris a mirrored copy moved it enough that the same eye read L* 8 once and L* 22 the other time. The circle is now refined to the iris's edge against the white of the eye (Daugman's integro-differential idea, on the sides of the iris only). The two copies now agree within L* 4. Below an 8 px radius the edge is too blurred to find, so the landmarks are kept.
- **Pupil edge on small irises:** below a 12 px iris radius the pupil search was reading sub-pixel noise, and a mirrored copy moved it from 35% to 50% of the radius. Small irises now keep the default cutoff.
- **Skin in bright light:** dropping blown-out pixels left only a patch's shadows, so a brighter photo read *darker* ("tan" instead of "intermediate"). A patch with more than 10% clipped pixels is now left out, and fully blown-out skin says so.
- **Warm light went unflagged:** a warm-bulb cast shifted skin by up to 18° ITA without a warning, because the lighting check only fired at sclera b* > 22. It now fires at 14, just above the untinted photos (−1 to 9).
- **Red hair and exposure:** the red rule used plain chroma, which rises with brightness, so brightened chestnut-brown hair read "red". It now uses C*/(L*+16), which exposure doesn't change.

The face-shape measurements held up in the same test: proportions, nose width, lip fullness, brow arch and hairline moved 1–5% across copies. The exceptions are the lower-to-upper lip ratio and the Cupid's bow, which run about 10% higher on mirrored copies because MediaPipe's face mesh isn't perfectly mirror-symmetric around the lips. An end-to-end test now holds each ratio to those limits.

**Photos taken from farther away** (the tips suggest 1.5 m for face shape) turned up two more problems. MediaPipe's face detector found no face at all once the pupils were closer than about 6–7% of the image width, which is a phone photo from 1.5 m without zooming. Detection now retries in overlapping zoomed windows (halves, then thirds of the photo), finds faces down to 2.6% on the test photos, and still finds both people in a distant two-person photo. The segmentation model also shrinks the whole photo to 256×256, so a small face got a coarse mask: on a small copy of the portrait, the gray background counted as hair (L* 56 instead of 46). It now runs a second time on a crop around the face, which brought that back to L* 45.

Glasses are now noticed too. The segmentation model labels eyewear as "accessories"; when that label covers 5% of the band around the eyes, eye-color confidence drops a level and the photo check says why (lenses tint and reflect over the iris). Frames drawn on a test photo covered 18%, and none of the photos without glasses had any.

Exposure still moves skin tone: a photo one stop darker reads about one to two ITA categories darker. Only a color reference card in the photo could remove that, which is why skin confidence stays capped at medium.

### What's provisional

The newer limits are starting values too: the glare cutoff (2.5 robust standard deviations), the 10% clipped share that drops a skin patch, the sclera b* limit for warm light, the red-hair saturation, the majority rule for green eyes, the 5% glasses share, the iris-edge search and the 45 cm close-up distance. Each is explained where it's defined.

The per-pixel eye threshold, the eye's ±0.4 intermediate band, the hair thresholds, the quality limits and the color-correction limit (how strong a cast it will remove) are physically reasoned starting values, marked `CALIBRATE` in the code. The published photo studies don't give exact cutoffs in open-access text, so these still need calibrating against labeled photos.

## Development

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # Vitest: color math, trait measurement on synthetic images, UI flows
npm run build
npm run preview        # production build with production's headers, http://localhost:4173
npm run test:e2e       # Playwright: the production build in a real browser
npm run test:e2e:prod  # the same tests against the live site
```

The end-to-end tests ([`e2e/`](e2e)) run the real models on real photos and check:

- **Answers:** each photo gets an answer a person looking at it would accept. A hedge like "Black or Brown" passes only if it includes the right answer.
- **Stability:** a mirrored, re-compressed, EXIF-rotated, Display-P3, 12-megapixel or half-size copy of a photo gets the same answer as the original. A mutation check confirmed these tests fail when color management is switched off.
- **Privacy:** the photo never leaves the page. Every request is a GET to the site, jsDelivr or Google's model bucket, and the CSP blocks everything else.
- **Color correction:** warm light is flagged, and correcting it by mouse or keyboard brings skin back to within 4° ITA of the untinted photo.
- **Bad input and layout:** non-images, corrupt files, HEIC, no face and tiny faces all give clear messages, and nothing is wider than a phone screen.

They run in two engines: Chromium (the installed Edge on Windows, or Chrome) and WebKit, Safari's engine, as a desktop browser and an iPhone (`npx playwright install webkit` once). Missing test photos are fetched into `test-photos/` from MediaPipe's bucket and Wikimedia Commons. CI runs them on every push. A second workflow ([`production.yml`](.github/workflows/production.yml)) runs them against the live site after every Vercel production deploy.

Stack: React 19, Vite 8, Vitest 5, `@mediapipe/tasks-vision` 1.0.1 (models pinned by version).

Deployed on Vercel: every push to `master` redeploys, and [`vercel.json`](vercel.json) serves the same Content Security Policy as `npm run preview`. It was checked on the live site: a test upload to another origin was refused, and the only requests were downloads from the site, jsDelivr and Google's model bucket.

## Credits

- Face landmark and segmentation models: [MediaPipe](https://ai.google.dev/edge/mediapipe) (Apache 2.0).
- Monk Skin Tone Scale: Dr. Ellis Monk and Google, [CC BY 4.0](https://skintone.google).
- Genetics sources are listed with DOIs inside each trait card.

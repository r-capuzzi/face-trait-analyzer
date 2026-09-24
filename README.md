# Trait Genetics Explainer

Upload a photo and get your **eye, hair and skin color** measured, then read how the genes behind each trait work, how well science understands them, and what a photo can and can't tell you.

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

### What's provisional

The per-pixel eye threshold, the eye's ±0.4 intermediate band, the hair thresholds, the quality limits and the color-correction limit (how strong a cast it will remove) are physically reasoned starting values, marked `CALIBRATE` in the code. The published photo studies don't give exact cutoffs in open-access text, so these still need calibrating against labeled photos.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: color math, trait measurement on synthetic images, UI flows
npm run build
npm run preview  # production build with the real CSP, http://localhost:4173
```

Stack: React 19, Vite 8, Vitest 5, `@mediapipe/tasks-vision` 1.0.1 (models pinned by version).

Deployed on Vercel: every push to `master` redeploys, and [`vercel.json`](vercel.json) serves the same Content Security Policy as `npm run preview`. It was checked on the live site: a test upload to another origin was refused, and the only requests were downloads from the site, jsDelivr and Google's model bucket.

## Credits

- Face landmark and segmentation models: [MediaPipe](https://ai.google.dev/edge/mediapipe) (Apache 2.0).
- Monk Skin Tone Scale: Dr. Ellis Monk and Google, [CC BY 4.0](https://skintone.google).
- Genetics sources are listed with DOIs inside each trait card.

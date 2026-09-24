# Trait Genetics Explainer

Upload a photo and get your **eye, hair and skin color** measured, then read how the genes behind each trait work, how well science understands them, and what a photo can and can't tell you.

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
| Eyes | openness (height ÷ width), corner tilt (degrees), spacing (inner-corner gap ÷ eye width) |
| Nose | width at the nose wings ÷ eye gap, and ÷ face width |
| Lips | mouth width ÷ nose width, lower ÷ upper lip height, lip height ÷ mouth width |
| Eyebrows | unibrow (share of the gap between the brows that reads as hair), thickness (hair area ÷ brow length), fill |

The segmentation model labels eyebrows as face skin, so brow hair ([`eyebrows.js`](src/lib/traits/eyebrows.js)) is found by comparing each pixel with a strip of forehead skin just above the brow. The same rule then works on any skin tone, which a test checks. Very light brows, where there isn't enough contrast, aren't measured, and a brow half-hidden by bangs is left out rather than averaged in. The genetics come from a study that scored brows in men only, because most women had shaped theirs (Adhikari 2016: FOXL2 for thickness, PAX3 for the unibrow), and the card says so.

There are no "normal ranges" or wide/narrow labels, because published facial norms are split by ethnic group. The only reference points are the neoclassical art canons, shown as a myth: Farkas (1985) found even the best-fitting canon held for only 40% of real faces. Expressions are flagged per card using MediaPipe's expression scores. Smiling flags lips and nose, since the nose base widens in 92% of smiles (Beiraghi-Toosi 2016), and squinting flags the eyes. Nose width also comes with the selfie caveat: at about 30 cm the nose base looks about 30% wider (Ward 2018).

### What a photo can't measure

Hair texture and freckles don't show up reliably in photos: styling and lighting change how curl looks, and resolution, makeup and filters hide freckles. These cards ask you to pick yours, then explain the genetics (TCHH, WNT10A, OFCC1 and PRSS53 for hair shape; MC1R, IRF4 and BNC2 for freckling). Nothing in this section comes from the photo.

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

The app has been run on MediaPipe's two sample portraits (not in the repo). Eye color came out right on both, and hair color right on one. Testing them led to two changes: salt-and-pepper hair (a colorless mid-gray median) now reads as gray instead of brown, and skin confidence is now capped.

### What's provisional

The per-pixel eye threshold, the eye's ±0.4 intermediate band, the hair thresholds and the quality limits are physically reasoned starting values, marked `CALIBRATE` in the code. The published photo studies don't give exact cutoffs in open-access text, so these still need calibrating against labeled photos.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest: color math, trait measurement on synthetic images, UI flows
npm run build
npm run preview  # production build with the real CSP, http://localhost:4173
```

Stack: React 19, Vite 8, Vitest 5, `@mediapipe/tasks-vision` 1.0.1 (models pinned by version).

## Credits

- Face landmark and segmentation models: [MediaPipe](https://ai.google.dev/edge/mediapipe) (Apache 2.0).
- Monk Skin Tone Scale: Dr. Ellis Monk and Google, [CC BY 4.0](https://skintone.google).
- Genetics sources are listed with DOIs inside each trait card.

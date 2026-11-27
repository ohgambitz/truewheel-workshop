# Truewheel website: audit and creative direction (phases 1 and 2)

Date: 2026-11-27. Audited: the live site at https://ohgambitz.github.io/truewheel-workshop/ (commit 1eebfb4), captured with Playwright at 1440, 768 and 390 px. Evidence: the contact sheets and `live-capture-report.json` in this folder.

## Phase 1: audit

### Technical baseline (strong, keep)
- HTTP 200; full load in 1.3 to 1.8 s; no console errors; no horizontal overflow at any captured width.
- Lighthouse 100 in every category (previous run); strict CSP; no third-party requests; 17/17 functional tests pass.
- Code: static HTML, one stylesheet, six strict TypeScript modules. GitHub Pages compatible with no build server.

### Scores against industry-leading sites (1 to 10)
Benchmarks: Apple product pages, Rapha, Canyon, award-winning boutique studio and maker sites.

| Area | Score | Why |
|---|---|---|
| Brand identity | 6 | Steel-green and brass with condensed type is distinctive, but it is applied as flat colour blocks; there is no ownable visual device beyond the tension chart. |
| Typography | 7 | Big Shoulders Display and Instrument Sans pair well; the hero and price numerals are strong. Body copy is small and grey; every section heading has the same size and treatment. |
| Composition and layout | 5 | Every section repeats the same stack: heading, grey intro line, content. Rhythm is uniform; no full-bleed moments; desktop sections sit in a narrow column with dead space. |
| Imagery | 4 | Two dark CG renders on dark green, inside rounded cards. Low contrast, little detail, and the caption reads like a disclaimer. Nothing resembles editorial product photography. |
| Storytelling | 5 | The order is sensible (promise, proof, prices, builder, process, book), but nothing builds: the craft section is a static table beside an image. |
| Wheel configurator | 5 | Works correctly, but chips are generic pills, the product image does not react to choices, and on phones the price sits below all the options, so you change a part without seeing the total. |
| Service pricing | 7 | Big prices "on the wall" are the best idea on the page. Three-column rows squeeze the descriptions at tablet width; the "most booked" pill is template-like. |
| Booking | 6 | Honest states and validation are good. Visually it is a standard white form card; the native date field is plain; no summary of what you are booking. |
| Mobile design | 6 | Clean and readable, and the sticky booking bar helps, but it is mostly the desktop stacked. The tablet hero has large empty margins around a small chart. |
| Micro-interactions | 5 | Only colour changes on hover and select, plus the chart animation. Nothing feels mechanical or tactile. |
| Accessibility and performance | 10 | Lighthouse 100, 44 px targets, skip link, labelled errors, reduced motion. |
| Overall | 6.2 | Technically excellent, visually competent but template-shaped. Leaders score about 8.5 to 9.5 on identity, imagery and storytelling. |

### Section-by-section findings
1. **Header**: functional but anonymous; links are small grey text; the pill button is the generic SaaS shape.
2. **Hero**: a two-column split on a flat green block. The chart, the best asset, is only about 500 px wide on a 1440 px screen. No product. The hero is shorter than the viewport, so the craft section's top edge peeks in, which reads as unfinished.
3. **"What true means here"**: the spec table is excellent content (real tolerances), undersold by a small dark render in a rounded card.
4. **Prices**: strong numerals; the row grid fights at tablet width; inconsistent baseline alignment between name, description and price.
5. **Configurator**: the 1600 px exploded render is a large, mostly empty dark rectangle that pushes the controls below the fold; it never changes. The quote panel is a bordered rounded card (SaaS pattern).
6. **Process**: four brass numerals in four columns: the most template-like block on the page.
7. **Booking**: solid, but visually a white card on green like thousands of sites.
8. **FAQ**: fine.
9. **Footer**: the large grey "BUILT TRUE" is decoration with no job.
10. **Radii**: 999 px pills, 14, 20 and 24 px cards all at once; no rule ties them to meaning.

### Preserve
- The **spoke-tension chart** and "Knock it out of true": the site's signature and its most honest piece of craft storytelling.
- The **steel-green and brass** palette and the **Big Shoulders + Instrument Sans** pairing (refined, not replaced).
- **"Prices on the wall"** big numerals, and fixed-price, written-quote messaging.
- The **"What true means" tolerances** content.
- All **functionality and honesty**: live configurator maths, booking states (including "not connected"), CSP, no third-party requests, accessibility and performance.

## Phase 2: creative direction, "The Truing Stand"

**Idea:** the site behaves like a precision instrument in a wheelbuilder's workshop: calibrated, quiet and exact, photographed like a product catalogue. Influences, not copies: Apple's one-idea-per-screen chapters and pinned product; Rapha's editorial confidence and type-led restraint; Canyon's step-by-step configurator with a live product preview.

### Identity
- **Palette** (refined): Frame green #1F4D3A stays the brand colour but moves to deliberate full-bleed "chapters"; a deeper workshop green #10241B for the hero and instrument panels; cool paper #EEF0EC and studio grey #DDE1DC for product shots; brass #E2B23A used only for measured values, the active choice and the primary action. No gradients except studio light falloff behind products.
- **Type**: Big Shoulders Display for headlines and numerals (larger contrast between levels); Instrument Sans for reading (body raised to 19 to 20 px on desktop, darker grey); add IBM Plex Mono only for measured readouts (tension %, mm, grams, kgf), as a gauge would show them, not for labels.
- **Grid and spacing**: a 12-column grid with an editorial asymmetric layout; an 8 px base with section spacing from 96 to 160 px; one idea per screen on mobile.
- **Shape language**: square corners for product photography and full-bleed chapters; one small radius (6 px) for controls; pills removed. Hairline rules (1 px) like an engineering drawing; registration-mark corners only where they frame a measurement.
- **Imagery**: replace dark renders with studio-style product renders on a light seamless sweep with soft contact shadows (catalogue look), plus macro crops (hub flange, spoke crossing, nipple at the rim). Renders are labelled as renders; real workshop photography is recommended before launch and the layout is built to take it.

### Section plan
1. **Hero**: full viewport. Large studio wheel render; the tension chart becomes an instrument panel layered on it, reading live; headline set larger with tighter leading. Clear primary action; header transparent over the hero, then solid.
2. **Craft chapter**: the product stays pinned while the tolerances step through one at a time (spread, wobble, hop, dish, stress relief), each with a macro render and a gauge readout. Reduced motion shows the same content as a static list.
3. **Prices**: a workshop price board with tabular alignment, an "includes" list per service and turnaround as a measured value; the most booked service marked by a brass rule rather than a pill.
4. **Configurator**: a two-pane purchasing experience. A sticky live preview that changes with the choices (rendered variants for rim depth and spoke count), numbered steps (a real sequence), each option showing its price and weight difference, a running total that rolls digit by digit, and on phones a sticky summary bar with the live total and "Book this build".
5. **Process**: rebuilt as a "build card", the document customers actually receive, with the four stages as its rows.
6. **Booking**: service chosen with visual radio tiles; drop-off day picked from the next available Tuesday to Saturday dates (native date input kept as a fallback); a live summary of what is being requested; every existing state preserved.
7. **FAQ and footer**: FAQ kept; footer becomes useful (hours, booking link, honest sample-site note) instead of decoration.

### Mechanical micro-interactions (all respect reduced motion)
- Option chips move with a short "detent" (a slight overshoot and settle, like a ratchet click).
- Prices and totals roll digit by digit when they change.
- The tension chart keeps the knock-and-true interaction; its spokes settle with a damped spring.
- Buttons press 1 px with a hard shadow, like a key.

### Verification plan (phase 4)
Git checkpoint first; Playwright at 320, 390, 768, 1024, 1440 and 1920 px; every link, configurator option and form state tested; layout-shift, overflow, console and accessibility checks; Lighthouse mobile and desktop; repeat visual passes until every area scores 8 or better; GitHub Pages compatible (no build server).

## Sources consulted
- Rapha identity and editorial: [It's Nice That on Six and Frost's 2026 Rapha type system](https://www.itsnicethat.com/articles/six-frost-rapha-branding-project-250626), [D&AD on Mondial](https://www.dandad.org/work/d-ad-awards-archive/mondial)
- Canyon configurator: [Cycling Weekly on MyCanyon](https://cyclingweekly.com/products/canyon-offers-hand-painted-frames-and-custom-builds-with-the-launch-of-its-mycanyon-personalisation-service), [BikeRadar on MyCanyon](https://www.bikeradar.com/news/mycanyon-bike-customisation)
- Apple product-page storytelling: [UX Collective, autopsy of an Apple webpage](https://uxdesign.cc/autopsy-of-an-apple-webpage-cbfebed98b6c), [Baymard on Apple's mobile product page](https://baymard.com/ecommerce-design-examples/41-product-page/26249-apple)

## After the redesign (2026-11-27)
These are my own scores against the same rubric as the audit. They are not an independent review. The evidence is in `docs/production-readiness.md`.

| Area | Before | After | What moved it |
|---|---|---|---|
| Brand and identity | 6 | 8 | The Truing Stand system: workshop green chapters, brass only for measured values and actions |
| Typography | 7 | 8 | A larger display scale, mono for measurements only, and values that never wrap |
| Composition | 5 | 8 | 12-column asymmetric layout, hairline rules, and one idea per screen on phones |
| Imagery | 4 | 7 to 7.5 | Studio renders on light sweeps, plus macros and 18 configurator variants. They are still renders, so real photography is the next step |
| Storytelling | 5 | 8 | The craft chapter walks through five tolerances; the build card shows what customers receive |
| Configurator | 5 | 9 | Live preview, per-option differences, an odometer total and a mobile total bar |
| Pricing | 7 | 8.5 | A price board with includes lists and turnaround |
| Booking | 6 | 8.5 | Service tiles, one-tap days and a live summary, with every state kept |
| Mobile | 6 | 8.5 | Every section reviewed at 320 and 390 px, with sticky bars only where useful |
| Micro-interactions | 5 | 8 | The detent, key-press and odometer effects, all off with reduced motion |
| Accessibility and performance | 10 | 10 | Kept at Lighthouse mobile 97/100/100/100 and desktop 100/100/100/100, with CLS 0 |
| Overall | 6.2 | About 8.4 | The remaining gap to leaders is mainly real photography and real proof (reviews, business details) |

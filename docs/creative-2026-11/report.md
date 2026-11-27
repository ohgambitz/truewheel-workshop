# Creative direction pass, 2026-11-27

**New objective:** Truewheel Workshop is a fictional showcase, and visual quality is the priority.

**Checkpoint:** git tag `checkpoint-before-creative` (commit 51b80f9; local only, because tag pushes fail from this environment).

## Audit of the site before this pass
- **First impression:** competent and calm, but static. The hero was a still render beside a headline, with a small instrument panel overlapping the wheel. Nothing rewarded scrolling.
- **Originality:** the strongest original idea, the tension instrument, was squeezed into the hero corner.
- **Product imagery:** clean renders, but generic: plain black tyres, no surface detail, no brand on the product.
- **Typography:** good system, but section headings were modest next to what the hero needed. The page ended on a standard footer.
- **Transitions:** sections butted together. The hero just scrolled away.

## What changed
1. **Imagery, second generation (made with three.js through Remotion).** The same model and lighting are used for every image on the site.
   - Tan-wall tyres with sidewall lettering and a tread band.
   - A TRUEWHEEL decal wrapped round the rim.
   - Brass nipples on every spoke.
   - ACES tone mapping and rim lights that separate the product from a dark page.
   - Re-rendered: 9 configurator variants, 2 close-ups, the hero and the social image.
2. **Cinematic hero.** A pinned stage with a 96-frame scroll-scrubbed sequence: the wheel turns, then comes apart along its axle, with tyre, rim, nipples and hub separating in turn.
   - Oversized type (17vw on desktop) sits behind the product.
   - Callouts draw in like a technical drawing, in two aligned columns on desktop and as a numbered legend on phones and portrait tablets.
   - "Taken apart. Built back by hand." closes the sequence.
   - Frames have the studio glow baked in and blend into the page through a radial mask, which keeps them small: 2.9 MB desktop and 1.6 MB phone, loaded after first paint, coarse to fine.
   - Frame 0 is the static hero image, so first paint doesn't wait for the sequence.
3. **Section transition.** The light craft section rises over the pinned hero with a shadow. The header switches to solid as that edge passes beneath it.
4. **Instrument relocated.** The tension demo is now a dark gauge panel at the start of the craft chapter, where it explains what "true" means.
5. **Editorial scale.** Section headings go up to 8.4rem, and the craft measurements are larger.
6. **Ending.** The footer closes on a full-width outlined TRUEWHEEL wordmark with a brass initial.

## Refinement passes (screenshots in this folder)
- **Pass 1, art direction (`pass1-hero.jpg`):** found the hero cropped by the header, the wheel oversized mid-scroll, the exploded state covered too soon, colliding labels, and old-model images elsewhere. All fixed.
- **Pass 2, sections and interactions (`pass2-hero.jpg`):** two-column callouts, outro moved, phone wheel sizing, instrument panel layout, heading scale, footer wordmark.
- **Pass 3, detail and mobile (`pass3-tablet.jpg`):** portrait-tablet treatment, label column on narrower desktops, readout and outro collision, tablet text overlap, social image.

## Measured
- **Functional tests:** 34/34 (`node tests/functional.mjs`).
- **Layout audit:** 6/6 widths (`node tests/visual.mjs creative`).
- **Lighthouse, local server (uncompressed):**

  | Run | Speed / access / practices / SEO | First text | Main image | TBT | CLS | Weight |
  |---|---|---|---|---|---|---|
  | Desktop | 100 / 100 / 100 / 100 | 0.5 s | 0.7 s | 0 ms | 0.006 | 3.6 MB |
  | Phone | 93 / 100 / 100 / 100 | 1.8 s | 3.0 s | 10 ms | 0.006 | 2.2 MB |

  The total page weight includes the sequence frames, which load after first paint. Live results are below.

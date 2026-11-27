# Agency-level audit and portfolio pass, 2026-11-27

**Scope:** an independent audit of the live site after the polish pass, then only the improvements that add real quality. No redesign: the Truing Stand identity, content and every existing function are kept.

**Checkpoint:** git tag `checkpoint-before-portfolio` on commit 1245ccc. The tag is local only, because tag pushes fail from this environment.

**Already done in earlier passes, not repeated here:**
- The full audit and creative direction (`docs/audit-2026-11/`).
- The design system (`docs/design-system.md`).
- Five rounds of section polish (`docs/polish-2026-11/report.md`).

## 1. Audit findings (from rendered pages at 1440, 768, 390 and 320 px)
| Area | Finding | Severity | Action |
|---|---|---|---|
| Configurator | Any combination was accepted, including ones a workshop can't build (a road hub in a 29 inch mountain wheel, a 32-hole hub with 24 spokes). A real builder must catch these. | High | Compatibility rules (section 2) |
| Configurator | Each option's difference was computed for that part alone, so it would be wrong once a choice forces another part to change. | High, with the above | Differences now come from the whole resolved build, and are tested |
| Configurator | Rim choice is the biggest decision, yet the only depth cue was the render's subtle rim height. | Medium | Rim profile drawn to scale |
| Configurator | Nothing to take away. Premium bike and component brands let you keep or share a spec; here the build vanished on reload. | Medium | Downloadable PDF build specification |
| Product imagery | The product images appeared with no sense of arrival, while the text around them had reveals. | Low to medium | One shutter reveal for product images (section 3) |
| Mobile hero | The wheel, the actual product, was about 60% width and partly covered by the tension instrument. | Medium | Full-width wheel, instrument tucked under it |
| Copy consistency | The craft stage readout said "three passes" while the step said "3 passes". | Low | Fixed |
| Generic patterns | The hero facts "Fixed / Written / 12 months" were a vague three-stat strip typical of template sites. | Medium | Replaced with specific, measurable facts: "0.2 mm max wobble", "$65 safety check", "12 months free re-true" |
| Quote rows | The previous pass's flash padding pushed the rows 10 px past the column edge. | Low | Flash now drawn with shadows, so layout is untouched |
| Accessibility | New brass text on light surfaces would have been below AA for small text. | Caught before release | Ink text with a brass marker instead |

### Compared with premium cycling and component sites
These comparisons are from general familiarity with how such sites present products, not a fresh study, so they are stated as patterns rather than claims about any one site.
- **Spec depth:** component brands present rims by measured profile (depth, width) and sizes by their standard dimensions. The site now shows depth to scale and the ISO bead seat diameter (622 mm for 700c and 29 inch, 584 mm for 650b).
- **Configurators:** bike configurators stop or adjust impossible combinations instead of quoting them. This is now in place, with the reason always stated.
- **Take-away spec:** a printable or downloadable spec is common for high-value builds. This is now in place, as a real PDF.
- **Restraint:** premium cycling sites let product photography carry the page. The biggest remaining gap is still real photography; the renders are good but are labelled as renders.

### Checked and kept as they are
- **Repeated section headers** (heading left, paragraph right): this is consistent editorial structure, not repetition for its own sake. Varying it would make the page less coherent.
- **The craft chapter's long scroll on desktop:** it is the pinned-stage storytelling device and works as intended in a real scroll.
- **Hero image animation:** not added. Animating the largest image delays the largest paint, which visitors feel as a slower page.

## 2. Configurator upgrade
- **Compatibility validation.** Four rules, each with a plain reason, are defined in `src/configurator.ts`:

  | Rule | Reason shown |
  |---|---|
  | 29 inch and Shimano 105 | road hub, so it doesn't fit mountain-bike frames |
  | 29 inch and Chris King R45 | road hub, so it doesn't fit mountain-bike frames |
  | 29 inch and Carbon aero | our 45 mm aero rims are road rims and aren't made in 29 inch |
  | Shimano 105 with 24 or 28 spokes | we stock Shimano 105 hubs drilled for 32 spokes only |

  The part picked last always wins, so the customer never hits a dead end. A conflicting part switches to the closest compatible option (the default first), and a notice beside the step explains the change. Every option states in advance what it would change ("sets DT Swiss 350"), and the changed parts flash in the quote and the spec sheet.

  The rules reflect common product facts (Shimano 105 and Chris King R45 are road hubs) and this sample shop's stock (32-hole 105 hubs, road-only aero rims). As with the prices, they are illustrative and should be confirmed with the real business.
- **Accurate differences.** Each option's price, weight and lead-time difference is computed from the full resolved build, including any part it would swap. A functional test clicks nine options and checks that each stated difference matches the actual change in the total.
- **Responsive product visualisation.**
  - The studio render crossfades between 18 variants (rim × spoke count), as before.
  - New: a rim cross-section to proportion, where the hooks, bead shelves and well stay fixed and the body extends to 22, 30 or 45 mm on a spring curve, beside the depth, bead seat and spoke count.
  - On phones it becomes a compact panel.
- **Downloadable build specification.** "Download build spec (PDF)" creates a real one-page A4 PDF in the browser.
  - It contains a build reference (the same build always gets the same reference), the date, the render of the chosen build, the full specification, the line-item estimate, the total and lead time, the workshop tolerances, and an honest note that it is an estimate and a sample business.
  - There is no library and no server. The 7 KB module loads only when the button is pressed, uses the standard PDF fonts, and works on GitHub Pages under the existing Content-Security-Policy.

## 3. Motion added (all off with reduced motion and in print)
- **Product reveal:** the craft stage, the configurator preview and the phone step images open with a shutter wipe while the image settles from a 6% zoom. It runs once, only for images below the first screen.
- **Mechanical:** the rim profile extends like a gauge, and forced part changes click into place with the existing detent animation.

## 4. Verification (local server unless marked live)
See the main report for the measured before-and-after table.

### Measured before and after (2026-11-27)
"Before" is commit 1245ccc, measured earlier the same day; "after" is commit f9d9ae2 and later.

| Measure | Before | After |
|---|---|---|
| Functional checks | 28/28 | 34/34 locally and 34/34 against the live site |
| Layout audit, 6 widths (320 to 1920) | 6/6 | 6/6 |
| Lighthouse live, mobile (perf/a11y/BP/SEO) | 100/100/100/100, LCP 1.4 to 1.5 s, CLS 0 (4 runs) | 100/100/100/100, LCP 1.5 s, CLS 0 (4 runs) |
| Lighthouse live, desktop | 100/100/100/100, LCP 0.4 s | 100/100/100/100, LCP 0.4 s |
| Lighthouse local, mobile (uncompressed) | 96, LCP 2.6 s (3 runs) | 95 to 96, LCP 2.7 s (3 runs) |
| Lighthouse local, desktop | 100/100/100/100 | 100/100/100/100 |
| Page weight, live mobile | 427 KiB | 430 KiB (the 7 KB PDF module loads only on click) |

The local phone result is within run-to-run noise, but slightly worse rather than better: the stylesheet grew again. The live site, which serves files compressed, is unchanged at 100.

The new functional checks cover:
- Swapping a road hub when 29 inch is chosen, with the reason shown.
- Shimano 105 forcing a road size and 32 spokes.
- A later spoke choice swapping the hub instead.
- Each of nine options' stated differences matching the real change in total.
- The rim profile redrawing to 45 mm.
- The downloaded PDF being valid, with its text matching the build on screen (checked with `pdftotext`).

The PDF was also parsed with pypdf (one page, one embedded image) and rendered with `pdftoppm` for visual review.

Captures are in `docs/portfolio-2026-11/` (`round1`, `round2` and the live `after` set), with comparison sheets `compare-mobile.jpg` and `compare-desktop.jpg`. The "before" captures are `docs/polish-2026-11/after`.

## Remaining limitations
- **Photography:** product images are 3D renders, labelled as such. Real photography is the largest remaining gap against premium cycling sites.
- **Rules and prices:** the compatibility rules, prices, lead times and business details are illustrative for this sample business, and say so.
- **Booking:** not connected. The form says nothing was sent until `data-endpoint` is set.
- **Browsers:** tested in Chromium only (no Safari or Firefox in this environment). The PDF uses standard fonts and baseline PDF 1.4 features.
- **The local phone Lighthouse score** dipped 0 to 1 point, as above.

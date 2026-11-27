# Production readiness report

Date: 2026-11-27. Scope: the Truing Stand redesign of the Truewheel Workshop website.

**Checkpoints:**
- `checkpoint-before-truing-stand` (commit a3e0a3b, the audit before this redesign).
- `checkpoint-before-premium` (the earlier rebuild).

Both tags are local only, because pushing tags to GitHub failed from this environment. The commits themselves are on GitHub.

## Verdict
**Technically ready; not yet ready for real customers.** Function, layout, accessibility, performance and security checks pass, with evidence below. Three business inputs are still missing, and the site says so instead of faking them (see Blockers).

## What changed in this redesign
The audit and creative direction are in `docs/audit-2026-11/audit-and-direction.md`, and the design system is in `docs/design-system.md`.
- **Hero:** studio wheel render with the live tension instrument layered on it.
- **Craft chapter:** five tolerances shown in sequence, with a pinned stage on desktop.
- **Price board:** service rows with an includes list, turnaround and price.
- **Configurator:** a two-pane purchasing flow, with an option-by-option price, weight and lead-time difference, 18 rendered previews, an odometer total and a mobile total bar.
- **Build card:** the process stages, laid out as the card customers receive.
- **Booking:** service tiles, one-tap drop-off days and a live summary.
- **Micro-interactions:** the detent, key-press and odometer effects, all respecting reduced motion.
- **Other:** a new social sharing image, and removal of the eight renders the old design used.

## Functional tests: 26/26 pass (`node tests/functional.mjs`)
**Page health:**
- No console errors, CSP violations, failed requests or third-party requests.
- Every in-page link has a target, and the first Tab reaches the skip link.
- The header switches between transparent and solid at the hero edge.

**Tension chart and craft chapter:**
- The chart re-trues after a knock.
- The craft chapter shows the rim frame and "0.3 mm or less" for the rim step.

**Configurator:**
- The default total is $984.
- The Carbon option shows "+$880" and its weight difference, and choosing it gives $1,864.
- The preview switches to the carbon render, then to the 32-spoke render.
- Chris King hubs give "Ready in 14 to 17 days".
- All 18 preview renders exist.
- "Book this build" prefills the booking form.

**Booking:**
- The day chips set the date.
- An empty submit shows inline errors, and Monday is rejected.
- With no endpoint, the form says nothing was sent.
- An endpoint returning 200 gives a loading state, then success.
- An endpoint returning 500 gives a loading state, then a recoverable error.

**Mobile:**
- The menu opens, and closes on a link and on Escape.
- The mobile booking bar hides over the hero.
- The builder's sticky total bar shows the live total.

## Visual audit: 6/6 widths pass (`node tests/visual.mjs final`)
At 320, 390, 768, 1024, 1440 and 1920 px:
- No horizontal overflow.
- No off-screen or clipped text.
- All phone tap targets are at least 44 px.

Full-page screenshots are in `docs/screenshots/final/`, and each pass was also reviewed by eye.

Fixes made during the passes:
- Dimmed craft steps failed contrast. The active step is now marked with a brass rule instead of dimming the others.
- The day chips' accessible names didn't match their visible text. The aria-label was removed.
- The hero buttons wrapped differently before and after the web font loaded, causing a layout shift (CLS 0.097). Under 600 px they now stack, and CLS is 0.
- LCP was 3.2 s on mobile. The hero image now decodes immediately, has an 800 px size, and scripts below the first screen wait for idle time. LCP is now 2.4 s.
- The "Most booked" flag failed contrast at 2.8:1. It is now ink with a brass square.
- At 320 px, the step thumbnails, build card rows and the "other day" field were tightened and stacked.

## Lighthouse (final code, local static server; reports in `docs/lighthouse/final-*`)
| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Mobile | 97 | 100 | 100 | 100 | 1.6 s | 2.4 s | 0 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.4 s | 0.6 s | 0 ms | 0 |

The mobile page weight is 477 KiB. Images load in responsive WebP sizes, and the 18 configurator variants load only when chosen.

## Security and privacy
- **CSP:** a Content-Security-Policy meta tag allows scripts, styles, fonts and images from this site only. There are no inline scripts, `object-src` is `'none'`, and `base-uri` is `'self'`.
- **Third parties:** none. Fonts are self-hosted, and there are no analytics or trackers.
- **Credentials:** none in the repository. The booking endpoint is a public URL in `data-endpoint`, never a secret.
- **DOM:** built with `createElement` and `textContent`. There is no `innerHTML`, `eval` or `new Function`.

## Blockers before real customers
1. **Booking endpoint.** Set `data-endpoint` on the booking form to a URL that accepts JSON, such as a Formspree form or your own API. Until then, the form tells visitors honestly that nothing was sent.
2. **Real business details.** The name, prices, hours and turnaround are illustrative, and the footer says so. No address, phone number or email is shown, because none was supplied.
3. **Real reviews.** No testimonials are shown. Add genuine reviews when you have them.

## Known limitations
- **Imagery:** product images are renders of a 3D model, labelled as such. Real workshop and product photography is the biggest remaining improvement, and the layout is built to take it.
- **Browsers:** testing ran in Chromium only. `color-mix` needs Safari 16.2+ and Firefox 113+.
- **Hosting:** Lighthouse ran against a local static server. GitHub Pages adds compression and its own cache headers, and cannot set custom response headers.

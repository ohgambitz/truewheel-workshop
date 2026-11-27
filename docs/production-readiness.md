# Production readiness report

Date: 2026-11-27. Scope: the Truewheel Workshop website in this repository. Checkpoint before the rebuild: git tag `checkpoint-before-premium`.

## Verdict
**Technically ready; not yet ready for real customers.** Code, layout, accessibility, performance and security checks all pass with evidence below. Three business inputs are missing, and the site says so instead of faking them (see Blockers).

## Stage evidence
| Stage | Status | Evidence |
|---|---|---|
| 1. Research and planning | Done | `docs/research.md`: audience, sourced customer-priority findings, competitor pattern scan |
| 2. Design direction | Done | `docs/design-direction.md` |
| 3. Design system | Done | `docs/design-system.md`: colour, type, spacing, radius, component and state tokens |
| 4. High-fidelity design | Done | Rendered product images (assembled and exploded wheel) in `assets/img`; screenshots in `docs/screenshots/` |
| 5. Implementation | Done | Static HTML + CSS + strict TypeScript modules (`src/` compiled to `assets/js/`); one dev dependency (TypeScript) |
| 6. Functional testing | Pass, 17/17 | `node tests/functional.mjs` (output below) |
| 7. Visual audit | Pass, 7/7 widths | `node tests/visual.mjs final`; screenshots in `docs/screenshots/final/`, plus a dark-mode capture |
| 8. Performance and security | Pass | Lighthouse 100/100/100/100 mobile and desktop (`docs/lighthouse/`); CSP; secret scan clean |
| 9. Final polish | Done | Fixes listed below |
| 10. This report | Done | |

## Functional tests (17/17 pass)
No console errors or CSP violations; no failed requests; no third-party requests; every in-page link has a target; first Tab reaches the skip link; tension chart re-trues; configurator default $984, Carbon rims $1,864, Chris King hubs add a week; "Book this build" prefills the form; empty submit shows three inline errors and focuses the first; Monday is rejected; with no endpoint the form states nothing was sent; with an endpoint returning 200 the form shows a loading state then success; with 500 it shows loading then a recoverable error; mobile menu opens and closes on link and Escape; mobile booking bar hides over the hero and appears mid-page.

## Visual audit
Widths 320, 375, 390, 768, 1024, 1440, 1920: no horizontal overflow, no off-screen or clipped text, all mobile tap targets at least 44 px. Issues found by eye and fixed across three passes:
- Product images rendered empty in captures (lazy loading); the audit now scrolls like a visitor.
- "What most bikes need each season" tag wrapped awkwardly on phones; shortened.
- Opening hours broke mid-time; times no longer wrap.
- Mobile booking bar covered the hero chart and duplicated the booking form; it now appears only between them and is removed from tab order when hidden.
- Selected configurator chips were hard to see in dark mode; selected chips now get a brass outline.
- Footer wordmark failed contrast (1.43:1); raised to 3.3:1.
- Header logo link was 28 px tall; now 44 px.

## Lighthouse (final code, local static server)
| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 | 1.4 s | 1.7 s | 0 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0.4 s | 0.4 s | 0 ms | 0 |
Total assets 424 KB: WebP images in four widths with `srcset`, self-hosted WOFF2 fonts (two preloaded), no frameworks.

## Security and privacy
- Content-Security-Policy meta tag: scripts, styles, fonts and images from this site only; no inline scripts; `object-src 'none'`; `base-uri 'self'`.
- No third-party requests (fonts self-hosted, no analytics or trackers).
- No credentials in the repository (scan clean); the booking endpoint is a public URL set in `data-endpoint`, never a secret.
- DOM built with `createElement`/`textContent`; no `innerHTML`, `eval` or `new Function`.
- GitHub Pages serves HTTPS. It cannot set custom response headers, so HSTS and frame-ancestors rely on GitHub's defaults.

## Accessibility
Skip link, landmark structure, labelled form controls with `aria-describedby` errors and `aria-invalid`, live regions for the price, chart reading and form status, visible focus rings, 44 px targets, reduced-motion support (chart and transitions), contrast verified by Lighthouse.

## Blockers before real customers
1. **Booking endpoint.** The form is built to POST JSON to the URL in `data-endpoint` on the form element (for example a Formspree form URL or your own API). Until one is set, it honestly tells visitors nothing was sent.
2. **Real business details.** Name, prices, hours and turnaround are illustrative, and the footer says so. Address, phone number and email are not shown because none were supplied.
3. **Real reviews.** The placeholder reviews section was removed; add genuine reviews when available.

## Known limitations
- Browser testing ran in Chromium only (the environment has no Firefox or WebKit). The code uses widely supported features (CSS `color-mix`, `IntersectionObserver`, ES modules); `color-mix` needs Safari 16.2+ and Firefox 113+.
- Product images are renders of a 3D model, labelled as such; real workshop photos would add trust.
- Lighthouse ran against a local static server; GitHub Pages adds compression and its own cache headers.

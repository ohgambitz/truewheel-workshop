# Design system: the Truing Stand

The site is built around one idea: a wheel on a truing stand. Everything is measured, aligned and quiet, and brass marks only what matters.

## Colour tokens (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| --paper | #EEF0EC | #0E1D16 | page background |
| --studio | #DDE1DC | #18291F | product sweeps, price board rows |
| --surface | #F8F9F6 | #13241B | form, quote and build card surfaces |
| --workshop | #10241B | #0A1711 | hero and instrument panels |
| --frame | #1F4D3A | #173E2E | brand chapters (booking, footer) |
| --ink | #14271F | #E7EEE9 | body text |
| --soft | #44584E | #A9BBB0 | secondary text |
| --rule | #BFC9C2 | #2C4438 | 1 px hairline rules |
| --brass | #E2B23A | #E8BC4A | measured values, the active choice, the primary action |
| --brass-deep | #B8871A | #E8BC4A | brass on light grounds where contrast needs it |
| --on-frame | #EEF0EC | #EEF0EC | text and chart lines on green |

No gradients, except the studio light falloff behind product renders. Contrast is checked by Lighthouse (100 accessibility) and by eye on each pass.

## Type
- **Display:** Big Shoulders Display 800/900, used for headlines and large numerals. The hero is set at clamp(4rem, 10.5vw, 11rem).
- **Text:** Instrument Sans 400/600. Body is 18 px on phones and 19 to 20 px on desktop, at 1.6 line height.
- **Measurement:** IBM Plex Mono 500, used only for measured values (mm, %, g, days, prices in the quote), never for labels. These values never wrap.
- All fonts are self-hosted WOFF2. The two preloaded faces use `font-display: optional`, so there is no layout shift.

## Layout
- 12-column grid with an asymmetric editorial layout. Maximum content width is 1320 px; the side gutter is max(16px, safe-area inset).
- 8 px base unit. Sections are spaced clamp(88px, 11vw, 160px) apart.
- One radius (6 px) for controls. Product images and full-bleed chapters have square corners. There are no pills.
- Hairline 1 px rules, like an engineering drawing.

## Components
- **Header:** transparent over the hero, solid after it (`data-over`). The Book button is always visible, and phones get a menu.
- **Hero:** studio wheel render bleeding off the right edge, with the live tension instrument (the chart, a spread readout and a "Knock it out of true" button).
- **Craft chapter:** on desktop, a pinned stage swaps hub, rim and wheel frames as five tolerance steps scroll past, with a mono readout. On phones and with reduced motion, it is a plain list with a thumbnail per step.
- **Price board:** each row shows the service, turnaround, an includes list and the price. "Most booked" is marked by a brass square, not a pill.
- **Configurator:** four numbered steps (size, rim, hub, spokes). Each option shows its price, weight and lead-time difference against the current choice. The live preview crossfades between 18 rendered variants. The quote lists each line, an odometer total, weight and lead time. On phones a sticky bar carries the total and "Book this build".
- **Build card:** the four process stages, laid out as the card customers receive.
- **Booking:** service tiles, one-tap chips for the next six open days (with a native date input as fallback), a live summary line, and inline errors.
- **FAQ:** native `details` elements.
- **Footer:** hours, links and the sample-site note.
- **Mobile booking bar:** shown only between the hero and the builder, and from the builder to the booking form.

## States
- **Buttons:** default, hover, active (a 1 px press with a hard shadow, like a key), focus-visible, disabled and busy.
- **Form:** idle, validating (inline errors), submitting, success, error and not-connected.
- **Configurator:** always has a selection. The selected chip turns ink with brass delta text reading "Selected".

## Motion
Everything below is off with `prefers-reduced-motion`.
- **Detent:** a selected chip dips and settles in 260 ms on a spring curve, like a ratchet click.
- **Odometer:** totals roll digit by digit in 520 ms.
- **Tension chart:** trues over 1.6 s at load, and again after a knock, with a damped spring.
- **Craft chapter:** frames crossfade in 420 ms.

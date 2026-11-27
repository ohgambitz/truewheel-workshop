# Stage 3: Design system

## Colour tokens (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| --ground | #F1F3EE | #0F2219 | page background |
| --surface | #FFFFFF | #15291F | form and quote surfaces |
| --frame | #1F4D3A | #163B2C | brand bands (hero, booking, footer) |
| --ink | #173A2C | #E6EEE8 | body text |
| --soft | #4E6A5C | #9DB3A6 | secondary text |
| --mist | #C9D3CC | #2E4A3D | rules and borders |
| --brass | #E2B23A | #E8BC4A | single accent: primary action, active state, chart |
Contrast targets: body text 4.5:1 or better, large display text 3:1 or better (verified in stage 7).

## Type
- Display: Big Shoulders Display 800/900, self-hosted WOFF2. Sizes: hero clamp(3.6rem, 12vw, 10rem); h2 clamp(2.6rem, 6vw, 4.4rem); h3 1.7rem.
- Text: Instrument Sans 400/600, self-hosted WOFF2. Body 18px / 1.6; small 0.85-0.95rem.

## Space and layout
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 128 px. Section rhythm clamp(72px, 10vw, 128px).
- Max content width 1200px; side gutter max(16px, safe-area inset).
- Radius scale by role: 999px buttons and chips, 14-20px panels, 0 on full-bleed bands.

## Components
Header with sticky booking button; hero with tension chart and wheel render; price board rows; configurator chips and quote panel; numbered steps (real sequence only); booking form with states; FAQ disclosure; footer.

## States
Buttons: default, hover, active, focus-visible, disabled, busy. Form: idle, validating (inline errors), submitting (busy button), success, error, not-connected. Configurator: always has a selected value (no empty state needed).

## Motion
Durations 150-250ms for UI, one page-load moment (the tension chart truing over 1.6s). Everything respects prefers-reduced-motion.

# Premium polish pass, 2026-11-27

**Scope:** a visual and interaction polish of the existing Truing Stand site. No rebuild, and no changes to brand, content structure or working functionality.

**Checkpoint:** git tag `checkpoint-before-polish` on commit 15d841c. The tag is local only, because tag pushes fail from this environment.

## How it was inspected
- `tests/sections.mjs` captures every major section at desktop (1440), tablet (768) and phone (390) widths.
  - Before: `before/`, captured from the live site.
  - Inspection rounds: `round2/` to `round5/`.
  - After: `after/`, captured from the live site.
- Interaction states (knock, truing, trued, price-row hover and configurator change) are in `states/`.
- Five rounds of capture and inspection ran. Each round's findings are below.

## Round findings and fixes
| Round | Found | Fixed |
|---|---|---|
| 1 | The quote said "Pair, estimated weight" with no number. | The weight now appears next to the total, kept in sync with the preview caption. |
| 1 | Footer hours used 24-hour time while the booking section used am/pm. | Footer uses am/pm. |
| 1 | "drop-off" broke across lines in headings and the privacy note. | It no longer breaks. |
| 1 | The price note read "labour and spokes, from". | It now reads "from $420, labour and spokes". |
| 1 | Price list dashes rendered at alternating weights (sub-pixel lines). | Text dashes render evenly. |
| 1 | On phones, the hero glow showed as a tall vertical stripe. | The glow is a circle behind the wheel. |
| 1 | The phone instrument had an empty right column and a wrapped button. | The dial is on the left, with the reading and button on the right. |
| 1 | The FAQ's left column was empty. | It has a line on how to ask anything else, linked to booking. |
| 1 | The footer wordmark sat below the column labels. | Measured and aligned. |
| 1 | The tension readout's live region announced every animation frame to screen readers. | One announcement when truing finishes. |
| 2 | The spec readout looked like a debug list. | It is now a key/value spec sheet. |
| 2 | Section captures showed hidden reveal rows (a capture-timing issue, not a site bug). | The capture waits for page scripts; a print rule keeps reveals visible on paper. |
| 3 | On phones, the spec sheet covered the wheel. | Phones show values only, and the wheel sits right of centre. |
| 4 | On phones, options sat in a 2-column grid with an orphaned third option. | Each option is a full-width row, with the part on the left and its difference on the right. |
| 5 | The odometer showed a gap around the narrow "1" mid-roll; the brass flash touched the text edges. | Digits are centred on equal-width reels; the quote rows have inner padding. |

## Interaction and motion added (all off with reduced motion)
- **Tension demo:**
  - A knock jolts the readings out of true, with a short decaying shake.
  - After a beat, the wheel is trued spoke by spoke round the rim. The active spoke is highlighted brass, and each settles with a damped spring.
  - The readout counts down live, and the label follows the phases ("knocked out", "truing, spoke by spoke", "after truing").
  - The canvas is resized only when the window changes, not on every frame.
- **Configurator:**
  - A spec sheet on the preview flags the part just changed with a brass marker.
  - The matching quote line flashes brass once.
  - The preview crossfades with a slight turn.
  - The selected option has a brass base rule; other options lift with a soft shadow on hover.
  - Quote lines separate the part from the price, with prices in mono.
- **Scroll reveal:** section headings, price rows, configurator steps, build card rows, the booking form, FAQ items and footer columns rise 14 px and fade in once, staggered within each group.
  - Only content below the fold when the page starts is affected, so nothing visible flashes.
  - Transforms don't shift layout (CLS stays 0).
- **Hover states:**
  - Price rows grow a brass rule and their price shifts slightly.
  - FAQ questions change colour, the icon turns with a spring, and answers ease open.
  - Footer links underline from the left.

## Verification
- **Functional:** 28/28 checks pass (`node tests/functional.mjs`). This adds three checks:
  - The knock, spoke-by-spoke truing and single announcement.
  - The spec sheet and quote line flagging the changed part.
  - The weight shown in the quote.
- **Layout:** 6/6 widths (320, 390, 768, 1024, 1440, 1920) pass with no overflow, no clipped text and 44 px phone tap targets (`node tests/visual.mjs polish-final`).
- **Lighthouse:** results are in the main report and in `docs/lighthouse/polish-*`.
- **GitHub Pages:** still plain static files, with TypeScript compiled to `assets/js` and committed. There is no build server, and the CSP is unchanged (all motion uses CSS classes or CSSOM styles, with no inline styles or scripts).

## Lighthouse (measured 2026-11-27)
| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Live site, mobile (4 runs, all identical scores) | 100 | 100 | 100 | 100 | 1.0 s | 1.4 to 1.5 s | 10 to 20 ms | 0 |
| Live site, desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.4 s | 0 ms | 0 |
| Local server, mobile (uncompressed, 3 runs) | 96 | 100 | 100 | 100 | 1.7 s | 2.6 s | 0 ms | 0 |
| Local server, desktop | 100 | 100 | 100 | 100 | 0.4 s | 0.6 s | 0 ms | 0 |

The local server sends files uncompressed, so its mobile numbers are pessimistic. Before this pass the local score was 97 with a 2.4 s LCP. The difference comes from the stylesheet growing from 30 KB to 36 KB uncompressed (8.5 KB as GitHub Pages serves it). The live site, which is what visitors get, scores 100. Reports are in `docs/lighthouse/live-polish-*` and `docs/lighthouse/polish-*`.

## Live interaction check (Playwright against the deployed site, 390 and 1440 px)
No console errors, failed requests or horizontal overflow at either width. The following worked:
- The tension demo knocks out, trues and announces "Trued. Tension spread is now 2%."
- Choosing Carbon gives $1,864, updates the spec sheet to Carbon, and shows a weight of 1,484 g in both places.
- "Book this build" selects Custom wheel build and fills the notes.
- An empty submit marks the name as invalid.
- With a day chip, name and email filled in, the form honestly says online booking isn't switched on.
- The FAQ opens.

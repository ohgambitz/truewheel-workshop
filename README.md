# Truewheel Workshop

Website for a hand-built wheel and bicycle-service workshop (sample business). Live at https://ohgambitz.github.io/truewheel-workshop/

## Structure
- `index.html`: page markup, metadata and Content-Security-Policy
- `assets/css/site.css`: design tokens and components (see `docs/design-system.md`)
- `src/*.ts`: TypeScript source, compiled to `assets/js/` (committed, so GitHub Pages serves it without a build step)
- `assets/img/`, `assets/fonts/`: responsive WebP renders and self-hosted fonts
- `tests/`: Playwright functional and visual checks (dependency-free static server)
- `docs/`: research, design direction, design system, screenshots, Lighthouse reports, production readiness report

## Develop
```
npm install
npm run build
node tests/functional.mjs
node tests/visual.mjs latest
```

## Connect booking
Set `data-endpoint` on the booking form in `index.html` to an HTTPS URL that accepts a JSON POST (for example a Formspree form endpoint). Without it, the form validates and tells the visitor plainly that nothing was sent.

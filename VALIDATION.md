# Validation — Sanfelice Studio

Last checked: 20 November 2026.

## HTML — W3C Markup Validation Service

- Validator: W3C Nu HTML Checker (https://validator.w3.org/nu/)
- Files checked: `index.html`, `aboutme.html`, `portraits.html`, `editorials.html`, `projects.html`, `contact.html`
- Shared components: `components/navbar.html` and `components/footer.html` are HTML fragments loaded into every page by `assets/js/components.js`, so they were validated inside a full HTML document (as they appear on the pages).
- Result: **0 errors, 0 warnings** on every file.

## CSS — W3C CSS Validation Service (Jigsaw)

- Validator: W3C CSS Validation Service (https://jigsaw.w3.org/css-validator/), profile CSS level 3 + SVG
- File checked: `assets/css/style.css`
- Result: **0 errors, 0 warnings**.
- Bootstrap 5.3.9 and Font Awesome are loaded from CDNs and are not part of the custom code, so they were not validated.

### Changes made to pass the validator

A first run reported 6 errors and 1 warning. They came from modern CSS features the validator does not recognise yet, so the same results were rebuilt with validated code:

- Container queries (`container`, `@container`) on the Contact page → replaced with media queries (`@media`).
- Scroll-driven animation (`animation-timeline: view()`, `animation-range`) for the gallery photos → replaced with an `IntersectionObserver` in `assets/js/components.js` plus CSS transitions (also works in Firefox now).
- Warning: vendor prefix `-webkit-backdrop-filter` → removed; current browsers support `backdrop-filter`.

## Lighthouse

- Tool: Lighthouse 12 (same engine as Chrome DevTools → Lighthouse), run on the deployed site.
- Every page scores **100** in Accessibility, Best Practices and SEO, on desktop and mobile.

| Page | Desktop: Performance | Mobile: Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| Home | 99 | 94 | 100 | 100 | 100 |
| The Artist (About) | 97 | 92 | 100 | 100 | 100 |
| Portraits | 99 | 95 | 100 | 100 | 100 |
| Editorials | 99 | 80 | 100 | 100 | 100 |
| Projects | 99 | 95 | 100 | 100 | 100 |
| Contact | 99 | 95 | 100 | 100 | 100 |

### Changes made after the first Lighthouse run

- Home desktop Performance was 66: the WebGL VHS effect was set up while the page was still loading (620 ms of blocking time). It now starts after the page has loaded and the browser is idle → 99.
- About SEO was 92: the four "See More" links had the same text. Each one now has visually hidden text naming its service (e.g. "See More photography work") → 100.
- Editorials mobile Performance (80) is limited by the size of the magazine cover images; the gallery images are being re-exported at smaller sizes.

## Screenshots

Screenshots of the passed HTML, CSS and Lighthouse checks are included in the README.

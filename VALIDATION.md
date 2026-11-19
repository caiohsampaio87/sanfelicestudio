# Validation — Sanfelice Studio

## HTML
- Validator: W3C Markup Validation Service (https://validator.w3.org)
- Files checked: `index.html`, `aboutme.html`, `portraits.html`, `editorials.html`, `projects.html`, `contact.html`, `components/navbar.html`, `components/footer.html`
- Result: No errors, no warnings (see screenshots provided by the author).

## CSS
- Validator: Stylelint (demo with project `.stylelintrc` exceptions applied)
- File checked: `assets/css/style.css`
- Result: 0 problems (see screenshots provided by the author).

### W3C CSS Validator (additional check)
- Validator: W3C CSS Validation Service
- File checked: `assets/css/style.css`
- Reported errors: 6, all false positives from modern CSS features not yet recognized by the validator:
  - `container` / `@container` (container queries) — lines 886, 917, 1132
  - `animation-timeline: view()` — lines 1674, 1678
  - `animation-range` — line 1679
- These features are supported by current browsers (Chrome/Edge/Safari); the site renders correctly. The validator is outdated for these properties.

## Notes
- W3C CSS validator was not used (considered outdated for this project).
- Screenshots of both validations are kept in the project records.
# Core rules

Read this before writing any interface. Paths assume the system is vendored at `vendor/design-system/`.

## The vocabulary is closed

- Style comes only from the system's tokens and `ds-` components. Write no raw colour, off-scale size, font, shadow or inline style.
- Utility classes are for layout, spacing and sizing only. A colour, border, radius, shadow or type utility fails the check.
- Choose a component from `components-index.json`: names, purposes and classes. Then open its one entry in `components.json` and copy the example. Never guess a class name. Example paths are relative to the gallery: point icon links at the vendored `icons.svg`.

## Order of choice

1. A catalogue component. `choosing-components.md` maps a need to one. For a whole screen, start from a page pattern, listed there too.
2. Layout primitives: `ds-stack`, `ds-cluster`, `ds-split`, `ds-grid`, `ds-sidebar-layout`, `ds-container`.
3. An app-local component under the app's own class prefix, styled with tokens only and declared in the app's gaps file. Never invent a `ds-` class.

## Disclosure limits

- One primary action per view. An open dialog or sheet is its own view.
- An action repeated for each item in a list, table or card set is never primary.
- One advanced-settings disclosure per view.
- Disclosures nest at most two levels.
- Every summary has text.
- No critical action sits only inside collapsed content. Mark a critical action with `data-ds-critical`.

## Check the result

- Static scan: `node vendor/design-system/checker/check.mjs --config design-system.config.json`. It exits 0 when clean and runs inside the app's test command.
- Rendered check: the app's end-to-end tests inject `check-dom.js` and call `dsCheckDom()` on each screen and each overlay.
- Fix every finding. Never edit the vendored copy. A waiver must give a reason, and every run prints it.

## Longer files in `rules/`

- `choosing-components.md`: when picking a component, or when nothing fits.
- `disclosure.md`: when deciding what a view shows first and what it hides.
- `never.md`: before any visual choice the catalogue has not made for you.
- `content.md`: when writing a label, a message or any other copy.
- `principles.md`: when laying out a new screen.
- `checker-rules.md`: when a finding needs explaining.
- `review-rubric.md`: when reviewing a finished screen.

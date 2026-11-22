# Working on Groundwork

Groundwork is a shared design system. Apps copy `dist/` into their own repo and use nothing else from here.

## Rules

- `dist/` is generated. Never edit a file in it by hand. Change the source, run `npm run build`, and commit the source and the regenerated `dist/` together.
- `tokens/tokens.css` is the single source for tokens. The Tailwind preset, the token data file, the design token block and the manifest are all derived from it by `scripts/build.mjs`.
- The token vocabulary is closed. Do not add a token name to solve a local problem. A theme changes values only.
- Every custom property starts with `--gw-` and every class starts with `gw-`.
- Colour tokens are six-digit hex. No `rgb()`, `oklch()`, `color-mix()` or `light-dark()` in a colour token, because consumers parse computed values as `#rrggbb`.
- A dark value goes in both the `[data-theme="dark"]` block and the `[data-theme="auto"]` block. The build fails if the two differ.
- A new text and background combination needs an entry in `tokens/pairs.json`. The build fails when a text pair is below 4.5:1 or a `ui` pair is below 3:1, in either theme.
- The one breakpoint is 768px. A custom property cannot be used in a media query, so write the number there.
- `base/` holds the reset, typography, layout primitives, focus ring, fonts and icons. The build bundles them with the tokens into `dist/groundwork.css` and copies fonts and icons into `dist/`.
- `checker/` is the checker, shipped as source in `dist/checker/`. It has no dependencies.
- A structural rule is a function over a document tree in `checker/rules/`. It must run unchanged on a parsed HTML file and in a browser, so it uses only the tree helpers in `checker/rules/tree.mjs`, never `node:` modules or the DOM. The build joins the files listed in `DOM_BUNDLE` in `scripts/build.mjs` into `dist/check-dom.js`: add a new rule file to that list, and keep top-level names unique across those files.
- No runtime dependencies. Development dependencies are for tests (React and esbuild only build a test fixture) and for `npm run vendor`, which copies font and icon files from `node_modules` into `base/`. The build never reads `node_modules`.
- Node 24, ES modules. Tests use `node --test`.

## Commands

- `npm run build` regenerates `dist/` and prints the contrast report.
- `npm run test:visual` runs the browser tests in the installed Chrome, including the structural rules on rendered pages.
- `npm test` runs the tests. One of them rebuilds into a temporary directory and fails, naming the file, if the committed `dist/` is stale.

Before finishing, run `npm run build` and then `npm test`. `git status` must show no change in `dist/` that you have not accounted for.

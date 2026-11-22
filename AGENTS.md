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
- `base/` holds the reset, typography, layout primitives, the visually hidden class, focus ring, fonts and icons. The build bundles them with the tokens into `dist/groundwork.css` and copies fonts and icons into `dist/`.
- `components/<name>/` is one component: `<name>.css`, `examples.html` and `meta.json`, all written by hand. `docs/authoring.md` is the contract for them. Read it before adding or changing a component.
- `patterns/<name>/` is one page pattern: a whole screen composed from components, such as a settings page. It holds the same three files as a component, built to the same contract, with `"kind": "pattern"` in `meta.json` and only the layout CSS the screen needs. A pattern cannot take the name of a component.
- The build bundles pattern styles after every component, lists patterns in the `patterns` array of `dist/components.json` (the `components` array holds components only), adds their classes to the manifest and gives each a gallery page whose examples run in one column. It also writes `dist/components-index.json`, the short list an agent reads first: name, kind, title, purpose, status and classes of every component and pattern. The gallery index lists patterns after components.
- To add a component, add its folder and nothing else. The build puts it in `dist/groundwork.css`, `dist/components.json`, the manifest's class list and the gallery, and fails, naming the folder, if the folder breaks the contract.
- Component styles key off native state and ARIA attributes, never off a class a script would toggle. No component uses an inline `style` attribute.
- `gallery/` holds the gallery's own stylesheet and script. They select by element and `data-gallery` attribute, use token values only, and are not part of the system.
- `behaviors/` holds the optional scripts the system ships, copied to `dist/behaviors/`. Each is a single ES module with no dependencies that defines one element for an app without a framework: `groundwork.js` defines `<gw-tabs>`, `combobox.js` defines `<gw-combobox>` and `command-palette.js` defines `<gw-command-palette>`. A framework app loads none of them and sets the same ARIA attributes itself. A module sets attributes only, never a class or an inline style, and is harmless when loaded twice. Every gallery page loads every module in `behaviors/`, in alphabetical order.
- `checker/` is the checker, shipped as source in `dist/checker/`. It has no dependencies.
- The build reads every rule ID out of the checker's source into the `rules` list of `dist/manifest.json`. It finds an ID written as `id: "…"`, `rule: "…"`, `add(line, "…")` or `scaleCategory("…")`, so write a new rule's ID in one of those forms.
- `rules/` holds the rules an app's agents read, written by hand and copied to `dist/rules/`. `rules/core.md` is the one file every agent reads, and the build fails when it is longer than 2,400 characters. Put detail in the longer files and point to them from `core.md`.
- Every rule ID the checker can report has a row in `rules/checker-rules.md`: the ID, what it means and the fix. Add the row with the rule.
- In a rules file, a code span holding one lower-case word names a component, a checker rule, a system class or a `data-` or `aria-` attribute, and a test checks that each exists. `rules/choosing-components.md` names every component and every pattern, so add a new one there.
- `hooks/` holds the optional Claude Code hook and its example settings, copied to `dist/hooks/`.
- `scripts/sync.mjs` copies `dist/` into an app and writes `hashes.json` there. On an update it prints the components, patterns and rules that were added, changed or removed. `docs/consumer-guide.md` is how an app adopts the system. A test sets up an app from the commands and files in that guide, so keep its code blocks exact.
- The build copies `LICENSE` and `NOTICE` into `dist/`, so a vendored copy carries them.
- The version is the `version` in `package.json`, which the build writes to `dist/VERSION`. A release raises it and adds an entry to `CHANGELOG.md`.
- A structural rule is a function over a document tree in `checker/rules/`. It takes the tree and an options object, which holds the app's class prefix when one is known. It must run unchanged on a parsed HTML file and in a browser, so it uses only the tree helpers in `checker/rules/tree.mjs`, never `node:` modules or the DOM. The build joins the files listed in `DOM_BUNDLE` in `scripts/build.mjs` into `dist/check-dom.js`: add a new rule file to that list, and keep top-level names unique across those files.
- No runtime dependencies. Development dependencies are for tests (React and esbuild only build a test fixture) and for `npm run vendor`, which copies font and icon files from `node_modules` into `base/`. The build never reads `node_modules`.
- Node 24, ES modules. Tests use `node --test`.

## Commands

- `npm run build` regenerates `dist/` and prints the contrast report.
- `npm run test:visual` runs the browser tests in the installed Chrome, including the structural rules on rendered pages. For the gallery it runs axe, measures pointer targets and rewrites the screenshots in `test/visual/screenshots/`, which are committed for review.
- `npm test` runs the tests. One of them rebuilds into a temporary directory and fails, naming the file, if the committed `dist/` is stale.

Before finishing, run `npm run build` and then `npm test`. After changing a component or the gallery, run `npm run test:visual` too and look at the screenshots. `git status` must show no change in `dist/` that you have not accounted for.

# Design system

A design system for apps whose interfaces are largely written by AI coding agents. It gives the agent a closed vocabulary of design tokens and components, and a checker that fails a frontend which steps outside that vocabulary. Screens come out consistent with each other and without the generic AI-generated look, and you can change the look of every app that uses it in one place.

It is for a developer, or a coding agent, building web frontends: plain HTML, React or another framework. Version 0.11.4. Every component is still marked `draft`, and one app uses it so far. See [Status and limits](#status-and-limits).

The run timeline component under the Botbench theme, dark and light:

<p>
  <img src="test/visual/screenshots/run-timeline-1280-dark-botbench.png" alt="Gallery page of the run timeline component under the Botbench theme in dark mode" width="49%">
  <img src="test/visual/screenshots/run-timeline-1280-light-botbench.png" alt="Gallery page of the run timeline component under the Botbench theme in light mode" width="49%">
</p>

## Why use it

- **Change the brand once.** A theme can set the value of any of the system's tokens, colours, radii and fonts among them. An app links the theme's stylesheet, and when the theme changes here, the app picks it up with its next sync, with no change to its own markup. Fonts and icons also live here and arrive the same way.
- **A checker that fails the test run.** The checker scans an app's CSS, HTML, JSX, TSX and class names in script, and a second copy of the structural rules runs on rendered pages from the app's end-to-end tests. Its 41 rules cover, among others, raw colours, off-scale sizes, unknown classes, gradients and blur, more than one primary action in a view, nested cards, badge clutter, emoji as icons and stock phrases. It exits 1 on findings, so it runs in the app's own test command.
- **Plain CSS classes on ordinary HTML.** A component is class names such as `ds-button ds-button--primary` on native elements. It works from React, another framework or none. There is no runtime dependency; seven optional script modules cover the few components that need behaviour.
- **The build checks accessibility.** The build fails when a text pair is below 4.5:1 or a border or focus pair below 3:1, in light and dark, for every theme. Pointer targets are at least 44px in both directions on a coarse pointer and 24px on a fine one, with controls 40px tall by default and a compact density for lists and tables. Tabs, combobox, command palette, menu and listbox have keyboard behaviour, and every transition stops when the reader asks for reduced motion. The browser tests run axe on every gallery page.
- **Made for agent-built interfaces.** Agents read one short rules file ([`rules/core.md`](rules/core.md), under 2,400 characters), choose from a machine-readable index of every component, and copy the example markup. The catalogue has components for transcripts, tool calls, approvals, step groups, run timelines and long runs, and a page pattern for the screen of one agent run.
- **Evidence.** In a [blind-build trial](docs/trial-report.md) two agents that had never seen this repository each built three screens from a synced copy of version 0.3.0 alone; all six passed the static scan, the rendered rules and axe with no findings, waivers or declared gaps. An [independent audit](docs/audits/2026-11-22-independent-audit.md) of 0.7.0 approved it with conditions, scoring it between 3 and 7 out of 10 on ten dimensions; what it criticised is summarised under [Status and limits](#status-and-limits).

### When it is not a fit

- **You need Safari support proven on a real iPhone, or support for older browsers.** The tests of the components Botbench uses pass in Playwright's WebKit and Firefox at phone and desktop widths, but nothing has been tried in iOS Safari itself, and the components use recent platform features. See [browser support](docs/browser-support.md).
- **You want a typed React component library.** Components are CSS classes; the app writes the markup. Five React source files ship for the interactive pieces an app most often wires by hand, nothing more.
- **You want an npm package.** An app copies `dist/` into its own repository with the sync script.
- **You use Tailwind 4.** The preset is for Tailwind 3. The stylesheet works without Tailwind.
- **You want to add your own tokens or restyle one component freely.** The token set is closed and a theme changes values only, which is the point of the system.
- **You need a stable API today.** Every component is still `draft`.

## Quickstart

This takes about two minutes and ends with the checker passing a page you wrote, then failing it when you break a rule. You need Git, Node 24 or later, Python 3 (or any static file server) and a current Chrome. `dist/` is committed, so there is nothing to install or build.

1. **Clone and serve the repository.**

   ```sh
   git clone https://github.com/botbenchhq/design-system.git
   cd design-system
   python3 -m http.server
   ```

2. **Write a page.** Save this as `try.html` in the repository root:

   ```html
   <!doctype html>
   <html lang="en">
   <head>
     <meta charset="utf-8">
     <title>Try the design system</title>
     <link rel="stylesheet" href="dist/design-system.css">
   </head>
   <body>
     <main class="ds-container ds-stack">
       <h1>Invite a teammate</h1>
       <div class="ds-cluster">
         <button type="button" class="ds-button ds-button--primary">Send invite</button>
       </div>
     </main>
   </body>
   </html>
   ```

   Open `http://localhost:8000/try.html`. You should see a heading in IBM Plex Sans and one filled button under it, in a centred column on an off-white page.

3. **Check it.** In a second terminal, from the repository root:

   ```sh
   node dist/checker/check.mjs try.html
   ```

   ```
   0 findings, 0 waivers, 0 declared gaps, 1 file scanned, 41 rules
   ```

4. **Break a rule.** Change the button to the kind of thing the system exists to stop, and run the same command:

   ```html
   <button type="button" class="ds-button ds-button--primary" style="background: linear-gradient(#6366f1, #a855f7)">Send invite ✨</button>
   ```

   ```
   try.html:12  inline-style  This element has an inline style attribute. Use a catalogue component or a class. Only a --ds- custom property may be set, and only from script.
   try.html:12  emoji-as-icon  This interface text contains an emoji. Use an icon from the icon set, or remove it.

   2 findings, 0 waivers, 0 declared gaps, 1 file scanned, 41 rules
   ```

   The command exits 1, so the same line fails an app's test run.

5. **Browse the catalogue.** Open `http://localhost:8000/dist/gallery/` for every component and pattern in every variant and state, with its guidance. Add `?theme=dark` for dark mode and `?brand=botbench` for the Botbench theme; the gallery bar links to both.

Delete `try.html` when you are done. To use the system in a real app, go to [Use it in an app](#use-it-in-an-app).

## How a component is built

The catalogue holds 103 components and 8 page patterns (agent run, app shell, filter and results, master and detail, multi-step form, not found, settings page, sign in). Each lives in its own folder of three hand-written files:

| File | Holds |
|---|---|
| `<name>.css` | The styles, in the `ds.components` cascade layer, using tokens only. |
| `examples.html` | Labelled examples of every variant and state, with at least one do and one don't. |
| `meta.json` | Purpose, when to use it and when not, variants, sizes, states, accessibility notes and classes. |

This is the composer's default example, from [`components/composer/examples.html`](components/composer/examples.html):

```html
<form class="ds-composer">
  <label class="ds-composer__label" for="composer-default-prompt">Message Claude Code</label>
  <div class="ds-composer__row">
    <textarea class="ds-composer__input" id="composer-default-prompt" name="prompt" rows="1"></textarea>
    <button type="submit" class="ds-button ds-button--primary">Send</button>
  </div>
</form>
```

State comes from the element itself (`disabled`, `aria-busy="true"`, `aria-invalid="true"`, or a `data-state` attribute for agent activity), never from a class a script toggles, so the same markup works from any framework.

[`test/visual/screenshots/`](test/visual/screenshots/) holds a screenshot of every gallery page, one per page, width and mode, and the browser tests fail when a page no longer matches its screenshot. Icons do not load from a `file:` URL, so serve the folder as the quickstart does.

<details>
<summary>The agent-run page pattern under the Botbench theme, dark (a tall full-page screenshot)</summary>

<img src="test/visual/screenshots/agent-run-1280-dark-botbench.png" alt="Gallery page of the agent-run pattern: app shell, run timeline, transcript with tool calls and an approval, and the composer, under the Botbench theme in dark mode">

</details>

## Use it in an app

You need Node 24 or later, and this repository checked out beside the app. The app takes a copy of `dist/` into its own repository, so nothing loads from another host and the app gains no dependency; the package is not published to npm. [`docs/consumer-guide.md`](docs/consumer-guide.md) has every step in full; this is the short form.

1. **Sync a copy.** With this repository checked out beside the app, run from the app's root:

   ```sh
   node ../design-system/scripts/sync.mjs --to vendor/design-system
   ```

   It copies `dist/` and writes `hashes.json`. Commit the folder and never edit it: the checker fails when a file in it has changed. Run the same command to update; it prints the components, patterns and rules that were added, changed or removed. `--check` writes nothing and prints one line when a newer version exists.

2. **Load the stylesheet.** In plain HTML, serve the folder and link it. Keep `fonts/` and `icons.svg` beside it.

   ```html
   <link rel="stylesheet" href="/vendor/design-system/design-system.css">
   ```

   With Tailwind 3, import the stylesheet from the app's entry and use the preset with preflight off:

   ```js
   import preset from "./vendor/design-system/tailwind-preset.js";

   export default {
     presets: [preset],
     corePlugins: { preflight: false },
     content: ["./index.html", "./src/**/*.{ts,tsx}"],
   };
   ```

   Write no rules in Tailwind's base layer, because Tailwind emits preflight and base rules unlayered and they would override the system's layered styles. The preset replaces every Tailwind scale with token names, so `bg-surface` works and `bg-indigo-500` produces nothing.

3. **Optionally load a theme and choose a mode.** Link the theme after the system's stylesheet, and set `data-theme` on the root element to `light`, `dark` or `auto` (follow the system setting). With no `data-theme`, the page shows light, or the theme's default mode.

   ```html
   <link rel="stylesheet" href="/vendor/design-system/themes/botbench.css">
   ```

4. **Run the static scan in the app's test command.** Add `design-system.config.json` (paths to scan, the app's class prefix, its gaps file and the vendored folder; see [step 3 of the guide](docs/consumer-guide.md#3-add-the-config-file-and-the-gaps-file)), then:

   ```json
   {
     "scripts": {
       "test": "node vendor/design-system/checker/check.mjs --config design-system.config.json && node --test"
     }
   }
   ```

   It exits 0 when clean, 1 on findings and 2 when it could not run, and ends with one summary line such as `0 findings, 0 waivers, 0 declared gaps, 4 files scanned, 41 rules`. The one exception to a rule is an inline `ds-waive` comment that gives a reason.

5. **Run the rendered check in the end-to-end tests.** The structural rules need the rendered page when the app composes it in script. With Playwright:

   ```js
   await page.evaluate(readFileSync("vendor/design-system/check-dom.js", "utf8"));
   expect(await page.evaluate(() => dsCheckDom(document.documentElement, { appPrefix: "app" }))).toEqual([]);
   ```

   Call it on each screen and again with each dialog, sheet, menu and popover open.

6. **Point the app's agents at the rules.** In `AGENTS.md`, `CLAUDE.md` or the like: read `vendor/design-system/rules/core.md` before any interface work; choose a component from `components-index.json`, then open that one entry in `components.json` (it is large, so search it); never edit `vendor/design-system/`. An optional Claude Code hook in `dist/hooks/` blocks edits to the copy and scans each edited file.

When no component fits, the app composes existing ones, and failing that builds its own under its own class prefix with tokens only and declares it in a gaps file, which every run prints. The guide also covers the behaviour modules, the `data-state` contract for agent activity, the React source files and upgrading from 0.5.

## Theming

A theme is one hand-written file, [`themes/<name>.css`](themes/botbench.css), that changes the values of existing tokens in light and dark. It cannot add a name, so every component, utility and checker rule works the same under it, and an app's markup does not change when the theme does. Its rules sit in the `ds.theme` cascade layer, after the default values and before app CSS.

The build stops, naming the theme, when it:

- sets a name that is not one of the 93 tokens, or sets a type size, a line height, a tracking, a radius or a density token;
- lacks light or dark values, or its dark and `auto` blocks differ;
- uses a colour that is not six-digit hex;
- fails any of the foreground and background pairs in [`tokens/pairs.json`](tokens/pairs.json) in either mode: 4.5:1 for text, 3:1 for borders and focus rings. There are 85 for every theme, and 14 more that name the one theme they are checked for.

A theme may declare a default mode. Botbench, the worked example and the one theme shipped, is dark by default. Its look is Graphite + Glacier: Inter and JetBrains Mono, four levels of cool grey surface, and one interactive colour, a blue, for the primary action, focus, selection and active work. Five status colours sit under the system's eight status names, and amber is kept as a small signal for what waits on a person. The type scale and the radius scale are the system's under every theme. The header of [`themes/botbench.css`](themes/botbench.css) explains each choice.

To change the look of every app: edit the theme here, run `npm run build`, and each app runs its sync. The build writes four files per theme to `dist/themes/`: the stylesheet, the theme's name and default mode with the `theme-color` of each mode, a token block for an app's `DESIGN.md`, and the tokens as data. "[Themes](docs/consumer-guide.md#12-themes)" in the consumer guide has the details.

## What is in the repository

| Folder | Holds |
|---|---|
| `tokens/` | `tokens.css`, the single source of every token, and `pairs.json`, the contrast pairs. |
| `themes/` | Themes: token values only. |
| `base/` | Reset, typography, layout classes, focus ring, fonts and icons. |
| `components/` | 103 components, one folder each. |
| `patterns/` | 8 page patterns, built to the same contract. |
| `behaviors/` | Seven optional ES modules for an app without a framework (tabs, combobox, command palette, menu, listbox, elapsed time, transcript). |
| `react/` | TypeScript source for a React 19 app: a busy button, the dialog and the sheet, the approval card, a menu keyboard hook and a transcript-following hook. |
| `checker/` | The static scan and the structural rules. No dependencies. |
| `rules/` | Eight files agents read: `core.md` first, then principles, disclosure, the never list, content, choosing a component, checker rules and the review rubric. |
| `gallery/`, `hooks/`, `scripts/` | The gallery's own CSS and script, the optional Claude Code hook, and the build, sync and codemod scripts. |
| `storytelling/` | An opt-in companion for public-facing work: marketing pages, READMEs, scenes, cards and films. Method, motion, gates, a pinned skill registry and two agent skills. Source only, not in `dist/`. |
| `docs/` | The consumer guide, the authoring contract, the trial report, the audit and the plans. |
| `test/` | Unit and browser tests, fixtures and the committed screenshots. |
| `dist/` | Generated and committed. This is what an app copies. |

`dist/` ships `design-system.css` (the whole system in one stylesheet), `tokens.css` and `tokens.json`, `components.json` (every entry with guidance and example markup), `components-index.json` (one short entry each), `manifest.json` (tokens, classes and rule IDs), `check-dom.js`, `checker/`, `rules/`, `themes/`, `behaviors/`, `react/`, `fonts/`, `icons/` and `icons.svg`, the Tailwind 3 preset with its types, `gallery/`, `hooks/`, the `migrate-prefix.mjs` codemod, `VERSION`, `LICENSE` and `NOTICE`.

### Commands

Node 24 or later. `npm install` fetches development dependencies only.

| Command | Does |
|---|---|
| `npm run build` | Regenerates `dist/` and prints the contrast report. Fails, naming the folder, when a component, pattern or theme breaks its contract. |
| `npm test` | Runs the unit tests, including the checker over every example and a check that the committed `dist/` matches a fresh build. |
| `npm run test:visual` | Runs the browser tests in the installed Google Chrome: axe, the structural rules and pointer-target checks on every gallery page at 390px and 1280px in light and dark, keyboard tests, and a comparison of every gallery page with its committed screenshot. Writes nothing to `test/visual/screenshots/`. |
| `npm run test:visual:update` | Runs the same tests and rewrites the committed screenshots that no longer match, and writes any that are missing. Run it after a change you mean to make, look at the diff, and commit the new screenshots. |
| `npm run test:visual:webkit`, `npm run test:visual:firefox` | Run the tests of the components Botbench uses, at 390px and 1280px, and the keyboard, theme and reflow tests in Playwright's WebKit or Firefox, after `npx playwright install webkit firefox`. No screenshots. |

### Adding a component

Add a folder under `components/` with its three files and run the build; nothing else needs editing. [`docs/authoring.md`](docs/authoring.md) is the contract, and [`AGENTS.md`](AGENTS.md) has the rules for working in this repository.

## Status and limits

- **Version 0.11.4.** [`CHANGELOG.md`](CHANGELOG.md) says what each version holds and what an app must do to upgrade. 0.6.0 renamed the prefix and shipped a codemod for it; no version since has renamed or removed a class, token or rule.
- **Everything is `draft`.** All 103 components and 8 patterns. An app may use a draft, but it may still change.
- **One consumer.** Botbench is the only app that uses it so far.
- **Tested in Chrome, WebKit and Firefox, not on an iPhone.** The whole browser suite runs in Google Chrome. The tests of the components Botbench uses, at 390px and 1280px, and the keyboard, theme and reflow tests also run, and pass, in Playwright's WebKit 27.2 and Firefox 159. Neither has interest invokers, so a tooltip or hover card shows on hover and focus only. Nothing has been tried in iOS Safari or with a screen reader. The components rely on recent platform features: the Popover API, anchor positioning, invoker commands, interest invokers, `:has()` and `field-sizing`. [`docs/browser-support.md`](docs/browser-support.md) has the results per feature and component, and what still needs a real iPhone.

The [audit](docs/audits/2026-11-22-independent-audit.md) of 0.7.0 found five defects that 0.7.2 fixed (menu and listbox keyboard, colour scheme under a theme's default mode, reflow at 320px, wide tables, the command palette's no-match announcement), and 0.7.5 began the React source in `react/`. These findings of the audit are still open:

- The checker does not check `data-state` values, accessible names, `alt` text or whether a badge's tone matches its word.
- The typed React layer covers the busy button, the dialog, confirm dialog and sheet, the approval card, the menu's keyboard and the transcript. Tabs, the combobox, the listbox and the command palette have no React piece: an app uses the behaviour modules or wires them by hand.
- The audit judged the Botbench theme's identity generic (brand distinctiveness 4 out of 10). 0.12.0 replaced that theme's look with Graphite + Glacier, in which the accent and the focus ring share one blue; the new look has not been audited.
- Sizes are built with `calc()` on tokens in places, which the checker does not limit.
- The stylesheet is one 357 KB file (about 68 KB compressed) with no way to load part of it.

## Help and contributing

- **Questions and bugs:** open an [issue](https://github.com/botbenchhq/design-system/issues). For a bug, give the version from `dist/VERSION`, the markup, and the checker's output if it is involved.
- **A component that is missing:** an app declares it in its gaps file ([consumer guide, step 3](docs/consumer-guide.md#3-add-the-config-file-and-the-gaps-file)); an issue that quotes that entry is the best request.
- **Changes:** [`CONTRIBUTING.md`](CONTRIBUTING.md) says how to run the checks and what a pull request needs. [`docs/authoring.md`](docs/authoring.md) is the contract for a component and [`AGENTS.md`](AGENTS.md) the rules for this repository. Run `npm run build` and `npm test` before opening a pull request, and `npm run test:visual` after changing a component.
- **A security problem:** report it privately, as [`SECURITY.md`](SECURITY.md) says, not in an issue.

The system is maintained by [Jon Lange](https://github.com/jon-lange) alongside Botbench, its first consumer.

## Licence

Apache License 2.0. See [`LICENSE`](LICENSE).

The repository and `dist/` include IBM Plex Sans, IBM Plex Mono, Inter and JetBrains Mono under the SIL Open Font License 1.1, and a subset of the Lucide icons under the ISC licence (some derived from Feather, MIT). [`NOTICE`](NOTICE) lists each with its source and licence text, and both files travel with every synced copy.

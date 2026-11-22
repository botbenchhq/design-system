# Design system

A shared design system for a small set of apps. It holds one closed vocabulary of design tokens, a default theme and optional themes that change values only, a base layer of styles, fonts and icons, and the files generated from them. An app copies `dist/` into its own repo.

This repo currently contains the tokens, one theme (Botbench), the base layer, the checker with its static scan and structural rules, the contract every component follows, 98 components built to it, eight page patterns composed from them, five optional behaviour modules, the gallery, the rules agents read, the sync script that puts a copy into an app, and the derived files. The version is in `dist/VERSION`, and `CHANGELOG.md` says what each version holds.

To use the system in an app, follow `docs/consumer-guide.md`. In short:

```sh
node ../design-system/scripts/sync.mjs --to vendor/design-system
```

This copies `dist/` into the app and writes `hashes.json` there. The copy is read-only: the checker fails when a file in it has changed. Running it again updates the copy and prints the components, page patterns and checker rules that were added, changed or removed. It stops, naming the files, when the copy was edited by hand. With `--check` it writes nothing and prints one line when a newer version is available.

To check a frontend against the vocabulary, run `node dist/checker/check.mjs <paths>`. It exits 0 when clean, 1 on findings and 2 when it could not run. Its last line counts the findings, waivers, declared gaps, files scanned and the rules the checker holds.

The structural rules cover one primary action per view, disclosure limits, nested and identical cards, badge clutter, emoji used as icons, repeated stock phrases, centred body text and a view whose controls use no system component. The static scan applies them to HTML files. In an app that composes its pages in script, run them on the rendered page from a browser test:

```js
await page.evaluate(readFileSync("vendor/design-system/check-dom.js", "utf8"));
const findings = await page.evaluate(() => dsCheckDom());
expect(findings).toEqual([]);
```

`dsCheckDom(root, { appPrefix })` takes the element to check and the app's class prefix, both optional. Pass the prefix when the app has components of its own, so a view built from them is not reported as using no system component.

Evaluate the file's text. Injecting it as a script tag fails under a content security policy that allows no inline script.

Each finding is `{ rule, message, fix, snippet }`, where `snippet` is the start of the element's markup.

## What is in `dist/`

| File | Use |
|---|---|
| `design-system.css` | The whole system in one stylesheet: layer order, tokens, reset, base styles, font faces and components. This is the file a page links. |
| `components.json` | Every component, in `components`: its purpose, when to use it and when not to, its variants, sizes, states, accessibility notes, classes, and the markup of each example. Read it before writing markup. Every page pattern, in `patterns`: the same fields and `"kind": "pattern"`, with a whole screen as each example. |
| `components-index.json` | One short entry per component and pattern: name, kind, title, purpose, status and classes. Read it to choose, then open the one entry in `components.json`. |
| `gallery/` | A static page per component and per page pattern showing every variant and state, with a do and a don't. Serve `dist/` and open `/gallery/`. |
| `behaviors/` | Five optional ES modules with no dependencies, for an app without a framework. `tabs.js` defines `<ds-tabs>`, `combobox.js` defines `<ds-combobox>`, `command-palette.js` defines `<ds-command-palette>`, `elapsed.js` defines `<ds-elapsed>` and `transcript.js` defines `<ds-transcript>`. Each does what its component needs from script. |
| `fonts/` | IBM Plex Sans and IBM Plex Mono, with their licence. `design-system.css` loads them by relative URL, so keep the folder beside it. |
| `icons.svg` | The icon sprite. Each icon is a `<symbol>` with the id `ds-icon-` and its name. |
| `icons/` | The same icons as single files, for CSS that needs one as a mask or background, with their licence. |
| `tokens.css` | The custom properties, light and dark, on their own. `design-system.css` already contains them. |
| `tokens.json` | The same tokens as data, in the Design Tokens Community Group format. Dark values are under `$extensions["design-system"].dark`. |
| `themes/` | Each theme as four files: `<name>.css`, linked after `design-system.css`; `<name>.json`, with its default mode and the page background of each mode for `theme-color`; `<name>.design-tokens.md`, the token block with its values; and `<name>.tokens.json`, the token data with its values. See "Themes" below. |
| `tailwind-preset.js`, `tailwind-preset.d.ts` | A Tailwind 3 preset whose values are references to the custom properties. |
| `design-tokens.md` | The token block for the front matter of an app's `DESIGN.md`. |
| `manifest.json` | Token names and allowed values by category, the breakpoint, the utility classes a screen may use, every class of the system, and every rule ID the checker can report. |
| `checker/` | The checker. It has no dependencies and reads `manifest.json` beside it. |
| `check-dom.js` | The structural rules as one classic script for a browser test to inject. It defines `dsCheckDom(root, { appPrefix })`. |
| `migrate-prefix.mjs` | The codemod an app runs once over its own source when it upgrades from 0.5: it rewrites the old `gw` prefix and the old file names. See "Upgrading from 0.5" in `docs/consumer-guide.md`. |
| `rules/` | The rules an agent reads. `core.md` is short and every agent reads it. It says when to open the longer files: principles, disclosure, the never list, content, choosing a component, the checker's rules and the review rubric. |
| `hooks/` | An optional Claude Code hook that denies edits to the vendored copy and runs the static scan on an edited file, with an example settings fragment. |
| `VERSION` | The version of this copy. |
| `LICENSE`, `NOTICE` | The licence and the notice of the system, so a vendored copy carries them. |

`dist/` is generated and committed. Do not edit it by hand.

## Tokens

Every custom property starts with `--ds-`. The categories are colour roles (among them the status roles success, warning, danger, info, approval, blocked, peer and tainted, each with a `-subtle` background), font families, a six-step type scale with line heights, font weights, six spacing steps, two radii and a full radius for a circle or a pill, a border width, one overlay shadow, three durations and one easing curve, a layering scale, fixed sizes and the breakpoint.

The vocabulary is closed. A theme can change a token's value. It cannot add a name.

Colour tokens are six-digit hex, so code that reads a computed value can parse it as `#rrggbb`.

## Light and dark

Light is the default. Set `data-theme` on the root element to change that.

| `data-theme` | Result |
|---|---|
| not set | Light, or the default mode of a loaded theme |
| `light` | Light |
| `dark` | Dark |
| `auto` | Follows the system setting |

## Themes

A theme is a stylesheet that changes token values, in light and dark, and adds no name. Link it after `design-system.css`:

```html
<link rel="stylesheet" href="/vendor/design-system/themes/botbench.css">
```

Its rules are in the `ds.theme` layer, after `ds.tokens`, so its values win. A theme may declare a default mode: Botbench is dark when the root has no `data-theme`. The build checks every theme against every pair in `tokens/pairs.json` in both modes and fails, naming the theme, the pair and the ratio. The source is `themes/<name>.css`. "Themes" in `docs/consumer-guide.md` has the rules and how to write one.

Botbench maps its brand kit onto the roles: an amber primary action with dark text in dark mode and white text on a deeper amber in light mode, warm paper and charcoal surfaces, a 6px `radius-md`, and its own colours for the eight statuses. The header of `themes/botbench.css` lists each brand value that was changed to pass contrast or to stay apart from another status.

## Cascade layers

`tokens.css` declares the layer order:

```css
@layer ds.reset, ds.tokens, ds.theme, ds.base, ds.components;
```

System CSS sits in these layers. `ds.theme` holds a theme's values when one is loaded, and is empty otherwise. App CSS and Tailwind utilities are unlayered, so they always win over system CSS without a specificity contest.

## Base layer

`design-system.css` styles a bare HTML page with no other stylesheet.

The reset is in `ds.reset`. It sets `box-sizing: border-box` and `border: 0 solid` on every element, removes default margins and list markers, and makes form controls inherit the page's font and colour. It follows the same element defaults as Tailwind's preflight, which a Tailwind app turns off.

Type, layout and focus are in `ds.base`. Body text is IBM Plex Sans at the `ui` size, and a long unbroken word such as a path breaks instead of overflowing. `h1`, `h2` and `h3` take the three largest sizes, each a step under the one before. `code`, `kbd`, `samp` and `pre` use IBM Plex Mono. A link with no class is underlined.

Every focusable element gets the same ring from the focus colour token when it is focused from the keyboard.

When the system asks for reduced motion, every transition runs for zero seconds. The rule is `!important` in the first layer, so no later layer and no app CSS can undo it.

### Layout classes

| Class | Result |
|---|---|
| `ds-stack` | Children one above the other. |
| `ds-cluster` | Children in a row that wraps, such as buttons or tags. |
| `ds-split` | Two groups pushed to opposite ends, such as a title and its actions. |
| `ds-grid` | One column. Add `ds-grid-2`, `ds-grid-3` or `ds-grid-4` for that many equal columns at 768px and wider. |
| `ds-sidebar-layout` | The first child beside the second at 768px and wider, and above it when narrower. The first child sets its own width. |
| `ds-container` | A centred column no wider than the transcript size. Add `ds-container-narrow` for the column size. |

Each has a default gap. Add `ds-gap-xs`, `ds-gap-sm`, `ds-gap-md`, `ds-gap-lg`, `ds-gap-xl` or `ds-gap-2xl` to change it.

`ds-visually-hidden` keeps text out of sight and available to assistive technology, such as the label of an icon-only control.

## Components

A component is class names on plain HTML: `ds-button`, a part such as `ds-button__icon`, a variant such as `ds-button--primary`. State comes from the element itself (`disabled`, `aria-busy="true"`, `aria-invalid="true"`), never from a class.

```html
<button type="button" class="ds-button ds-button--primary">Start task</button>
```

`dist/components.json` lists each component with markup to copy. An example names the icon sprite as `icons.svg#ds-icon-…`; put the path the app serves the system from in front of it. A component marked `draft` may still change, and an app may use it.

The gallery switches mode with `?theme=dark` and loads a theme with `?brand=botbench`, and its bar links to both. Its pages carry no inline style and no inline script.

`dist/components.json` also lists the page patterns, in `patterns`. A pattern is a whole screen composed from the components, such as a settings page or a sign-in screen, with a little layout of its own. Start a new screen from one.

Almost every component needs no script. A few do: something has to move the ARIA attributes when the reader picks a tab, types into a combobox or searches the command palette, a time that counts up has to be written again each second, and a transcript that grows has to follow its newest row only while the reader is at the bottom. `dist/behaviors/` holds five optional modules, one for each. Load only the ones the app uses, and wrap the component's markup from `components.json` in the module's element.

| Module | Element | What it does |
|---|---|---|
| `behaviors/tabs.js` | `<ds-tabs>` | For the tabs component: sets `aria-selected`, `tabindex` and `hidden`, and handles click, Left, Right, Home and End. |
| `behaviors/combobox.js` | `<ds-combobox>` | For the combobox component: as the reader types it sets `hidden` on the options that do not match, `aria-expanded` and `aria-activedescendant` on the input and `aria-selected` on the active option, and writes the count into the `role="status"` line. It handles Down, Up, Home, End, Enter, Escape and a press on an option. |
| `behaviors/command-palette.js` | `<ds-command-palette>` | For the command palette component: filters the commands as the reader types, hides a group left with no match, sets `aria-selected` and `aria-activedescendant` as Down and Up move the selection, presses the selected command on Enter and closes the dialog. With `shortcut="k"` it opens the dialog on Ctrl+K and Cmd+K. |
| `behaviors/elapsed.js` | `<ds-elapsed>` | A time that counts up, for a tool call, a step group, the now-doing line and the run timeline: it shows the time since its `datetime` attribute and writes it again once a second, stops when its `data-state` is anything but `running`, and shows a fixed length when it has a `duration` attribute. It carries `aria-live="off"`, so no tick is announced. |
| `behaviors/transcript.js` | `<ds-transcript>` | For a transcript that grows: it keeps the newest row in view while the reader is within 60px of the bottom, stops when they scroll up, counts the rows added since and shows the jump-to-latest control, and follows again when they press it or reach the bottom. It sets `hidden` and the count, and never moves focus. |

```html
<script type="module" src="/vendor/design-system/behaviors/tabs.js"></script>
<script type="module" src="/vendor/design-system/behaviors/combobox.js"></script>
<script type="module" src="/vendor/design-system/behaviors/command-palette.js"></script>
<script type="module" src="/vendor/design-system/behaviors/elapsed.js"></script>
<script type="module" src="/vendor/design-system/behaviors/transcript.js"></script>
```

Each module sets attributes only, never a class or an inline style; the two for agent activity also write the time and the count as text, and the transcript module sets the scroll position. None opens or closes a step group: that is the app's job, and the step group's metadata gives the rule. They are for an app without a framework. An app that renders with a framework leaves the modules out and sets the same ARIA attributes itself: the stylesheet reads those attributes and nothing else.

To add a component or a page pattern, follow `docs/authoring.md`.

## Fonts

The fonts are IBM Plex Sans, as one variable file covering weights 100 to 700, and IBM Plex Mono at 400, 500 and 600. Both are the Latin subset and upright only, under the SIL Open Font License. An app serves them from its own host. Nothing is loaded from another site.

## Icons

The icons are a subset of Lucide, under the ISC licence. `base/icons.json` is the list.

```html
<svg width="16" height="16" aria-hidden="true"><use href="/vendor/design-system/icons.svg#ds-icon-check"></use></svg>
```

An icon takes the text colour of the element around it. To add one, add its Lucide name to `base/icons.json`, then run `npm run vendor` and `npm run build`.

## Using the Tailwind preset

The preset targets Tailwind 3.

```js
import preset from "./vendor/design-system/tailwind-preset.js";

export default {
  presets: [preset],
  corePlugins: { preflight: false },
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

Two things are the app's job, because a preset cannot do them safely for it.

Turn off preflight, as above. Tailwind emits preflight unlayered, so it would override every layered system rule on the same property.

Write no rules inside Tailwind's `base` layer. Tailwind emits those unlayered too, with the same effect.

The preset replaces every Tailwind scale. Only token names exist as classes: `bg-surface` works and `bg-indigo-500` produces nothing. Animation, blur and the other filters, opacity, letter spacing, transforms, rings and gradients are emptied. Colour values are `var()` references, so a theme change needs no rebuild, and Tailwind's colour opacity modifiers such as `bg-accent/50` do not work.

## The breakpoint

There is one breakpoint, 768px. Below it a layout is compact, and at or above it regular. A custom property cannot be used in a media query, so write the number: `@media (min-width: 768px)`. In Tailwind it is the `md:` variant, the only one the preset defines.

## Contrast

`tokens/pairs.json` lists the foreground and background roles that are used together. The build computes the WCAG 2 contrast ratio of each pair in light and dark, for the default theme and for every theme. It fails when a `text` pair is below 4.5:1 or a `ui` pair (a border or focus ring against its background) is below 3:1.

`muted` on `surface-sunken` is not a listed pair. In the light theme it is below 4.5:1, so do not put muted text on a sunken surface.

## Development

Node 24. No runtime dependencies.

```sh
npm install
npm run build
npm test
npm run test:visual
```

`npm run build` regenerates `dist/` from `tokens/`, `themes/`, `base/`, `components/`, `patterns/`, `gallery/`, `behaviors/`, `checker/`, `rules/` and `hooks/` and prints the contrast report. It fails, naming the folder, when a component or a pattern breaks the authoring contract, and when `rules/core.md` is longer than 2,400 characters. It reads nothing from `node_modules`. `npm test` includes a check that the committed `dist/` matches a fresh build.

`npm run test:visual` opens a bare page that links `dist/design-system.css` in the Chrome installed on the machine and checks the fonts, the heading sizes, the focus ring, the spacing and that a long unbroken word does not make the page scroll sideways at 390px. It needs Google Chrome and downloads no browser. It also runs `dist/check-dom.js` on the fixture pages and on a small React app, and checks that the rendered and static results agree. For the gallery page of each component and each pattern, at 390px and 1280px in light and dark, it runs axe and the structural rules on the do examples, measures the pointer targets, and writes a screenshot to `test/visual/screenshots/` for review. It does the same for the index and ten pages under the Botbench theme, and checks on a bare page that a theme overrides the default values, that each `data-theme` value and the default mode give the expected background, and that a synced copy's `hashes.json` covers the theme files. It also drives `<ds-tabs>`, `<ds-combobox>` and `<ds-command-palette>` from the keyboard.

`npm run vendor` copies the font files and the icons named in `base/icons.json` from the development dependencies into `base/`. Run it after changing the icon list or a package version.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.

# Groundwork

A shared design system for a small set of apps. It holds one closed vocabulary of design tokens, a default theme, a base layer of styles, fonts and icons, and the files generated from them. An app copies `dist/` into its own repo.

This repo currently contains the tokens, the base layer, the checker with its static scan and structural rules, and their derived files. Components and the sync script are not built yet.

To check a frontend against the vocabulary, run `node dist/checker/check.mjs <paths>`. It exits 0 when clean, 1 on findings and 2 when it could not run.

The structural rules cover one primary action per view, disclosure limits, nested and identical cards, badge clutter, emoji used as icons, repeated stock phrases and centred body text. The static scan applies them to HTML files. In an app that composes its pages in script, run them on the rendered page from a browser test:

```js
await page.addScriptTag({ path: "vendor/groundwork/check-dom.js" });
const findings = await page.evaluate(() => gwCheckDom());
expect(findings).toEqual([]);
```

Each finding is `{ rule, message, fix, snippet }`, where `snippet` is the start of the element's markup.

## What is in `dist/`

| File | Use |
|---|---|
| `groundwork.css` | The whole system in one stylesheet: layer order, tokens, reset, base styles and font faces. This is the file a page links. |
| `fonts/` | IBM Plex Sans and IBM Plex Mono, with their licence. `groundwork.css` loads them by relative URL, so keep the folder beside it. |
| `icons.svg` | The icon sprite. Each icon is a `<symbol>` with the id `gw-icon-` and its name. |
| `icons/` | The same icons as single files, for CSS that needs one as a mask or background, with their licence. |
| `tokens.css` | The custom properties, light and dark, on their own. `groundwork.css` already contains them. |
| `tokens.json` | The same tokens as data, in the Design Tokens Community Group format. Dark values are under `$extensions.groundwork.dark`. |
| `tailwind-preset.js`, `tailwind-preset.d.ts` | A Tailwind 3 preset whose values are references to the custom properties. |
| `design-tokens.md` | The token block for the front matter of an app's `DESIGN.md`. |
| `manifest.json` | Token names and allowed values by category, the breakpoint, and the utility classes a screen may use. |
| `checker/` | The checker. It has no dependencies and reads `manifest.json` beside it. |
| `check-dom.js` | The structural rules as one classic script for a browser test to inject. It defines `gwCheckDom()`. |

`dist/` is generated and committed. Do not edit it by hand.

## Tokens

Every custom property starts with `--gw-`. The categories are colour roles, font families, a six-step type scale with line heights, font weights, six spacing steps, two radii, a border width, one overlay shadow, three durations and one easing curve, a layering scale, fixed sizes and the breakpoint.

The vocabulary is closed. A theme can change a token's value. It cannot add a name.

Colour tokens are six-digit hex, so code that reads a computed value can parse it as `#rrggbb`.

## Light and dark

Light is the default. Set `data-theme` on the root element to change that.

| `data-theme` | Result |
|---|---|
| not set | Light |
| `dark` | Dark |
| `auto` | Follows the system setting |

## Cascade layers

`tokens.css` declares the layer order:

```css
@layer gw.reset, gw.tokens, gw.base, gw.components;
```

System CSS sits in these layers. App CSS and Tailwind utilities are unlayered, so they always win over system CSS without a specificity contest.

## Base layer

`groundwork.css` styles a bare HTML page with no other stylesheet.

The reset is in `gw.reset`. It sets `box-sizing: border-box` and `border: 0 solid` on every element, removes default margins and list markers, and makes form controls inherit the page's font and colour. It follows the same element defaults as Tailwind's preflight, which a Tailwind app turns off.

Type, layout and focus are in `gw.base`. Body text is IBM Plex Sans at the `ui` size. `h1`, `h2` and `h3` take the three largest sizes. `code`, `kbd`, `samp` and `pre` use IBM Plex Mono. A link with no class is underlined.

Every focusable element gets the same ring from the focus colour token when it is focused from the keyboard.

When the system asks for reduced motion, every transition runs for zero seconds. The rule is `!important` in the first layer, so no later layer and no app CSS can undo it.

### Layout classes

| Class | Result |
|---|---|
| `gw-stack` | Children one above the other. |
| `gw-cluster` | Children in a row that wraps, such as buttons or tags. |
| `gw-split` | Two groups pushed to opposite ends, such as a title and its actions. |
| `gw-grid` | One column. Add `gw-grid-2`, `gw-grid-3` or `gw-grid-4` for that many equal columns at 768px and wider. |
| `gw-sidebar-layout` | The first child beside the second at 768px and wider, and above it when narrower. The first child sets its own width. |
| `gw-container` | A centred column no wider than the transcript size. Add `gw-container-narrow` for the column size. |

Each has a default gap. Add `gw-gap-xs`, `gw-gap-sm`, `gw-gap-md`, `gw-gap-lg`, `gw-gap-xl` or `gw-gap-2xl` to change it.

## Fonts

The fonts are IBM Plex Sans, as one variable file covering weights 100 to 700, and IBM Plex Mono at 400, 500 and 600. Both are the Latin subset and upright only, under the SIL Open Font License. An app serves them from its own host. Nothing is loaded from another site.

## Icons

The icons are a subset of Lucide, under the ISC licence. `base/icons.json` is the list.

```html
<svg width="16" height="16" aria-hidden="true"><use href="/vendor/groundwork/icons.svg#gw-icon-check"></use></svg>
```

An icon takes the text colour of the element around it. To add one, add its Lucide name to `base/icons.json`, then run `npm run vendor` and `npm run build`.

## Using the Tailwind preset

The preset targets Tailwind 3.

```js
import preset from "./vendor/groundwork/tailwind-preset.js";

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

`tokens/pairs.json` lists the foreground and background roles that are used together. The build computes the WCAG 2 contrast ratio of each pair in light and dark. It fails when a `text` pair is below 4.5:1 or a `ui` pair (a border or focus ring against its background) is below 3:1.

`muted` on `surface-sunken` is not a listed pair. In the light theme it is below 4.5:1, so do not put muted text on a sunken surface.

## Development

Node 24. No runtime dependencies.

```sh
npm install
npm run build
npm test
npm run test:visual
```

`npm run build` regenerates `dist/` from `tokens/`, `base/` and `checker/` and prints the contrast report. It reads nothing from `node_modules`. `npm test` includes a check that the committed `dist/` matches a fresh build.

`npm run test:visual` opens a bare page that links `dist/groundwork.css` in the Chrome installed on the machine and checks the fonts, the focus ring and the spacing. It needs Google Chrome and downloads no browser. It also runs `dist/check-dom.js` on the fixture pages and on a small React app, and checks that the rendered and static results agree.

`npm run vendor` copies the font files and the icons named in `base/icons.json` from the development dependencies into `base/`. Run it after changing the icon list or a package version.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.

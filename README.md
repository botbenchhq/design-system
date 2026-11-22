# Groundwork

A shared design system for a small set of apps. It holds one closed vocabulary of design tokens, a default theme, and the files generated from them. An app copies `dist/` into its own repo.

This repo currently contains the tokens and their derived files. Components, the checker and the sync script are not built yet.

## What is in `dist/`

| File | Use |
|---|---|
| `tokens.css` | The custom properties, light and dark. Load it first. |
| `tokens.json` | The same tokens as data, in the Design Tokens Community Group format. Dark values are under `$extensions.groundwork.dark`. |
| `tailwind-preset.js`, `tailwind-preset.d.ts` | A Tailwind 3 preset whose values are references to the custom properties. |
| `design-tokens.md` | The token block for the front matter of an app's `DESIGN.md`. |
| `manifest.json` | Token names and allowed values by category, the breakpoint, and the utility classes a screen may use. |

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
```

`npm run build` regenerates `dist/` from `tokens/` and prints the contrast report. `npm test` includes a check that the committed `dist/` matches a fresh build.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.

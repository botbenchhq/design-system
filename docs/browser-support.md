# Browser support

What works in which browser engine, from the browser tests and from probes run on 2026-11-23 on macOS with Playwright 1.65.1:

| Engine | Version | Project | What runs |
|---|---|---|---|
| Google Chrome (installed) | 156.0.8078.80 | `chrome`, the default | The whole browser suite, and the screenshot baselines |
| Playwright's WebKit | 27.2 (Playwright build 2388) | `webkit` | The tests below, at phone and desktop widths |
| Playwright's Firefox | 159.0 (Playwright build 1572) | `firefox` | The same tests as WebKit |

The tests are the gallery tests tagged `@engines` for the components a Botbench user meets, `composer`, `context-list`, `sheet`, `option-picker`, `approval`, `step-group`, `tool-call`, `button`, `dialog`, `menu`, `app-shell` and `agent-run`, and the whole of `composer-context.spec.mjs`, `option-picker.spec.mjs`, `menu.spec.mjs`, `themes.spec.mjs` and `reflow.spec.mjs`. The gallery tests are axe and the structural rules in light and dark at 390px and at 1280px, and the 44px pointer-target check at 390px. That is 249 tests in each engine:

| Width | Tests | WebKit 27.2 | Firefox 159 |
|---|---|---|---|
| 390px (phone): gallery axe, structural rules and pointer targets | 60 | 60 pass | 60 pass |
| 1280px (desktop): gallery axe and structural rules | 48 | 48 pass | 48 pass |
| The five spec files, mostly at 320px and 390px, the menu keyboard tests at 1280px | 138 | 138 pass | 138 pass |

The phone-width tests also pass in WebKit with Playwright's iPhone 13 emulation (touch, a mobile user agent, three device pixels to the CSS pixel). Screenshots at both widths, under the default and the Botbench theme, are compared in Chrome only.

Playwright's WebKit is not iOS Safari. It is WebKit built for macOS, with Playwright's patches, and it has no touch screen, no on-screen keyboard and no iOS browser chrome. A pass here says the engine draws and runs the components; it does not say how they feel on an iPhone. See [What still needs a real iPhone](#what-still-needs-a-real-iphone).

## Platform features

| Feature | Used by | WebKit 27.2 | Firefox 159 |
|---|---|---|---|
| Popover API (`popover="auto"`, `"manual"`, `"hint"`, `:popover-open`) | `menu`, `context-menu`, `split-button`, `popover`, `tooltip`, `hover-card`, `button`, `dialog`, `sheet` | Works | Works |
| Anchor positioning (`anchor-name`, `position-area`, `position-try-fallbacks`, `position-try-order`) | `menu`, `context-menu`, `popover`, `tooltip`, `hover-card` | Works. An open menu hangs from its button as in Chrome. | Works |
| Invoker commands (`command`, `commandfor`) | `dialog`, `sheet`, `composer`, `command-palette` | Works. `command="show-modal"` opens the sheet as a modal dialog. | Works |
| Interest invokers (`interestfor`) | `tooltip`, `hover-card` | Does not work. Not implemented. | Does not work. Not implemented. |
| `:has()` | 20 components, among them `composer`, `option-picker`, `tool-call`, `split-button` | Works | Works |
| `field-sizing: content` | `composer`, `textarea` | Works. The composer's field grows with its text. | Works |
| `@starting-style` and `transition-behavior: allow-discrete` | `sheet` | Works | Works |
| `env(safe-area-inset-bottom)`, `dvh` | `composer`, `sheet`, `now-doing`, `selection-basket`, `command-palette` | Parsed; the insets are zero on a Mac, so only an iPhone shows them | Parsed |

## Components

| Component | WebKit 27.2 |
|---|---|
| `composer`, `context-list`, `option-picker`, `approval`, `step-group`, `tool-call`, `button`, `app-shell`, `agent-run` | Works: axe, structural rules and 44px targets at 390px, the composer's row at 320px and 390px, dictation state, the option picker's keys and long paths |
| `sheet`, `dialog` | Works: opens as a modal from its command button, Back and Close are reached in order |
| `menu`, `context-menu`, `split-button`, `listbox` | Works: every keyboard test of `menu.spec.mjs`, and an open split-button menu stays inside a 320px screen |
| `command-palette` | Its no-match sentence is written and announced. Opening it and moving through it have not run in WebKit. |
| `tooltip`, `hover-card` | Works with fallback. With no interest invokers the wrapper shows the text on hover and on keyboard focus, from the stylesheet alone, as the components' comments say. Lost: opening on a long press, closing on Escape, and the top layer. |
| Themes, reflow | Works: the Botbench theme's layers and colour scheme, and no page of the gallery scrolls sideways at 320px |

Firefox gives the same results.

## Differences the tests had to allow for

None of these is a defect in the system, and no stylesheet or behaviour module changed for them.

- **Tab moves between text fields only.** WebKit, like Safari with its default setting, moves Tab between text fields and moves Option+Tab through every control. The keyboard tests press Option+Tab in WebKit and Tab elsewhere (`pressTab` in `test/visual/serve.mjs`). A reader on a Mac or an iPad with a keyboard gets the same: Tab skips buttons unless they turn on "Press Tab to highlight each item".
- **An open dialog is a focus stop.** WebKit and Firefox stop on an open, non-modal `<dialog>` itself before its first control; Chrome goes straight to the control. The composer test expects that one extra stop outside Chrome.
- **A popover placed by anchor positioning is hit 1 or 2 pixels off its box.** WebKit reports the box of an item in an anchored menu about 1.75px lower than where a pointer hits it. The hit area is still 44px tall. The pointer-target test now measures how far the pointer can move from the centre and still land on the control, 42px or more across and down, instead of probing four fixed points, so the offset does not fail a 44px target.

## What still needs a real iPhone

- Tap, not hover: whether a tooltip or a hover card can be shown at all on a touch screen without interest invokers, and whether iOS's sticky hover after a tap leaves one open.
- The on-screen keyboard: whether the composer and an open sheet stay above it, and whether the page zooms when a field smaller than 16px takes focus.
- The safe-area insets at the bottom of the composer, the sheet, `now-doing` and `selection-basket`, on a phone with a home indicator.
- Opening and closing the sheet: the slide-in from `@starting-style`, and whether the page behind a modal sheet scrolls.
- The transcript: following the bottom as rows arrive, and momentum scrolling. `<ds-transcript>` has not run in WebKit.
- VoiceOver on the menu, the listbox, the option picker and the sheet. No screen reader has been tried in any engine.
- iOS Safari's own version. Its feature set can lag the WebKit that Playwright ships, so check interest invokers, anchor positioning and invoker commands again on the phone's iOS version.

## Running it

```sh
npx playwright install webkit firefox   # once
npm run test:visual:webkit
npm run test:visual:firefox
```

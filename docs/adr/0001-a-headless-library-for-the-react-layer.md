# ADR 0001: A headless library for the React layer: Base UI

Date: 2026-11-23. Status: proposed, for the owner to accept. This record changes no source, installs nothing and edits no rule. It says what the pull requests that follow would do. The app's side of the same decision, with the comparison of libraries and every source, is Botbench's `docs/adr/0011-a-headless-library-for-interactive-primitives.md`.

## Context

- The audit of 23 November graded thirty components C. The overlays among them share what they lack: "collision-aware placement, submenus, typeahead, shortcut columns, delay groups, entrance and exit" (`docs/audits/2026-11-23-skills-audit.md`, "What the C grades share"). Its first decision for the owner was whether to build the interactive half on a headless library.
- The addendum measured that entrances work in CSS in Chrome 156, Firefox 159 and WebKit 27.2, and that exits do not: "A dialog or popover that closes disappears at once in Firefox 159 and in WebKit 27.2", so "every exit in the plan … needs script outside Chrome" (`docs/audits/2026-11-23-skills-audit-addendum.md`, section 7).
- The owner decided: a headless React layer for the interactive components, emitting the same `ds-` classes so the checker and the closed vocabulary carry on; the behaviour modules stay for an app without React; one library, not two.
- This repository has no runtime dependency, and `AGENTS.md` says so. It ships React source in `react/`, five files today, which the app compiles. It is `"private": true` and publishes no npm package.

## Decision

1. **The library is Base UI**, the npm package `@base-ui/react`, 1.9.0 or a later 1.x (MIT). Botbench's ADR 0011 compares it with React Aria Components and Radix UI. In short: it is the only one of the three with every component on the owner's list, none under an unstable name; its documentation and source say it keeps a closing element in the page, in script, until its animations finish (https://base-ui.com/react/handbook/animation, read 2026-11-23; not run in any engine for this record); and it puts no class of its own on anything.
2. **Only `react/` uses it.** The stylesheet, the tokens, the checker, the rules, the gallery and `behaviors/` do not import it and do not change because it exists.
3. **This repository still has no runtime dependency.** The library is a requirement of the React files, met by the app that compiles them. Here it is a development dependency, used as React is now, to typecheck and build the test fixture.
4. **One file per primitive**, each rendering the system's classes and ARIA.
5. **The behaviour modules stay**, at the level they have.

## How the React layer is structured

**One file per primitive.** Each new file wraps one Base UI component (`dialog.tsx` two) and exports the system's component under the system's name:

| File | Built on | Renders the classes of |
|---|---|---|
| `menu.tsx` | `@base-ui/react/menu` | `menu`, with submenus, checkbox and radio items |
| `context-menu.tsx` | `@base-ui/react/context-menu` | `context-menu` |
| `select.tsx` | `@base-ui/react/select` | `select`, beside the native select, which stays the default on a phone |
| `combobox.tsx` | `@base-ui/react/combobox` | `combobox` |
| `popover.tsx` | `@base-ui/react/popover` | `popover` |
| `tooltip.tsx` | `@base-ui/react/tooltip` | `tooltip`, with one provider for the delay group |
| `hover-card.tsx` | `@base-ui/react/preview-card` | `hover-card` |
| `toast.tsx` | `@base-ui/react/toast` | `toast` and its region |
| `sheet.tsx` | `@base-ui/react/drawer` | `sheet`, with drag to dismiss; the docked sheet is this file with `modal={false}` |
| `dialog.tsx` | `@base-ui/react/dialog`, `@base-ui/react/alert-dialog` | `dialog`, `confirm-dialog` |
| `tabs.tsx` | `@base-ui/react/tabs` | `tabs` |
| `disclosure.tsx` | `@base-ui/react/collapsible` | `disclosure`, only where a fold has to animate in Firefox; otherwise the native `<details>` needs no file |

Rules for each file, which are the present rules of `react/` with one addition:

- It imports React, `@base-ui/react/<component>` and other files of `react/`. Nothing else. It imports by component path, never the package root.
- It passes a fixed `ds-` class to every part of the library's component that renders an element, as a string. The library adds none of its own ("Base UI components are unstyled, don't bundle CSS", https://base-ui.com/react/handbook/styling, read 2026-11-23). It never passes a class of its own making and never writes a `style` prop.
- It takes every word a reader sees or hears from props, as now.
- Its props are the system's, not the library's. A screen does not see a Base UI type, so the library can be replaced behind the file.
- Types follow the present rule: discriminated unions for invalid combinations, `ComponentPropsWithRef`, no `any`. Base UI writes its optional props as `| undefined`, which the fixture's `exactOptionalPropertyTypes` needs (seen in the type declarations of the published 1.9.0 package).
- The file is added when the component is migrated, not before.
- The segmented control gets no file. Its examples are native radio inputs, which need no script; a toggle group would change its roles for nothing gained.

**"Exactly as its `examples.html` does" has to be restated, because the markup differs.** This is the main cost of the decision and it is not hidden in the files:

- The examples today use native elements: `<dialog>` opened with `showModal()`, `popover` with `popovertarget`, `<details>`, and CSS anchor positioning. The stylesheet keys off `[open]` and `:popover-open` (`docs/authoring.md`, State).
- Base UI renders `<div>` elements with roles, in a portal, and places them with script ("Renders a `<div>` element" in the type declarations of `Dialog.Popup`, `Menu.Popup`, `Menu.Positioner` and `Drawer.Popup`, and "By default, the portal element is appended to `<body>`" in that of `Menu.Portal`, package 1.9.0). It marks state with data attributes: `data-open`, `data-closed`, `data-starting-style` and `data-ending-style` (https://base-ui.com/react/handbook/animation), `data-highlighted` (https://base-ui.com/react/components/menu.md) and `data-side` (https://base-ui.com/react/components/tooltip.md), all read 2026-11-23.
- So for a migrated component the same classes and the same roles are on different elements, and the open state has a second spelling. What each migration does:
  1. The component's stylesheet gains the library's state beside the native one: `.ds-menu:popover-open, .ds-menu[data-open]`. Exit and entrance are written once, on `[data-starting-style]` and `[data-ending-style]`, as transitions. The native path keeps its entrance from `@starting-style` and has no exit outside Chrome, as now.
  2. `docs/authoring.md` gains those attributes in its state table, named as set by the React layer. They are attributes a library sets from state, not a class a script toggles, so the rule against styling from a toggled class holds.
  3. The component's `examples.html` gains one example in the shape the React file renders, marked as such in its metadata, so the checker and the gallery know that shape. The native examples stay and stay first.
  4. A test compares, for each migrated file, the classes and roles the React render puts in the page with those of that example, and fails on a difference. That is what "exactly" means from then on: same classes, same roles and ARIA, same order of parts.
- Placement: the library writes the popup's position through the element's style, so a rendered popup carries a `style` attribute that the library wrote. The React files still write no `style` prop. Botbench's first pull request has to show that its policy allows this (Botbench ADR 0011, security notes). If it does not, the migration stops there and this record is revisited.
- `<style>` elements: Base UI's documentation says two parts render one, `ScrollArea.Viewport` and `Select` "when `alignItemWithTrigger` is enabled", and that `CSPProvider` with `disableStyleElements` turns that off (https://base-ui.com/react/utils/csp-provider.md, read 2026-11-23). `select.tsx` does not use that alignment, no file uses the scroll area, and the layer exports one provider that sets `disableStyleElements`.

**What does not get a file.** `busy-button.tsx`, `approval.tsx` and `use-transcript.ts` stay as they are: a native button, a composition of buttons, and a scroll rule the library has nothing for. The new composites of the approved visual direction (evidence rows, the decision surface, the work queue row, the dense work table, the intent choice cards, the progress track) are CSS components with examples, like the rest of the catalogue. Three of them use files of the layer for a part: the work queue row and the dense work table use `menu.tsx`, `context-menu.tsx` and `tooltip.tsx` for their menus and tooltips, and the docked sheet is `sheet.tsx`. The tree, the split panel and the data table are not in Base UI and stay hand-built.

## Rules that change, and how they would read

None is edited by this record. Each is changed in the pull request that adds `menu.tsx`.

| Where | Today | Proposed |
|---|---|---|
| `AGENTS.md`, component styles | "Component styles key off native state and ARIA attributes, never off a class a script would toggle. No component uses an inline `style` attribute." | "Component styles key off native state and ARIA attributes, and, for a component the React layer renders through Base UI, off the state attributes the library sets (`data-open`, `data-closed`, `data-starting-style`, `data-ending-style`, `data-side`, `data-highlighted`), never off a class a script would toggle. No example and no file of the system writes an inline `style` attribute; a popup the library places carries one the library wrote." |
| `AGENTS.md`, `data-state` | "A component whose state has no native or ARIA form takes it from a `data-state` attribute the app sets, with the values listed in its metadata" | Unchanged, with one sentence after it: "The library's state attributes above are the one other kind, and a component's metadata lists the ones its stylesheet uses." |
| `AGENTS.md`, `react/` | "Each file depends on React and on the other files there only, renders the component's classes and ARIA exactly as its `examples.html` does, never a class of its own or an inline style" | "Each file depends on React, on `@base-ui/react` where its head comment says so, and on the other files there only. It renders the component's classes, roles and ARIA as the example marked for the React layer in its `examples.html` does, which a test compares, and writes no class of its own and no `style` prop." |
| `AGENTS.md`, `react/` | "Add a file only for a pattern an app has been seen to write by hand" | "Add a file only for a pattern an app has been seen to write by hand, or for a component in the order of work of ADR 0001." This is a change to the rule, not a reading of it: the hover card, the context menu, the combobox and the toast are in the order because the owner decided the list, not because Botbench writes them by hand today. |
| `docs/authoring.md`, State | Open: `[open]`, `:popover-open` | Open: `[open]`, `:popover-open`, and `[data-open]` when the React layer renders it. A new row, "Entering and leaving, React layer": `[data-starting-style]`, `[data-ending-style]`. |
| `docs/authoring.md`, No inline style | "No component relies on a `style` attribute. The apps' content security policies block it." | The same, and: "A popup placed by Base UI is given its position by the library through the element's style, from script; the system's own files still write none." Added only after Botbench's policy test passes. |

## The peer requirement

- The system publishes no package, so nothing resolves a `peerDependencies` field. The requirement is stated in three places that tests can hold to each other:
  1. `docs/consumer-guide.md`, in "React source": an app that imports a file built on the library installs `@base-ui/react` in the range named there, beside React 19. An app that imports only `busy-button.tsx`, `approval.tsx` or `use-transcript.ts` needs React alone, as now. The guide's test sets an app up from its commands, so the install line is exercised.
  2. `dist/manifest.json`: the range, written by the build from `package.json`'s development dependency, so there is one place it is typed.
  3. The head comment of each file that needs it, where it says "It needs React 19" today.
- The app declares it. For Botbench that is `web/package.json`, with its lockfile; a test to be added there compares its range with the manifest's.
- `package.json` here gains `@base-ui/react` under `devDependencies`. The sentence in `AGENTS.md` would read: "No runtime dependencies. Development dependencies are for tests (React, Base UI and esbuild only build a test fixture) and for `npm run vendor` … The build never reads `node_modules`." And of `react/`: "Each file depends on React, on `@base-ui/react` where its head comment says so, and on the other files there only."
- `NOTICE`, under "Development tools", gains Base UI (MIT, Copyright (c) 2019 Material-UI SAS). Nothing of it is copied into `dist/`.
- The range moves here first. A Base UI release is taken by raising the development dependency, running the three engines, and releasing the system; the app follows with its next sync.

## What happens to `behaviors/`

- All seven modules stay, are still copied to `dist/behaviors/`, and are still loaded by every gallery page.
- `menu.js`, `tabs.js`, `combobox.js`, `listbox.js` and `command-palette.js` stay at the level they have: native popover and anchor positioning, the keyboard they have now, no submenus, no exit outside Chrome. They are for an app without React and are not extended to match the library.
- `elapsed.js` and `transcript.js` have no counterpart in the library and are unaffected.
- The rule "change a hook and its module together" ends for the menu when `use-menu.ts` is removed. Until then the two stay in step. After that, `menu.spec.mjs` keeps testing the module and the React menu has its own spec; the keys they share (Up, Down, Home, End, a letter, Tab, a disabled item) are asserted in both.
- A consequence to accept: the React menu and the vanilla menu will differ in what they can do. The component's metadata says which features need the React file.

## Testing

What exists: `test/react-source.test.mjs` typechecks `test/fixtures/react-source/` in strict use (`usage.tsx`, `misuse.tsx`, `app.tsx`, `layer.tsx`); `test/visual/react-source.spec.mjs` and `react-layer.spec.mjs` build the fixture with esbuild, render it under StrictMode and drive it by keyboard with axe and the structural rules. Both run in Chrome only: neither is in `ENGINE_FILES` in `playwright.config.mjs`.

What is added, with each migrated file:

- **The fixture.** `usage.tsx` uses the new file in strict mode; `misuse.tsx` holds the prop combinations its types must refuse; `layer.tsx` puts it on the test screen.
- **All three engines.** `react-layer` and `react-source` join `ENGINE_FILES`, so every test of the React layer runs in Playwright's WebKit and Firefox as well as Chrome. This is the point of the migration, so a file is not done until the three pass. `docs/browser-support.md` records the counts.
- **Per primitive, in each engine:**
  - the keyboard, mirroring the module's spec where there is one, plus what is new: a submenu opens with Right and closes with Left, typeahead over several letters, focus returns to the trigger on close;
  - placement: an overlay opened beside the edge of a 320px page stays inside it;
  - the exit: after closing, the element is still in the page with `data-ending-style`, and is gone when its transition has ended. Under reduced motion it is gone at once;
  - dismissal: Escape, a press outside, and Tab where the pattern closes on it;
  - axe and the structural rules on the page with the overlay open;
  - the parity test above: classes and roles against the example.
- **The policy.** The fixture page is also served with Botbench's header (`default-src 'self'` and the rest) and a test fails on any policy violation the browser reports, with a menu, a tooltip and a select open.
- **Screenshots** stay Chrome only, as now. A migrated component's gallery pages do not change, since the gallery shows the native examples; the React shape is shot from the fixture.
- **Not automated, and said so:** a screen reader. Base UI's documentation names none it is tested with ("tested on a broad spectrum of browsers, devices, platforms, screen readers, and environments", https://base-ui.com/react/overview/accessibility, read 2026-11-23), and this system has tried none. Each migrated file gets one pass with VoiceOver in Safari, written into `docs/browser-support.md` with its date. A real iPhone is still needed for drag to dismiss and the tooltip on touch.

## Order of work

Of the five existing files, three are not migrated and two are:

| File | What happens |
|---|---|
| `busy-button.tsx` | Not migrated. It is a native button and needs no library. |
| `approval.tsx` | Not migrated. It composes busy buttons. |
| `use-transcript.ts` | Not migrated. The library has no counterpart. |
| `use-menu.ts` | Replaced by `menu.tsx`, the first file on the library. It is first because the menu is where the audit found the most missing (placement, submenus, typeahead, exit) and because it proves the three risky things at once: placement under the policy, the exit in three engines, and the parity test. `use-menu.ts` stays exported, unchanged, until Botbench has no caller, then is removed in a release whose changelog says so. `context-menu.tsx` follows, on the same parts. |
| `dialog.tsx` | Last of all the files, and in two steps, because it is the file with the most behaviour to keep and the native element already does most of it. First the sheet moves to `sheet.tsx` on the drawer, which is where the library adds something the native element cannot: drag to dismiss, snap points, the docked form, and an exit. Then the dialog and the confirm dialog move, keeping their props: `open`, `onClose(returnValue)`, `title`, `footer`, `onSubmit`, the variants. What has to be rebuilt on the way, since the library's popup is not a `<dialog>`: the `returnValue` of the button that closed it (from `method="dialog"` today), Cancel first in a confirm dialog taking focus, and focus going back to the opener. The existing tests of those stay and decide when it is done. If the dialog on the library cannot pass them, the dialog stays native with a scripted exit, and only the sheet uses the library. |

The order for all twelve files. Each is one pull request here, released, then synced into Botbench:

1. `menu.tsx`, replacing `use-menu.ts`. The proof step: the policy, the exit in three engines, the parity test.
2. `context-menu.tsx`, on the same parts.
3. `tooltip.tsx`, with the delay group.
4. `popover.tsx`.
5. `hover-card.tsx`.
6. `toast.tsx`.
7. `select.tsx`.
8. `combobox.tsx`.
9. `tabs.tsx`.
10. `sheet.tsx`, taking the sheet out of `dialog.tsx`; the docked sheet with it.
11. `dialog.tsx`: the dialog and the confirm dialog.
12. `disclosure.tsx`, only if a fold that must animate in Firefox has turned up by then.

Steps 3 to 9 may change places as Botbench's screens need them; 1 is first and 10 and 11 are last.

## Consequences

- The system's best form of an interactive component now needs React and one library. An app without React keeps a working, plainer form.
- Two markup shapes exist for each migrated component. The parity test and the marked example are what keep them from drifting; they are extra work on every change to such a component.
- The catalogue's promise "no runtime dependency" still holds for everything but the React files that say otherwise. The README's line "There is no runtime dependency" needs the same qualification when the first file lands.
- The system takes on following a library that releases about monthly (eleven stable versions on the npm registry, 1.0.0 on 2025-12-11 to 1.9.0 on 2026-10-09 with one patch, 1.4.1; read 2026-11-23).
- If the library is abandoned or changes licence, each file is rewritten behind its own props and classes, one at a time, with its tests as the measure. Nothing outside `react/` is touched, and no screen of an app changes.

## Not established

- That exits work in Firefox and WebKit with Base UI. Its documentation and source say how; nothing was run.
- That Base UI's placement works under Botbench's content security policy. Botbench's first pull request proves or refutes it.
- How Base UI's components behave with a screen reader, in iOS Safari, or with touch. Nothing was run for this record; it is from documentation, the npm registry and the text of the published package.
- Whether the dialog can keep its `returnValue` contract on the library without more code than the native element needs now. The fallback is in the table above.
- Whether the drawer's `modal={false}` gives the docked sheet the visual direction draws. Its documentation describes opting out of focus trapping, not a docked panel (https://base-ui.com/react/components/drawer.md, read 2026-11-23).

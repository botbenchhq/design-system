# Changelog

Each entry says what a version of `dist/` holds. An app reads it when it syncs a newer copy.

## 0.3.0

- **Components.** 29 more, which brings the catalogue to 93. All have the status `draft`.
  - Structure and navigation: settings row, split panel, stepper and tree.
  - Actions: context menu, copy button, kbd, selection basket, split button, toggle button and toolbar.
  - Form controls: calendar, combobox, date field, editable list, file upload, filter chips, listbox, number field, one-time-code input, password field, slider and tag input.
  - Overlays: command palette and hover card.
  - Status and data: check list, notification list and sparkline.
  - Accounts: device code.
- **Page patterns.** Six whole screens composed from the components, each with a little layout of its own: filter and results, master and detail, multi-step form, not found, settings page and sign in. `components.json` lists them in a new `patterns` array, each with `"kind": "pattern"`. The `components` array is as it was. Their styles are in `groundwork.css` after the components, their classes are in the manifest, and each has a gallery page.
- **Behaviours.** Two more optional ES modules with no dependencies, beside `behaviors/groundwork.js`. `behaviors/combobox.js` defines `<gw-combobox>`, which filters the options as the reader types, sets `aria-expanded`, `aria-activedescendant` and `aria-selected`, writes the count into the status line and handles Down, Up, Home, End, Enter and Escape. `behaviors/command-palette.js` defines `<gw-command-palette>`, which opens the palette on Ctrl+K or Cmd+K, filters the commands, moves the selection with Down and Up and runs the selected command on Enter. Load only the ones the app uses. A framework app sets the same attributes itself.
- **Rules for agents.** `rules/choosing-components.md` covers the new components and says when to start from each pattern. `rules/core.md` points to the patterns.
- **Gallery.** A pattern's examples run in one column, the index lists patterns after components, and every page loads all three behaviour modules.

## 0.2.0

- **Components.** 40 more, which brings the catalogue to 64. All have the status `draft`.
  - Structure and navigation: accordion, breadcrumb, card, inspector, sidebar nav and tabs.
  - Actions: button group, icon button, menu, pagination and show more.
  - Form controls: checkbox, radio, search field, segmented control and switch.
  - Overlays: confirm dialog, dialog, popover, sheet, toast, tooltip and undo toast.
  - Status and loading: progress, skeleton, tag and usage meter.
  - Data: avatar, data table, key-value, stat and timeline.
  - Agent surfaces: activity feed, attachment chip, feedback, reasoning, run status, source chip, suggestion chips and tool call.
- **Behaviours.** `behaviors/groundwork.js`, one optional ES module with no dependencies. It defines `<gw-tabs>`, which sets `aria-selected`, `tabindex` and `hidden` for the tabs component and handles click, Left, Right, Home and End. It is for an app without a framework. A framework app sets the same attributes itself.
- **Tokens.** `--gw-radius-full`, for a circle or a pill. It is the same in light and dark. The Tailwind preset gains `rounded-full`.
- **Icons.** `ban`, `chevrons-up-down`, `git-commit-horizontal`, `image`, `thumbs-down` and `thumbs-up`.
- **Tab bar.** Its metadata now names the sidebar nav as the component that lists the same destinations at 768px and wider. The styles are unchanged.
- **Rules for agents.** `rules/choosing-components.md` covers every component and how to tell similar ones apart.
- **Gallery.** An overlay is drawn open inside its own example, and the gallery's own styles no longer reach into an example.

## 0.1.0

The first version an app can adopt.

- **Tokens.** A closed vocabulary of custom properties starting with `--gw-`: colour roles, two font families, a six-step type scale, six spacing steps, two radii, one overlay shadow, three durations with one easing curve, a layering scale, fixed sizes and one breakpoint at 768px. Light and dark themes. The same tokens as data, as a Tailwind 3 preset and as a block for an app's `DESIGN.md`.
- **Base layer.** A reset, type for plain elements, the layout classes (stack, cluster, split, grid, sidebar layout, container, gaps), a visually hidden class and one focus ring, in cascade layers that app CSS always wins over.
- **Fonts and icons.** IBM Plex Sans and IBM Plex Mono, and an icon sprite from Lucide, served from the app's own host.
- **Components.** 24 components, each with metadata and example markup in `components.json` and a gallery page: alert, app header, approval, badge, banner, button, code block, composer, copy field, diff, disclosure, empty state, error state, field, link, list, message, page header, pending tray, select, spinner, streaming, tab bar and textarea. All have the status `draft`.
- **Checker.** A static scan with no dependencies for CSS, HTML, JSX, TSX and class names in script, and the structural rules as `check-dom.js` for the rendered page. 39 rules, listed in `manifest.json` and explained in `rules/checker-rules.md`. No setting switches a rule off. A waiver states a reason and is printed on every run.
- **Rules for agents.** `rules/core.md`, short enough for every agent to read, and longer files on principles, progressive disclosure, what never to do, content, choosing a component, the checker's rules and review.
- **Sync.** `scripts/sync.mjs` copies this version into an app with a hash of every file. The checker fails when a vendored file has changed. A later sync prints the components and rules that changed, and stops when the copy was edited by hand.
- **Hook.** An optional Claude Code hook that denies edits to the vendored copy and runs the static scan on an edited file.

# Changelog

Each entry says what a version of `dist/` holds. An app reads it when it syncs a newer copy.

## 0.4.0

What the first app to adopt the system reported, and what a blind trial of two agents reported.

- **Fixes.**
  - Long unbroken words. Text now inherits `overflow-wrap: break-word` from the base layer, and the field error, the alert title and body, the empty state title and body and the diff note also break anywhere, so a path or a hash in a message no longer makes the page scroll sideways at 390px. An app that added its own wrapping class for this can drop it.
  - Headings. The page header's title is 24px at every width, the size of a plain `h1`. It was 20px below 768px, the size of a plain `h2`. `h1`, `h2` and `h3` are unchanged at 24px, 20px and 16px.
  - Run status. The facts line has block padding, so facts that wrap beside the badge keep clear of the title and the row's edge.
  - Approval. The note for the agent is one optional field before the actions, and the one Decline button sends whatever was typed. The earlier guidance had a second button, Decline and send note, so the plain Decline dropped a typed note. Update markup copied from the old example.
  - Approval. The risk line is optional, and an example shows a card without it.
  - Sign in. The pattern uses the catalogue's password field in place of a plain password input.
  - Gallery. A wide popover drawn open in an example ends where the example's content ends at 390px. The popover component already kept its 16px margin from the screen edge and is unchanged.
  - `dist/` carries the system's `LICENSE` and `NOTICE`.
- **Additions.**
  - Page pattern `app-shell`: the app header with the pending tray, the sidebar nav from 768px and the tab bar below it, and a main column whose page header holds the view's one `h1`. It brings the patterns to seven.
  - Message: four more kinds of row, each with its label in words. `gw-message--session-start`, `gw-message--question` for a question the run waits on, `gw-message--decision` for a permission request that was resolved, saying how in its label beside an icon (allowed, declined, pre-approved or allowed by a standing permission) and by whom in its text, and `gw-message--error` for something that failed, apart from a denial. A new part, `gw-message__icon`, holds the icon in that label.
  - Message: the tool-call row has a documented structured shape and an example of it: the tool name, the command or target in mono, an optional plain sentence saying why, and the full arguments behind the details element. It adds no class.
  - Check list: a timed-out result, `gw-check-list__result--timed-out`, in words with the limit that was hit and a warning triangle, apart from failed.
  - Activity feed: a documented newest-first form for a paged log, by markup order alone, with the order stated in words and Show older activity at the end.
  - App header and page header: the metadata says which carries the `h1`, and the app header has an example with the pending tray in its tray.
  - Dialog: an example of the closed dialog with its opener button, and where the `showModal()` fallback goes.
  - Heading levels: approval, card, tool call, error state and activity feed say which level a title takes in a queue or a section.
  - Undo toast: its metadata and `rules/choosing-components.md` say that an action with no real undo, such as revoking a standing permission, takes a confirm dialog.
  - `components-index.json`: name, kind, title, purpose, status and classes of every component and pattern, under a twentieth of the size of `components.json`. `rules/core.md` and the consumer guide point to it first.
  - Sync prints the patterns that were added, changed or removed, beside the components and rules.
  - The consumer guide shows how an app wires `@axe-core/playwright` into its end-to-end tests. The system bundles no scanner.
- **Checker.** 40 rules.
  - New rule `unstyled-controls`: a view with buttons or form controls fails, once, when none of them carries or sits inside an element with a `gw-` class or a class with the app's prefix. It runs in the static scan on HTML files and in the rendered check. A screen that ignores the system no longer passes the rendered check with nothing to report.
  - `gwCheckDom(root, { appPrefix })` takes the app's class prefix as an option, which the new rule needs on a rendered page. `gwCheckDom()` and `gwCheckDom(root)` work as before.
  - A sprite reference such as `` `${sprite}#gw-icon-${name}` `` or `"icons.svg#gw-icon-check"` in script is no longer reported as `dynamic-class` or `unknown-class`. A `gw-icon-` name directly after `#` is a fragment, not a class. Remove any waiver written for it: an unused waiver is a finding.
  - The summary line ends with the number of rules, as in `0 findings, 0 waivers, 0 declared gaps, 3 files scanned, 40 rules`, and the JSON report has the same number as `rules`. A script that matches the whole summary line needs updating.

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

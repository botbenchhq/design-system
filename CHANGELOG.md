# Changelog

Each entry says what a version of `dist/` holds. An app reads it when it syncs a newer copy.

## 0.7.4

A new component, `option-picker`: exactly one of up to about ten options, each a full-width row with a name, a one-line description and an optional state in words, built on native radios. It covers a repository from recently used ones with its path cut in the middle and an Enter a path option that shows a field under itself, an agent that is unavailable with the reason in words, and a mode that carries a warning. Nothing else changes, and a consumer only needs to sync.

## 0.7.3

The icon set gains `settings`, the gear an app header's Settings action needs. Nothing else changes, and a consumer only needs to sync.

## 0.7.2

Fixes for the defects an independent audit confirmed: menus and listboxes by keyboard, the colour scheme under a theme's default mode, reflow at 320px, and tables of many agents at desktop width.

- **What an app on 0.7.1 must do.** Nothing beyond syncing. No class, token, attribute or rule was renamed or removed. Two optional behaviour modules and a wide container are new, for an app that wants them. An app without a framework that wants the menu and listbox keys loads the new modules and wraps the markup in their elements, as the examples now do.
- **Menu keyboard.** New optional module `behaviors/menu.js`, which defines `<ds-menu>`. Wrap a menu and its button, a split button, or a whole list of rows that end in a context menu in it. When a menu opens, focus moves to its first item, one item at a time is in the tab order, Down and Up move and wrap, Home and End go to the ends, a letter goes to the next item that starts with it, and Tab closes the menu while focus moves on from its button. Escape stays the browser's and returns focus to the button. An item with `aria-disabled="true"` takes focus and ignores Enter and Space. The metadata of the menu, context menu and split button says so. Before this the metadata promised arrow keys from a module that did not exist.
- **Listbox keyboard.** New optional module `behaviors/listbox.js`, which defines `<ds-listbox>`: one option in the tab order, Down, Up, Home, End and a letter to move, Space or Enter to select, and for a listbox with `aria-multiselectable="true"` Space to switch, Shift with an arrow to switch the option moved to and Ctrl or Cmd with A to select all. It fires a change event on the listbox, and a key or press the app's own listener has prevented is left to the app.
- **Command palette.** The no-match message is announced. Its status element now stays in the page and is never hidden: the module writes the sentence held in its `data-ds-empty` attribute into it when nothing matches, and empties it otherwise. An empty message takes no room. Markup from earlier versions, with the sentence in the element and the `hidden` attribute, keeps working: the module moves the sentence into the attribute and takes `hidden` off. A framework app writes its sentence into the status element itself, and keeps the element in the page.
- **Colour scheme under a theme.** A theme whose default mode is dark sets `color-scheme: dark` on a root with no `data-theme`, so native controls, such as a date field's picker icon, and scrollbars are drawn dark under the Botbench theme by default. Light, dark and auto are as before. The consumer guide now says that an app with a fixed dark mode ships one `theme-color` tag, and two only when it offers a choice of mode.
- **Reflow at 320px.** Every component and pattern page is checked at 320px for sideways scroll. The calendar's columns narrow below 44px when the screen has less room than seven of them, and its days stay 44px tall. Below 768px a menu hangs on the side of its button with more room and is no wider than that room, so the split button's menu stays on the screen. Nothing else scrolled sideways.
- **Tables and wide views.** Text in a data table, and an avatar's name, wraps between words only, in place of breaking anywhere, so a table of eight agents no longer wraps names letter by letter. Each column is at least two pointer targets wide, except the action column. Where the columns do not fit, `ds-data-table__scroll` around a table scrolls them sideways and the page does not move; put a table that holds names, paths or other text from outside the app in it. A table without the wrapper that holds a word too long for its column now widens the page in place of breaking the word.
- **Wide container.** A new token, `--ds-size-wide` (1200px), in the Tailwind preset as `max-w-wide`, in `tokens.json`, `design-tokens.md` and the manifest, and a new layout class, `ds-container--wide`, which takes the container to that width. The app shell's main column takes it for a table or a board view.
- **Examples.** A data table of eight agents with names up to 30 characters, in the scroll wrapper, and an app shell table view in the wide main column. The menu, context menu, split button and listbox examples are wrapped in the new elements.
- **Tests.** Keyboard tests for the menu, the context menu, the split button's menu and the listbox; the computed colour scheme in every mode under the Botbench theme; a 320px sweep over every page; and tables of eight agents at 1280px and 390px.

## 0.7.1

The status set gains four states, so an app no longer has to choose its own icons for them: Failed (circle-x, danger), Done (check, success), Accepted (thumbs-up, success) and Rejected (x, neutral). One icon joins the sprite: `circle-x`. Nothing else changes, and a consumer only needs to sync.

## 0.7.0

Themes, four status roles for agent work, and one icon and tone for each state of a run.

- **What an app on 0.6.0 must do.** Nothing. Sync, and the default theme looks as it did except where a state now takes its icon and tone from the status set, listed below. No class, token or rule was renamed or removed. To use the Botbench theme, link `themes/botbench.css` after `design-system.css`.
- **Themes.** A theme changes token values in light and dark and adds no name. Each one ships as four files in `themes/`: `<name>.css`, linked after `design-system.css`; `<name>.json`, with the theme's name, its default mode and the page background of each mode for the `theme-color` meta tags; `<name>.design-tokens.md`, the `DESIGN.md` token block with the theme's values; and `<name>.tokens.json`, the token data with the theme's values. A theme's rules sit in a new cascade layer, `ds.theme`, which the layer order puts after `ds.tokens`, so the layer order is now `ds.reset, ds.tokens, ds.theme, ds.base, ds.components`. A theme may declare a default mode: with no `data-theme` the page shows it, and `light`, `dark` and `auto` work as before. The Tailwind preset is unchanged, since its values are custom property references. "Themes" in the consumer guide has the details.
- **The Botbench theme.** The Botbench brand on the system's roles: an amber primary action, warm paper and charcoal surfaces, a 6px `radius-md` (from 8px; `radius-sm` stays 4px), and its own colours for every status. Its default mode is dark. Six of the brand's light-mode values were darkened, and two moved slightly in hue, to pass contrast and to stay apart from each other; the header of the theme file lists each with its ratio.
- **Tokens.** Four status roles, each with a `-subtle` background, in light and dark: `--ds-color-approval` for a wait on a person's answer, `--ds-color-blocked` for work stopped and unable to go on by itself, `--ds-color-peer` for another person's agent, and `--ds-color-tainted` for work that carries input from outside the trust boundary. Each is checked as text on its subtle background and on the page, raised and sunken surfaces. They are in the Tailwind preset (`text-approval`, `bg-approval-subtle` and so on), `tokens.json`, `design-tokens.md` and the manifest.
- **Badge.** Four tones for the new roles: `ds-badge--approval`, `ds-badge--blocked`, `ds-badge--peer` and `ds-badge--tainted`. A status set in its metadata, `statusSet`, also in `components.json`: one icon and one tone for each of Queued, Working, Checking, Needs input, Ready for review, Stopped, Cancelled, Check passed and Check failed. The words stay the app's. A don't example for a status shown by colour alone.
- **The same state looks the same everywhere.** Changes in appearance:
  - Waiting on the reader (a tool call awaiting approval, a waiting run-timeline station, a step-group callout awaiting approval, the waiting now-doing line) takes the approval tone in place of the warning tone, with the paused circle as before.
  - A check that has not started shows a dashed circle in place of three dots, the icon of Queued, as a station that has not started already did.
  - A timed-out check shows a clock in place of a triangle, and a timed-out tool call takes the warning tone in place of the danger tone, so the two look the same: a clock in the warning tone.
  - The examples of `run-status`, `app-shell`, `master-detail` and `filter-results` use the status set. An app that copied the old Queued, Awaiting decision, Interrupted or Blocked badges may move to the set's icon and tone when convenient.
- **Icons.** `circle-stop` and `eye`.
- **Gallery.** A theme switch beside the light and dark switch, `?brand=botbench`. The visual tests shoot the index and ten pages under the Botbench theme in both modes at both widths, with axe, the structural rules and the pointer-target check.
- **Checker.** 41 rules, unchanged. The nearest token it suggests for a raw colour may now be one of the new roles.

## 0.6.0

The entries below this one, for 0.5.0 and earlier, use the names of their time: the `gw` prefix, `groundwork.css`, `behaviors/groundwork.js` and `vendor/groundwork/`. They are left as they were released.

A breaking rename with no change in behaviour or appearance. The prefix of the system changes from `gw` to `ds`, and the system is called the design system. Every component, pattern, token, behaviour and rule is as it was in 0.5.0, under its new name. No component, pattern or rule ID was renamed.

- **Migration.** Every old form and its new form, in the order to apply them. A longer form comes before the shorter one it contains. The codemod applies them in this order.

  | Step | 0.5 | 0.6.0 |
  |---|---|---|
  | 1 | The vendored folder `vendor/groundwork/` | `vendor/design-system/` |
  | 2 | The config file `groundwork.config.json` | `design-system.config.json` |
  | 3 | The stylesheet `groundwork.css` | `design-system.css` |
  | 4 | The tabs module `behaviors/groundwork.js` | `behaviors/tabs.js` |
  | 5 | Dark values in `tokens.json` under `$extensions.groundwork` | `$extensions["design-system"]` |
  | 6 | Data attributes `data-gw-…`: `data-gw-critical`, `data-gw-content`, `data-gw-advanced`, `data-gw-scroller`, `data-gw-jump`, `data-gw-count`, `data-gw-count-one` | `data-ds-…`: `data-ds-critical` and so on |
  | 7 | Custom properties `--gw-…`, and the anchor name `--gw-tooltip` | `--ds-…` |
  | 8 | Cascade layers `gw.reset`, `gw.tokens`, `gw.base`, `gw.components` | `ds.reset`, `ds.tokens`, `ds.base`, `ds.components` |
  | 9 | Elements `<gw-tabs>`, `<gw-combobox>`, `<gw-command-palette>`, `<gw-elapsed>`, `<gw-transcript>`, opening and closing tags | `<ds-tabs>`, `<ds-combobox>`, `<ds-command-palette>`, `<ds-elapsed>`, `<ds-transcript>` |
  | 10 | Classes `gw-…` with their parts and modifiers, the layout classes, `gw-visually-hidden`; keyframe names such as `gw-streaming-turn`; icon ids `gw-icon-…`; the waiver keyword `gw-waive` | `ds-…`, `ds-visually-hidden`, `ds-streaming-turn`, `ds-icon-…`, `ds-waive` |
  | 11 | In script, `dataset.gwCount` and `dataset.gwCountOne` | `dataset.dsCount`, `dataset.dsCountOne` |
  | 12 | The rendered check `gwCheckDom()` in `check-dom.js` | `dsCheckDom()` |
  | 13 | The element classes `GwTabs`, `GwCombobox`, `GwCommandPalette`, `GwElapsed`, `GwTranscript` | `DsTabs`, `DsCombobox`, `DsCommandPalette`, `DsElapsed`, `DsTranscript` |
  | 14 | `"prefix": "gw"` in `manifest.json` | `"prefix": "ds"` |
  | 15 | The `name` in `design-tokens.md`, `Groundwork` | `Design system` |

  The repo is named `design-system`, its package is `design-system`, and the gallery is the Design system gallery.
- **Codemod.** `migrate-prefix.mjs`, new in `dist/`, so it arrives with the copy. Run `node vendor/design-system/migrate-prefix.mjs [--dry-run] <paths…>` once over the app's own source. It applies steps 1 to 13 to CSS, HTML, JavaScript, TypeScript, JSON and Markdown files, skips `node_modules`, dot-directories and every synced copy, prints each file it changed and a total, and changes nothing on a second run. It has no dependencies.
- **Checker.** One more rule, `old-prefix`, which brings it to 41. A class, element, icon id, data attribute, custom property, cascade layer or waiver that still has the old prefix is reported with its new form and the command that rewrites it. No other rule changed.
- **Docs.** The consumer guide has a section, Upgrading from 0.5, with the steps in order.

## 0.5.0

Agent activity: what an agent is doing, step by step, with the detail one press away.

- **Tool call.** One component for a call through its whole life, driven by `data-state` on its root: `requested`, `awaiting-approval`, `running`, `succeeded`, `failed`, `declined`, `timed-out`, `cancelled`. One line is always in view: an icon drawn from the state, the status in words, a plain summary with the command or target in mono, and the time. The arguments and then the output sit behind one native details element. Long output shows its last lines in a block that scrolls inside itself, with Show all N lines, and keeps its height while a call runs. A call that awaits approval shows Allow and Decline in the row, outside the details. A retry is a new row.
  - It is the one way to show a tool call in a transcript: the content of a `gw-message gw-message--tool-call` row, with the new modifier `gw-tool-call--row`. The examples of message, streaming and tool call are written that way.
  - Markup written for 0.4.0 keeps working and looks as it did: a tool call with an outcome class and no `data-state`, and a tool-call message row built from `gw-message__tool` and `gw-message__command`. No class was renamed or removed. Move to the new markup when convenient.
  - New parts: `gw-tool-call__body`, `gw-tool-call__label`, `gw-tool-call__output`, `gw-tool-call__actions`.
- **Message.** The agent's text row takes `data-state`: `streaming` with a caret hidden from assistive technology, `stopped` and `interrupted` with the partial text kept and the state in words on a `gw-message__state` line, `reconnecting`, and `done`. An interrupted row has a Retry button. New parts: `gw-message__caret`, `gw-message__state`. Examples for a transcript that is loading and one that is empty.
- **Components.** Five more, which brings the catalogue to 98.
  - Step group: consecutive steps folded under one line that counts them by kind, with a failure, a running step or a pending approval said in words in the summary.
  - Now doing: one line under a transcript that says what the agent is doing right now, with Stop, or what the run waits on the reader for, with a link to it.
  - Jump to latest: a small button with the count of new rows, shown while the reader has scrolled up.
  - Run timeline: the stations of a run, each with its state in words, across the page from 768px and down it below. The time of a station goes in `gw-run-timeline__time`, which keeps it on one line.
  - Activity announcer: the one status region that tells a screen reader a run started, needs approval, finished, stopped or failed, beside a transcript that is a named log with `aria-live="off"`.
- **Page pattern** `agent-run`: the screen of one run inside the app shell, in progress, loading, empty and finished. It brings the patterns to eight.
- **Behaviours.** Two more optional modules. `behaviors/transcript.js` defines `<gw-transcript>`, which follows the newest row while the reader is within 60px of the bottom, stops when they scroll up, counts the rows added since, shows the jump-to-latest control and never moves focus. `behaviors/elapsed.js` defines `<gw-elapsed>`, which shows the time since its `datetime` attribute once a second, stops on a final `data-state` or a `duration` attribute, and carries `aria-live="off"`. Nothing opens or closes a step group: the app does, by the rule in the step group's metadata.
- **Icons.** `arrow-down`, `circle-dashed`, `circle-pause`, `circle-slash` and `clock`.
- **Tokens.** No new token. `tokens/pairs.json` checks the danger, warning and info text colours on the sunken surface, which a hovered summary line uses.
- **Rules for agents.** `rules/disclosure.md` has a section on agent activity: what stays in view, what is one and two levels down, and what is never hidden. `rules/content.md` says how to word a step summary. `rules/choosing-components.md` covers the new components and the pattern.
- **Docs.** The consumer guide has the `data-state` contract of each component in one table, for an app that renders with a framework.
- **Checker.** 40 rules, unchanged.

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

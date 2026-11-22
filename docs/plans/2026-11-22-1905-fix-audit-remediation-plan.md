---
title: Audit Remediation - Plan
type: fix
date: 2026-11-22
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
origin: docs/audits/2026-11-22-independent-audit.md
---

# Audit Remediation - Plan

## Goal Capsule

- **Objective:** Botbench can be built on the design system as a premium developer tool: every interactive component works by keyboard in the browsers its users have, dense screens hold together, and a screen looks like Botbench and not like a rulebook.
- **Means:** Fix the audit's confirmed defects first, then extend the checks to the places the audit showed they are blind, then close the completeness gaps, and only then change the look (KTD1).
- **Authority:** This plan's Product Contract, then the owner's audit brief and the audit record in `docs/audits/2026-11-22-independent-audit.md`, then the earlier design-system plan where this one is silent.
- **Execution profile:** Six pull requests against `main`. PR1, PR2, PR3, PR4 and PR6 merge in that order, each based on `main` after the one before. PR5 is based on `main` after PR3 once the owner approves it, and PR6 does not wait for it.
- **Stop conditions:**
  - Stop and ask before starting PR4: the owner approves the identity direction from before-and-after screenshots.
  - Stop and ask before starting PR5: it reverses an earlier decision not to ship React components.
  - Stop and ask if a fix would remove or rename a class, token or attribute a consumer uses.
- **Who finishes:** The implementing agent opens each pull request. The owner reviews screenshots where a unit says so, and merges.

---

## Product Contract

### Summary

Fix what an independent audit of version 0.7.0 found, plus nine findings from Botbench's upgrade. The work covers five confirmed defects, the blind spots in the system's own checks, missing states and components for code review, logs and dense views, a Botbench identity pass, and a typed React layer if the owner approves it.

### Problem Frame

The audit recommended approval with conditions and scored the system between 3 and 7 out of 10 across ten dimensions. Its verdict: a disciplined vocabulary with real enforcement that reads as built to a rulebook, has never run outside Chrome, and breaks down at product scale.

Three results matter most. The auditor built six realistic screens that passed every check the system has, and three had visible problems: the eight-agent dashboard, the code review and the execution log. The menu advertises a keyboard model that no code implements. And Botbench's default dark mode tells the browser the page is light, so native controls draw wrong on the screen Botbench actually ships.

The lowest scores were React architecture (3), brand distinctiveness (4) and product readiness (5). The system ships no React layer, and Botbench's code shows the cost: eleven copies of a busy button with four behaviours. The owner's brief asks for a distinctive monospace identity with a purposeful orange accent; the system has a sans typeface and one amber doing five jobs.

### Key Decisions

- **Correctness before appearance.** A better-looking menu that cannot be used by keyboard is still broken. Governs R1 to R5.
- **Every audit blind spot becomes a check.** A defect the tests cannot see will return. Governs R6 to R11.
- **The identity is the owner's call, made from screenshots.** Taste cannot be settled by a test. Governs R23 to R26.
- **A React layer reverses an earlier decision and waits for the owner.** Governs R27.

### Requirements

**Confirmed defects**

- R1. Menus, context menus, split-button menus and listboxes work by keyboard as their documentation says: arrow keys, Home, End, type-ahead, and Tab closes a menu.
- R2. Under any theme and mode, including a theme's default mode, native controls and scrollbars are drawn for the mode on screen.
- R3. Every gallery page reflows at 320px with no horizontal page scroll.
- R4. A table of eight agents is readable at 1280px: names stay whole, and the view can use the screen's width.
- R5. The command palette's no-match message is announced.

**Checks**

- R6. The checker fails a `data-state` value the component does not define, and a component missing the role or accessible name its contract requires.
- R7. The checker fails a control with no accessible name, an image with no `alt`, and a status badge whose icon or tone contradicts its word.
- R8. The browser suite fails when a component's rendering changes without an approved new baseline.
- R9. The behaviour and accessibility tests run in WebKit and Firefox as well as Chrome, and the supported browsers are stated from results.
- R10. Sizes come from tokens: the checker fails arithmetic on tokens that produces a size no token names.
- R11. Every text and background pair a component uses is in the contrast gate.

**Completeness**

- R12. The status set includes Failed, Done, Accepted and Rejected.
- R13. A run timeline can show a cancelled or stopped run, and a check list can show a check the runner stopped.
- R14. A step group can stay open by design, with tool calls in view, without breaking the disclosure limits.
- R15. A long single-line path or command in a code block can scroll inside the block at phone width instead of wrapping.
- R16. A tool call shows one running signal, gives a short accessible name, and takes no column for a time it does not show.
- R17. Words for actions and states are the consumer's: no component depends on "Decline" over "Deny".
- R18. A reviewer can accept or reject finished work, choose to keep or discard its branch, and add a note, from one component.
- R19. A diff shows line numbers.
- R20. A long execution log stays within a capped height, follows new output and marks errors.
- R22. Eight agents can be scanned at a glance at desktop width.

**Identity (after owner approval)**

- R23. The focus ring is distinguishable from the accent and from a selected state in every theme.
- R24. In the Botbench theme the orange accent marks the one primary action and the current location, and never a status.
- R25. Botbench's structure is set in monospace: labels, navigation, status words, table headers and numerals. Reading text stays in the sans face.
- R26. An approval's hierarchy leads with its risk, and its actions are not weaker than other actions on the screen.

**React (after owner approval)**

- R27. A React app gets typed components for the patterns it repeats, as source it copies in, so busy buttons, field errors, tool-call states and transcript following are written once.

**Proof**

- R28. The six audit screens are kept as fixtures and pass visual comparison, the checker and the accessibility scan.
- R29. A component is `stable` only when it has a consumer, passes in three browsers and has an approved baseline.
- R30. A second independent audit names no High finding and scores no dimension lower than the first.

### Acceptance Examples

- AE1. **Covers R1.** Given an open menu, when the reader presses ArrowDown twice and then End, focus moves to the second item and then the last; when they press Tab, the menu closes.
- AE2. **Covers R2.** Given the Botbench theme with no `data-theme`, the computed `color-scheme` of the root is dark and a date field's picker icon passes contrast.
- AE3. **Covers R6.** Given `data-state="runing"` on a tool call, the checker fails and names the allowed values.
- AE4. **Covers R8.** Given a 2px padding change to the button, the suite fails on the button's baseline until a new one is approved.
- AE5. **Covers R4.** Given eight agents named up to 30 characters, at 1280px no name wraps inside a word and the table uses the available width.

### Success Criteria

- Every High finding in the audit record is closed, each with a test that fails on the old code.
- The six audit screens look right to the owner at 390px and 1280px in the Botbench theme.
- Botbench removes its own Failed, Done, Accepted and Rejected mappings and its inline raw arguments after syncing.
- The second audit's recommendation is Approve, or Approve with conditions that name no High finding, with its scores recorded beside the first.

### Scope Boundaries

**Non-goals**

- Syntax highlighting and side-by-side diffs. Line numbers close the audit's finding; the rest waits for a consumer need.
- A redesign of the default neutral theme. The identity work is in the Botbench theme and the roles it needs; the default theme's focus colour changes only to stay distinct from its accent.
- Fixes in Botbench's own code. They go to its session as findings.
- Promoting every component to `stable`. R29 sets the bar; most stay `draft` until used.

**Considered and not built**

- Splitting the 310 KB stylesheet per component. It compresses to 57 KB, and one consumer loads it once. A second consumer that needs part of it would change this.
- Adopting Radix or React Aria for behaviour. Native dialog, details and popover already work, and the gaps are two keyboard models. Evidence that would change this: a third behaviour that proves hard to get right.
- Testing on physical iOS devices from this repository. WebKit on the desktop is the proxy; the owner's phone is the final check for Botbench.
- Presence and task-ownership components. The audit's collaboration screen worked with existing components, and no consumer screen needs them yet. Botbench reaching its collaboration milestone would change this.
- Moving type sizes to `rem`. Browser zoom already scales the interface, and the change would shift every layout. A consumer that must honour a reader's font-size setting would change this.
- A middle-truncating form for paths. It needs script or split markup, and scrolling closes the finding. A consumer showing that scrolling is not acceptable would change this.

#### Deferred to Follow-Up Work

- Nested navigation for settings, which the audit's settings screen lacked.
- Component styles that depend on bundle order, which the audit noted under API quality.
- Converting the remaining audit lower findings that this plan does not name.

### Open Questions

- **Blocking PR4:** Does the owner approve the identity direction in KTD9, seen as before-and-after screenshots of the six screens?
- **Blocking PR5:** Does the owner want typed React components shipped as copy-in source, reversing the earlier decision to ship classes only?
- **Deferred:** Whether the light-mode accent stays burnt amber with white text or returns to the kit's amber with dark text. PR4's screenshots show both.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Order: defects, checks, completeness, identity, React, proof.** Each stage makes the next one safer: checks added in PR2 guard the new components in PR3 and the restyle in PR4.
- KTD2. **Menu and listbox keyboard handling ship as light-DOM custom elements, like the existing five.** The metadata already promises a behaviours module. Framework apps set the same attributes themselves, and PR5 gives React a typed version.
- KTD3. **A theme's default-mode block sets `color-scheme` itself.** The reset keys the scheme off `data-theme`, which a theme's default mode does not set.
- KTD4. **Table cells and names break at word boundaries, with a minimum column width and horizontal scroll inside the table as the fallback.** `overflow-wrap: anywhere` lets the layout shrink a column to one letter.
- KTD5. **Wide layout is a container modifier and a width token, not a new layout system.** `ds-container` gains a wide form; the app shell's main column uses it for board and table views.
- KTD6. **The component contract is data.** Each component's `meta.json` gains its allowed `data-state` values, required roles and required parts. The build writes `dist/contract.json` and `dist/contract.d.ts`, and the checker validates markup against it. One source serves the checker, TypeScript consumers and the React layer.
- KTD7. **The committed review screenshots become the baselines.** The suite compares against the files in `test/visual/screenshots/` through Playwright's baseline assertions and never rewrites them; a separate command updates them. Comparison runs on Playwright's own pinned Chromium, so an update to the installed Chrome cannot fail a baseline. Baselines are platform-specific and are made and checked on the development machine.
- KTD8. **Size tokens replace arithmetic where a rule finds it.** A checker rule fails a `calc()` that multiplies a token by a fraction or produces a size no token names. The sizes it flags become named tokens: icon sizes, control widths, bar height, panel and sidebar widths. Arithmetic the rule allows stays.
- KTD9. **Identity direction for the Botbench theme, subject to the owner's approval.** Monospace carries structure and sans carries reading. Orange is spent on the primary action and the current location only. Focus is a neutral high-contrast ring. This needs two new font-role tokens, for labels and for numerals.
- KTD10. **The React layer, if approved, is source copied by the sync tool, not a package.** That keeps Botbench free of runtime dependencies. Components are thin: typed props mapped onto the class and attribute contract, with behaviour shared with the custom elements where it exists. The first cut is the four patterns with evidence of drift.
- KTD11. **The six audit screens become permanent fixtures in PR3.** They are the cases the system's checks passed while broken, so they are the regression suite for product-scale layout, and PR4's before-and-after comparison is made from them.

### Risks

| Risk | Consequence | Response |
|---|---|---|
| WebKit or Firefox lacks a feature a component relies on | A component needs a fallback or a narrower support claim | U7 fixes what it can and states the supported browsers from results |
| Contract validation flags valid consumer markup | Botbench's gate goes red on sync | Before release the Botbench session runs the candidate rendered check in its end-to-end tests, and each false finding becomes a fixture |
| Playwright's WebKit build does not run on this machine's macOS version | No WebKit results | U7 tries the install first and, if it fails, records WebKit as unverified and keeps Firefox |
| The identity pass reads as decoration | The system gets less usable | PR4 is gated on the owner's review of the six screens, before and after |
| New components repeat the audit's complaint of breadth without use | More unused surface | PR3 builds only what a failing audit screen or a Botbench finding needs, and the agent tile only if the fixed table is not enough |

### Sources and Research

- `docs/audits/2026-11-22-independent-audit.md`: the audit record this plan implements.
- Spot-checked against the code before planning: `base/reset.css` (scheme keyed off `data-theme` only), `dist/themes/botbench.css` (default-mode block without a scheme), `components/menu/meta.json` (keyboard promise) against `behaviors/` (no menu module), `test/visual/gallery.spec.mjs` (screenshots written, never compared), `components/data-table/data-table.css` and `components/avatar/avatar.css` (`overflow-wrap: anywhere`), `components/calendar/calendar.css` (308px minimum width).
- Botbench's nine upgrade findings, received 22 November 2026: missing status states, a missing timeline state, a missing check-list state, the step-group conflict, wording, the `theme-color` advice, code-block wrapping, the duration column, and a note that it has not yet adopted the announcer, which needs no change here.
- Keyboard models: the WAI-ARIA Authoring Practices menu and listbox patterns, and React Aria's Menu documentation, which the audit read.

---

## Implementation Units

| U-ID | Title | Key paths | Depends on |
|---|---|---|---|
| U1 | Menu and listbox keyboard behaviour | `behaviors/menu.js`, `behaviors/listbox.js` | none |
| U2 | Colour scheme under themes | `scripts/build.mjs`, `base/reset.css` | none |
| U3 | Reflow at 320px | `components/calendar/`, `test/visual/` | none |
| U4 | Tables and wide layout | `base/layout.css`, `components/data-table/` | none |
| U5 | Checked component contract | `checker/`, `components/*/meta.json` | U1 |
| U6 | Screenshot comparison | `test/visual/` | U3, U4 |
| U7 | WebKit and Firefox | `playwright.config.mjs` | U1, U6 |
| U8 | Size tokens for flagged arithmetic | `tokens/tokens.css`, `checker/` | U6 |
| U9 | Status and state additions | `components/badge/`, `components/run-timeline/` | U5 |
| U10 | Step group, code block, tool call | `components/step-group/`, `components/tool-call/` | U5 |
| U11 | Review decision, diff lines, log viewer | `components/review-decision/` | U5 |
| U16 | The six audit screens as fixtures | `test/fixtures/screens/` | U4, U9, U10, U11 |
| U12 | Agent tile, if the table is not enough | `components/agent-tile/` | U16 |
| U13 | Botbench identity pass | `themes/botbench.css`, `tokens/tokens.css` | U8, U16 |
| U14 | Typed React source | `react/` | U5, U9, U10 |
| U15 | Stable criteria, trial and second audit | `docs/authoring.md`, `docs/audits/` | U13 |

### PR1: Confirmed defects

Waits on: nothing.

### U1. Menu and listbox keyboard behaviour

- **Goal:** Menus and listboxes do what their documentation says.
- **Requirements:** R1, R5. Covers AE1.
- **Dependencies:** none.
- **Files:** `behaviors/menu.js`, `behaviors/listbox.js`, `behaviors/command-palette.js`, `components/menu/meta.json`, `components/context-menu/meta.json`, `components/split-button/meta.json`, `components/listbox/meta.json`, `AGENTS.md`, `test/visual/gallery.spec.mjs`.
- **Approach:** Two light-DOM elements in the style of the existing ones (KTD2). The menu element moves focus to the first item when its popover opens, keeps a roving tabindex, handles arrows, Home, End and type-ahead, skips nothing that is `aria-disabled`, and closes on Tab. The listbox element does the same for options and selection. The palette announces no match by writing the app's own sentence, held in a data attribute, into a status element that stays in the page, as the combobox does for its count. `AGENTS.md` names the modules that may write text.
- **Patterns to follow:** `behaviors/tabs.js` for structure; `behaviors/transcript.js` for deciding from current state, not a stored flag.
- **Test scenarios:**
  - Covers AE1. Arrow keys, Home and End move focus as stated and wrap at the ends.
  - A letter key moves to the next item starting with it.
  - Tab closes the menu and focus moves on; Escape closes it and returns focus to the button.
  - An `aria-disabled` item takes focus and ignores Enter.
  - A split button's menu and a context menu behave the same.
  - A listbox moves and selects by keyboard, single and multiple.
  - The palette's no-match text appears inside a status element that was already present.
  - Loading either module twice is harmless.
- **Verification:** The gallery's menu, context-menu, split-button and listbox pages pass a keyboard-only pass in the browser tests.

### U2. Colour scheme under themes

- **Goal:** Native controls match the mode on screen under every theme.
- **Requirements:** R2. Covers AE2.
- **Dependencies:** none.
- **Files:** `scripts/build.mjs`, `base/reset.css`, `docs/consumer-guide.md`, `test/themes.test.mjs`, `test/visual/themes.spec.mjs`.
- **Approach:** The generated default-mode block sets `color-scheme` (KTD3). The consumer guide says an app with a fixed dark mode ships one `theme-color`, and two only when it offers a mode choice.
- **Test scenarios:**
  - Covers AE2. With the Botbench theme and no `data-theme`, the root's computed scheme is dark.
  - With `data-theme` set to light, dark and auto, the scheme follows.
  - The default theme with no attribute stays light.
- **Verification:** A date field under the Botbench default shows a legible picker icon in a screenshot.

### U3. Reflow at 320px

- **Goal:** No gallery page scrolls sideways at 320px.
- **Requirements:** R3.
- **Dependencies:** none.
- **Files:** `components/calendar/calendar.css`, `components/split-button/split-button.css`, `components/menu/menu.css`, `test/visual/gallery.spec.mjs`.
- **Approach:** The calendar's day cells shrink below the touch size's seven-fold width while keeping 44px rows. Menus stay inside the viewport. The suite gains a 320px sweep over every page, and whatever else it finds is fixed here.
- **Test scenarios:**
  - Every component and pattern page has no horizontal page scroll at 320px.
  - The calendar shows all seven columns and both month buttons at 320px.
  - An open split-button menu stays inside a 320px viewport.
- **Verification:** The sweep passes with no page excluded.

### U4. Tables and wide layout

- **Goal:** Dense views hold together at desktop width.
- **Requirements:** R4. Covers AE5.
- **Dependencies:** none.
- **Files:** `base/layout.css`, `tokens/tokens.css`, `components/data-table/data-table.css`, `components/avatar/avatar.css`, `patterns/app-shell/`, `test/visual/gallery.spec.mjs`.
- **Approach:** KTD4 and KTD5. Add a wide width token and a wide container form; the app shell's main column takes it for table and board views.
- **Test scenarios:**
  - Covers AE5. Eight agents with 30-character names at 1280px: no name breaks inside a word.
  - The same table at 390px uses the stacked layout with labels beside values.
  - A column with an unbreakable 80-character string scrolls inside the table, and the page does not.
  - The wide container fills to its token width at 1280px and equals the standard one at 390px.
- **Verification:** A gallery example with eight agents and long names reads correctly at 1280px and 390px.

### PR2: Checks

Waits on: PR1, merge order only.

### U5. Checked component contract

- **Goal:** Markup that breaks a component's contract fails the checker.
- **Requirements:** R6, R7, R11. Covers AE3.
- **Dependencies:** U1.
- **Files:** `components/*/meta.json`, `scripts/build.mjs`, `checker/rules/contract.mjs`, `checker/check.mjs`, `dist/contract.json`, `dist/contract.d.ts`, `tokens/pairs.json`, `rules/checker-rules.md`, `test/checker/contract.test.mjs`.
- **Approach:** KTD6. Rules run in static and rendered modes: an undefined `data-state`, a missing required role or name, a control with no accessible name, an image with no `alt`, and a badge whose icon or tone contradicts a status-set word. A build step collects the text and background tokens each component rule pairs and fails on a pair missing from `tokens/pairs.json`. Add the `muted` on `surface-sunken` pair and adjust the value that fails.
- **Execution note:** The static pass over a TSX consumer covers class-name rules only, so before release send the candidate `dist/check-dom.js` to the Botbench session to run in its end-to-end tests. Every false finding it reports becomes a fixture.
- **Test scenarios:**
  - Covers AE3. A misspelt `data-state` fails and lists the allowed values.
  - A `ds-menu` with no `role="menu"` fails; a correct one passes.
  - An icon button with no label fails.
  - A badge reading "Check failed" with the success tone fails.
  - `contract.d.ts` exposes each component's state union, and a strict TypeScript fixture rejects a wrong value.
  - A component that sets muted text on the sunken surface fails the build until the pair is listed.
  - The Botbench session reports no false finding from the candidate rendered check.
- **Verification:** Every do example in the gallery passes the new rules, and each new rule has a failing fixture.

### U6. Screenshot comparison

- **Goal:** A rendering change fails the suite until approved.
- **Requirements:** R8. Covers AE4.
- **Dependencies:** U3, U4.
- **Files:** `test/visual/gallery.spec.mjs`, `test/visual/themes.spec.mjs`, `playwright.config.mjs`, `package.json`, `AGENTS.md`.
- **Approach:** KTD7. One baseline per page, width, mode and theme, at the existing file names, with animations off and fonts loaded. Screenshot tests run in the pinned Chromium project only, and the snapshot path is fixed so adding browser projects in U7 does not orphan baselines. `AGENTS.md` records that a Playwright upgrade is the one event expected to refresh them.
- **Test scenarios:**
  - Covers AE4. A 2px padding change to the button fails its baseline.
  - An unchanged tree passes on a second run.
  - The update command rewrites only the baselines that differ.
  - An ordinary run leaves `test/visual/screenshots/` untouched.
- **Verification:** Three consecutive runs on an unchanged tree pass.

### U7. WebKit and Firefox

- **Goal:** Behaviour and accessibility are known in three browser engines.
- **Requirements:** R9.
- **Dependencies:** U1, U6.
- **Files:** `playwright.config.mjs`, `package.json`, `README.md`, `docs/consumer-guide.md`, component stylesheets and behaviours that fail.
- **Approach:** Install Playwright's WebKit and Firefox and add projects for the behaviour, keyboard, accessibility-scan and reflow tests; screenshot baselines and tests that force states through Chromium's debugging protocol stay Chromium-only. Fix failures, or add a fallback behind `@supports`, or narrow the support statement.
- **Test scenarios:**
  - Dialog, sheet, popover, menu, tooltip and hover card open, close and return focus in each engine.
  - Tabs, combobox, command palette, menu and listbox pass their keyboard tests in each engine.
  - The transcript-following tests pass in each engine.
  - Form controls drawn with `appearance: none` show their checked and focus states in each engine.
- **Verification:** The README states the supported browsers and versions from these runs, and lists anything that degrades.

### U8. Size tokens for flagged arithmetic

- **Goal:** No size comes from arithmetic a token should name.
- **Requirements:** R10.
- **Dependencies:** U6.
- **Files:** `tokens/tokens.css`, `scripts/build.mjs`, `components/*/*.css`, `base/*.css`, `checker/scan-css.mjs`, `rules/checker-rules.md`, `test/checker/core.test.mjs`, `test/tokens.test.mjs`.
- **Approach:** KTD8. Write the rule first, then name tokens for what it flags and replace those expressions. Spinner keyframes move to the base layer once.
- **Test scenarios:**
  - `calc(var(--ds-size-touch) * 6.5)` fails the new rule; a named token passes.
  - `calc(var(--ds-border-width) * 2)` passes.
  - New size tokens reach the Tailwind preset, the token data file and the manifest.
  - Baselines change only where a size moved, and each change is approved.
- **Verification:** No `calc()` the rule flags remains in `base/` or `components/`.

### PR3: Completeness

Waits on: PR2, merge order only.

### U9. Status and state additions

- **Goal:** The states Botbench had to invent are in the system.
- **Requirements:** R12, R13, R17.
- **Dependencies:** U5.
- **Files:** `components/badge/`, `components/run-status/`, `components/now-doing/`, `components/run-timeline/`, `components/check-list/`, `components/data-table/examples.html`, `components/tool-call/meta.json`, `components/approval/meta.json`, `rules/content.md`.
- **Approach:** Add Failed, Done, Accepted and Rejected to the status set, starting from Botbench's choices. Add cancelled and stopped stations and a stopped check result. Move the data-table examples to status-set badges. State in the tool-call and approval metadata that action and state words are the consumer's.
- **Test scenarios:**
  - Each new state has one icon and tone, and the status-set consistency test covers it.
  - A cancelled run's timeline shows which station it stopped at, in words.
  - A stopped check differs in icon from failed and timed out.
- **Verification:** Botbench's four mappings match the system's, or the difference is stated in the changelog.

### U10. Step group, code block, tool call

- **Goal:** Tool calls can stay in view without bending the disclosure rules.
- **Requirements:** R14, R15, R16.
- **Dependencies:** U5.
- **Files:** `components/step-group/`, `components/code-block/`, `components/tool-call/`, `checker/rules/disclosure.mjs`, `rules/disclosure.md`.
- **Approach:** A step group gains a form that is a labelled region, not a disclosure, so its tool calls keep their own details as the first level. A code block gains a single-line form that scrolls inside itself. The tool call drops its second running signal, takes a short accessible name with the full command in its body, and collapses the time column when empty.
- **Test scenarios:**
  - An always-open group holding a tool call with open arguments passes the disclosure-depth rule.
  - A 120-character path at 390px stays on one line and scrolls inside the block.
  - A tool call's accessible name is its status and verb, not the whole command.
  - A tool call with no duration leaves no empty column.
- **Verification:** Botbench can remove its inline raw arguments after syncing.

### U11. Review decision, diff lines, log viewer

- **Goal:** The code-review and log screens have their own components.
- **Requirements:** R18, R19, R20.
- **Dependencies:** U5.
- **Files:** `components/review-decision/`, `components/diff/`, `components/log-viewer/`, `behaviors/transcript.js`, `rules/choosing-components.md`.
- **Approach:** The review decision has Accept as the view's primary action and Reject beside it, a keep-or-discard choice for the branch, and an optional note. The diff gains old and new line numbers. The log viewer caps its height, follows new output through the existing transcript element, offers jump to latest, and marks error lines in words and colour.
- **Patterns to follow:** `components/approval/` for structure; Botbench's `decision.tsx`, read-only, for the behaviour it needed.
- **Test scenarios:**
  - The review decision has exactly one primary action and passes the structural rules.
  - Choosing Reject reveals the note field without moving focus unexpectedly.
  - Diff line numbers are not read as part of the code by a screen reader and are not selected with it.
  - A 500-line log stays within its cap at 390px and follows only while the reader is at the bottom.
- **Verification:** Each new component's gallery page passes the browser suite, and U16 builds the code-review and execution-log screens from them.

### U16. The six audit screens as fixtures

- **Goal:** The screens the audit built exist in the repository and are checked on every run.
- **Requirements:** R28.
- **Dependencies:** U4, U9, U10, U11.
- **Files:** `test/fixtures/screens/`, `test/visual/screens.spec.mjs`, `scripts/build.mjs`.
- **Approach:** KTD11. Build the six screens from catalogue components only: eight-agent dashboard, code review, execution log, mobile approval, settings, and two-developer collaboration. They are fixtures, not gallery pages, and load the Botbench theme.
- **Test scenarios:**
  - Each screen passes the checker, the accessibility scan and its baseline at 390px and 1280px in dark and light.
  - No screen scrolls sideways at 320px.
  - The execution-log screen at 390px is no taller than three viewports.
  - The code-review screen shows the whole diff width or scrolls inside the diff.
- **Verification:** The owner can open six screenshots per mode and width, and these are the "before" set for PR4.

### U12. Agent tile, if the table is not enough

- **Goal:** Eight agents scan at a glance.
- **Requirements:** R22.
- **Dependencies:** U16.
- **Files:** `components/agent-tile/`, `rules/choosing-components.md`, `test/fixtures/screens/`.
- **Approach:** Judge the eight-agent screen built on the fixed table first. Build a compact agent tile only if the owner or the second reviewer cannot find the agent that needs them within the first row of the screen; otherwise record the table as the answer and build nothing.
- **Test scenarios:**
  - If built: eight tiles at 1280px fit without scrolling and at 390px stack as a list.
  - If built: a tile's status uses the status set, and the screen has no nested cards.
- **Verification:** The eight-agent fixture passes R22 with the table or with tiles, and the plan's changelog says which.

### PR4: Botbench identity

Waits on: PR3, merge order only. Starts only after the owner approves the direction.

### U13. Botbench identity pass

- **Goal:** A Botbench screen is recognisable without its logo.
- **Requirements:** R23, R24, R25, R26.
- **Dependencies:** U8, U16.
- **Files:** `tokens/tokens.css`, `tokens/pairs.json`, `themes/botbench.css`, `base/typography.css`, `components/pending-tray/`, `components/tabs/`, `components/approval/`, `rules/principles.md`.
- **Approach:** KTD9. Add the font-role tokens to the vocabulary with neutral defaults, then set them in the Botbench theme. Add a focus-on-accent pair to the contrast gate and change the default theme's focus colour to pass it, since the pair applies to every theme. Separate the dark theme's four near-amber hues. Produce before-and-after screenshots from the U16 fixtures, with the light accent shown both ways.
- **Execution note:** Produce the screenshots and stop for the owner's review before changing component stylesheets beyond the theme.
- **Test scenarios:**
  - Focus against accent and against a selected tab is at least 3:1 in both modes.
  - The pending tray no longer uses the accent colour.
  - The default theme's baselines change only where the focus colour or a role token changed, and each change is approved.
  - Labels, navigation, status words, table headers and numerals compute to the monospace role in the Botbench theme, and body text to the sans face.
  - An approval's actions are at least the size and contrast of other actions on the same screen.
  - Every contrast pair still passes under the Botbench theme.
- **Verification:** The owner approves the six screens at 390px and 1280px in dark and light.

### PR5: Typed React source

Waits on: PR3, merge order only. Starts only after the owner approves reversing the earlier decision.

### U14. Typed React source

- **Goal:** A React app writes its repeated patterns once, with types.
- **Requirements:** R27.
- **Dependencies:** U5, U9, U10.
- **Files:** `react/`, `scripts/build.mjs`, `scripts/sync.mjs`, `docs/consumer-guide.md`, `test/react/`.
- **Approach:** KTD10. Build the four with evidence of drift: a button with busy state, a field with error wiring, a tool call with typed state, and a transcript hook. Props are typed from `contract.d.ts`. Add another only when the Botbench session reports repeated copies of it.
- **Test scenarios:**
  - A busy button is disabled to pointer and keyboard and keeps its accessible name.
  - A field wires its error to the control and announces it.
  - A tool call rejects an undefined state at compile time.
  - The transcript hook passes the same following tests as the custom element.
  - Rendered output passes the checker in rendered mode.
- **Verification:** A fixture app built only from these components passes the browser tests, and the Botbench session confirms the set covers its eleven busy-button copies.

### PR6: Proof

Waits on: PR4, merge order only.

### U15. Stable criteria, trial and second audit

- **Goal:** Evidence that the conditions are met.
- **Requirements:** R29, R30.
- **Dependencies:** U13.
- **Files:** `docs/authoring.md`, `components/*/meta.json`, `test/trial/brief.md`, `docs/trial-report.md`, `docs/audits/`, `test/visual/screenshots/`.
- **Approach:** Write the `stable` criteria into the authoring contract and apply them. Approve the U16 fixtures' baselines as they stand after the identity pass. Rerun the blind trial with a brief that requires empty, loading and error states. Run the same audit brief again with a fresh agent.
- **Execution note:** The trial and the audit are behavioural evaluations. Run them as real agent sessions and record what they report.
- **Test expectation:** none -- the unit is evaluation and record-keeping, and its pass conditions are R30 and the Success Criteria.
- **Verification:** The second audit is recorded in `docs/audits/` with its scores beside the first, and every component marked `stable` meets the written criteria.

---

## Verification Contract

| Gate | Command | Proves |
|---|---|---|
| Unit and fixture tests | `npm test` | Build, tokens, themes, checker rules, contract, sync |
| Stale output | `npm run build` then a clean `git status` | Committed `dist/` matches sources |
| Browser suite | `npm run test:visual` | Behaviour, keyboard, accessibility scan, reflow at 320px and pointer targets; from U6 screenshot baselines in pinned Chromium; from U7 behaviour in three engines |
| Transcript stability | the transcript tests, 20 consecutive runs | The following behaviour has not regressed |
| Consumer check | the candidate rendered check, run by the Botbench session in its end-to-end tests | No false findings before a release |

Botbench's own suites belong to its session. Each release note says what a consumer must change.

---

## Definition of Done

- R1 to R20, R22 and R28 to R30 are met. R23 to R27 are met or recorded as declined by the owner.
- Every High finding in the audit record has a test that fails on the 0.7.0 code and passes now.
- Every gate in the Verification Contract passes, and the supported browsers are stated from results.
- The six audit screens are fixtures with approved baselines.
- The changelog lists every change a consumer sees, and the Botbench session has been sent each merged version.
- No experimental or abandoned code remains in any diff.

# Remediate the 23 November skills audit and overhaul Botbench's interface

## Context

The audit (`docs/audits/2026-11-23-skills-audit.md`, branch `claude/diagram-design-arch-it3ufe` of botbenchhq/design-system) measured design system 0.11.4 and Botbench against four outside rule sets. Its main findings: the desktop is a stretched phone (720px column, Accept 1,284px down the page), almost no motion, one 44px control size, no identity, four components to rebuild, overlays below what headless libraries give, and a transcript that re-renders whole on every event.

Owner decisions taken in this session:

| Decision | Choice |
|---|---|
| Architecture | Headless React layer for the interactive components, with an ADR |
| Identity | All three: amber decision dock, station glyph, boundary line |
| Density | Comfortable on desktop (32–36px controls, 14px text); 44px on coarse pointers |
| Scope | All five phases, plus a Phase 0 that completes what the audit could not do |

## What exploration changed

Checked against the code today; the plan uses these, not the audit's wording.

- **Visual change starts upstream.** Every width, radius and height in Botbench is a vendored token; `checker/vendor.mjs` fails `npm test` on any edited vendored file. Order for each unit: design-system PR → release → `scripts/sync.mjs` → Botbench PR.
- **The audit's sizes are the Botbench theme's** (`themes/botbench.css`: 12/13/15/17/22/28px, radius 10/22). System defaults are already 12/13/14/16/20/24 and 4/8.
- **`--ds-size-touch: 44px` is one token with ~151 uses in 65 files**, some as arithmetic for widths (sidebar = 44×5, list column = 480×0.6), and is hard-coded in `test/visual/gallery.spec.mjs:21`, `reflow.spec.mjs:10`.
- **Botbench's `checkDesign` (`e2e/helpers.ts:305-395`, ~50 e2e files) enforces rules the audit drops**: 44×44 controls, heading sizes, radius scale, shadow only on dialog/toast/menu. It changes in the same PR as each sync.
- **The 1024px switch (`web/src/app/wide.ts:8`) bypasses the one-breakpoint rule** because the checker reads CSS only.
- Audit corrections: `disabled={busy}` is 31 uses, not 50, and `BusyButton` is already used in `turn.tsx`; the board cap is on the server (`src/api/board.ts:46`, `FINISHED_SHOWN = 100`, no cursor); Send is not disabled on an empty prompt; the Usage table follows the contract apart from a missing scroll wrapper; `docs/browser-support.md` claims an exit transition the sheet does not have.
- Found on the way: a chat row reads "Chat · Task 12" (`work-column.tsx:94`); the review screen has two note fields back to back (`task.tsx:517`, `decision.tsx:148`); six screens each open their own EventSource; Botbench's `NOTICE` names the wrong source commit for 0.11.4.

## How the work runs

- **Two repositories**, both local: `~/claude-remote/design-system` and `~/claude-remote/botbench`. One git worktree and branch per unit (`botbench-wt/<unit>`, `design-system-wt/<unit>`); neither main checkout is touched.
- **Each unit**: plan → failing test → change → `npm run typecheck`, `npm test`, `npm run build --prefix web`, the affected e2e files → fresh-context critique against CLAUDE.md hard rules, DESIGN.md's Never list and `voice.md` → one revision → pull request with the evidence and critique summary.
- **Design-system release per unit group**: bump `package.json`, `## X.Y.Z` in CHANGELOG, `npm run build`, commit `dist/`, `npm test`, `test:visual` with reviewed baselines (Chrome on this Mac), `test:visual:webkit` and Firefox. Every new checker rule must pass the system's own CSS with zero waivers (`test/components.test.mjs:389`).
- **Each sync into Botbench** updates `web/vendor/design-system`, `NOTICE` (version and the real commit), the DESIGN.md front matter, DESIGN.md's prose rules where a rule changed, and `checkDesign`.
- **Merging**: I open each pull request and merge it once CI is green and its critique is attached, because later units build on earlier ones. Nothing is pushed to a default branch directly or by force. The owner reviews at the end of each phase, on fresh screenshots in `docs/images/`. Say so if you would rather merge yourself.
- **Not built**: any control without real behaviour behind it (CLAUDE.md, Never). The audit's per-hunk accept/reject and line comments in the diff, citations, a context-window meter and an artefact panel need engine features that do not exist; they are listed at the end as deferred, not built as shells.
- The plan itself is committed to `docs/plans/` in both repositories with the first pull request.

## Phase 0: finish the audit

Output: `docs/audits/2026-11-23-skills-audit-addendum.md` in design-system, committed together with the audit and its `2026-11-23/` screenshots (fetched from the audit branch), plus the corrections listed above. No product code changes.

| Gap | How |
|---|---|
| Impeccable's detector | `npx impeccable detect web/src` in a Botbench worktree; findings merged into the table by severity. It runs a third-party package locally over the source; read what it does first. |
| A transcript with a model's work | Measure Chat and Task with the recorded sessions (`e2e/serve-replayed-chat.ts`, `-build.ts`, `-northstar.ts`), then one live chat turn and one live task on this Mac's signed-in CLIs. Same measuring script as the audit: control heights, text sizes by share, row heights, line lengths. |
| Performance | A recorded session lengthened to 500, 2,000 and 5,000 events, replayed through the driver contract; Playwright with Chrome tracing records script time per event, long tasks and memory. This is the before-number for Phase 3. |
| Firefox and Safari | `e2e/design-checks.desktop.ts` and the phone project run under Playwright's Firefox and WebKit; the component interactions the audit tried in Chromium repeated in both. |
| Phone pass | Work and Run at 390×844 after their lists load; Settings, Permissions, Usage, Thread and Sign in added. |
| Screen reader | axe plus accessibility-tree snapshots on every screen, and the route, dialog and live-region paths walked with VoiceOver's rotor order where it can be scripted. A person listening with VoiceOver, and a real phone in hand, remain the owner's to do. |
| Browser support stated from memory | `@starting-style`, `transition-behavior: allow-discrete`, `overlay`, anchor positioning, `interestfor`, container queries and `field-sizing` checked against MDN's compatibility data and against the three engines directly; `docs/browser-support.md` corrected. |
| Product comparisons | Left as reviewers' knowledge, and marked so. |

## Phase 1: foundations

### Design system 0.12 (tokens), 0.13 (motion), 0.14 (platform and rules)

**Size and density** (`tokens/tokens.css`, every component using `--ds-size-touch`)
- Control scale `--ds-size-control-xs/sm/md/lg` = 24/28/32/40. `--ds-control-height` resolves by density: compact 28, comfortable 36, touch 44.
- Density set by `data-ds-density` on a container. Default: comfortable on a fine pointer, touch under `(pointer: coarse)`, with the hit area extended to 44px there.
- `--ds-size-touch` keeps meaning "minimum coarse-pointer target". The width arithmetic built on it moves to named width tokens (sidebar, list column, inspector).
- Spacing gains 2, 6, 20, 40, 64. Radius becomes 4 (badge), 6 (control), 10 (card, code), 14 (dialog), pill for chips, segmented controls and Send; inner radius = outer − padding.

**Type**
- The audit's seven roles (micro 11/14 to display 26/30) in rem, with tracking tokens, inline mono at 0.93em, tabular numerals on durations, counts and totals, balanced wrapping on headings. One pixel larger at touch density.
- `themes/botbench.css` moves to the new roles; body 14px, helper text no smaller than 13px on settings screens.

**Colour and depth**
- Status hues cut from eight to five (working, passed, failed, needs-you amber, outside); queued, stopped and cancelled become neutral with a glyph. `statusSet` changes with its six components; `tokens/pairs.json` updated.
- The audit's contrast-checked values only: dark third-level text `#8C8C92`, light amber `#AB5A05`, control-edge borders at 3 to 1. The neutral ramp stays.
- Three shadow levels (card, menu, dialog). Amber is reserved for what waits on the owner.

**Motion** (0.13)
- Tokens: durations 80/120/180/240/280/500; four easings (enter, move, leave, sheet).
- `base/reset.css`: reduced motion turns movement off and keeps opacity and colour at ≤120ms; a loader becomes a slow pulse.
- Press `scale(0.97)`; dialog, sheet, menu, popover entrance and exit with `@starting-style` and `allow-discrete` (as Phase 0 confirms support); backdrops fade.
- Switch thumb on `translate`; progress fill consistent across engines; nine spinner keyframes become one, started on a shared timeline; tooltip delay; toast entrance and exit.

**Platform and rules** (0.14)
- `touch-action`, tap-highlight, `overscroll-behavior: contain` on dialog and sheet, all four safe-area insets, `forced-colors` and `prefers-contrast` rules, `scroll-margin` under sticky headers, a skip-link component.
- A second breakpoint (1024px) and container queries become part of the system, so `wide.ts` stops being an exception.
- The 2px side stripe on current rows is replaced; the data table's phone layout keeps its roles in WebKit.
- `rules/never.md`, `core.md`, `checker-rules.md`, `AGENTS.md` rewritten per the audit's verdict table. New checker rules: hand-written easing, `transition: all`, animated layout property, side stripe; `off-breakpoint` allows both breakpoints; the 44px test applies to coarse pointers.

### Botbench quick fixes (do not wait for the sync)

| Fix | Where | Reuse |
|---|---|---|
| Remove `maximum-scale=1` | `web/index.html:5` | |
| Enter sends, Shift+Enter breaks a line on a fine pointer; unchanged on touch; a visible hint | `screens/turn.tsx:606` | wording per `voice.md` |
| Busy buttons stay enabled | 31 `disabled={busy}` sites | `react/busy-button.tsx`, `ConfirmAction`'s `busy` (`components/confirm.tsx:60`) |
| Page title, focus to the h1 and an announcement on navigation; skip link | `app/shell.tsx:21`, `components/header.tsx:126` | the heading-focus pattern in `decision.tsx:222` |
| Focus after Take back | `screens/trust.tsx:261` | `focusEdit` in `run.tsx:206` |
| One format module on `Intl` (dates, clocks, durations, plurals) | new `web/src/app/format.ts`; replaces six copies of `when`, four duration helpers, 44 plural ternaries | |
| File name never breaks inside a segment; badge under the name on a phone | `screens/task.tsx:459` | |
| "Chat · Task 12" label; one note field on review | `work-column.tsx:94`; `task.tsx:517`, `decision.tsx:148` | |
| Retry on the disconnected banner, shown on every screen; `online` and `visibilitychange` listeners | `components/header.tsx:101`, `api/client.ts:1342` | banner contract in `components.json` |
| Guard on unsaved plan edits | `screens/run.tsx:60` | `ConfirmDialog` |
| "Saved" status on Settings selects; live region and scroll-to-latest on Thread; no focus-on-mount on a phone | `screens/settings.tsx`, `screens/thread.tsx`, `sign-in.tsx:93` | `useTranscript` |

Then the sync of 0.12–0.14, with `checkDesign` and DESIGN.md updated to the narrowed rules.

## Phase 2: Botbench's layout

**Design system 0.15**: `split-panel` rebuilt (drag and keyboard resize, `role="separator"`, limits, collapse, remembered layout); a decision dock; a one-line work row; the station glyph (five ticks: Plan, Build, Verify, Review, Decide); the boundary treatment (dashed outline and outbound glyph); skeleton with a show delay.

**Botbench**
- **Three panes on a desktop**: one grouped list of work (260px) replacing both the left column and the board; the transcript (720px); an inspector (360px) holding checks, changed files and the decision. `app/shell.tsx` `Beside`, `components/work-column.tsx`, `screens/board.tsx`, `screens/task.tsx`.
- **Decision dock**: the inspector's footer on a desktop, fixed at the bottom on a phone; the only amber on screen. Keys for allow and decline fire only when focus is outside a text field, and never for an action the safety floor names as dangerous, which keeps its confirmation. STRIDE note added to `docs/security/threat-model.md` in the same PR.
- **Station glyph** in every work row, the tab title and the favicon, from the task's real station.
- **Boundary line** only on things that really leave the Mac: a push, a pull request, a web search or fetch approval.
- **Rows and titles**: one-line rows of 32–36px (glyph, truncated title, repository, age); the task title at 20px clamped to two lines with code drawn as code (`task-status.ts:126`).
- **Evidence**: result first, lines capped near 68 characters, the caveat in a disclosure (`components/evidence.tsx`). Allow solid and Decline quiet inside the transcript (`approval-card.tsx:368`).
- **Address and history**: board filter, hidden view, open sheet and chosen attempt in the address; a chat keeps its own address; Back closes a sheet; scroll restored (`app/route.ts`, `turn.tsx:30-63`).
- **Older rows**: a cursor on `GET /api/board` (`src/api/board.ts:166`), input validated, with "Show older" as in the action log (`trust.tsx:243`). Server test first.
- **Sending and loading**: optimistic send with the failure restoring the text (`turn.tsx:508`); skeletons after a delay in place of immediate spinners; one shared EventSource for the app.
- A script that regenerates `docs/images/` from the e2e fixtures, since none exists.

## Phase 3: the transcript

- Events held in a store that appends in place; rows become memoised components keyed by event id; markdown parsed once per text (`components/transcript.tsx`, `markdown-view.tsx:13`); the two effects without dependency lists in `turn.tsx:438-451` removed.
- `content-visibility: auto` on rows first, measured against Phase 0's numbers at 5,000 events; a windowed list only if that falls short.
- The prose renderer moves into the design system's React layer and gains headings, quotes, tables and links. It keeps building React nodes from a data tree, never HTML strings. Links: `http` and `https` only, opened in a new tab without an opener; model text stays data.
- Highlighted code with a copy button; the highlighter's source (own tokeniser or a dependency) is decided in the Phase 4 ADR.
- Motion for work in progress: block fade-in, tool-call rise and spinner-to-check, finished steps folding, the approval's 280ms entrance, the run-finished moment.

## Phase 4: the interactive layer

1. **ADR first**, in both repositories (Botbench `docs/adr/0011`, design-system's first): one headless library, not two. Base UI and React Aria compared on React 19 support, licence, bundle size, release maturity and `npm audit`, read from their current documentation at that time. Lockfile, `NOTICE` and the zero-dependency rule's wording updated with it.
2. Components that emit the same `ds-` classes, so the checker and the closed vocabulary carry on: menu with submenus and typeahead, select, combobox, popover, tooltip with delay groups, hover card, context menu, toast stack with swipe and pause, sheet with drag to dismiss, dialog, tabs and segmented control with the sliding indicator.
3. The vanilla behaviour modules stay for consumers without React.
4. Botbench moves each use over, screen by screen.

## Phase 5: rebuilds and additions

- **Diff review**: split and unified views, word-level marks, expandable context, collapse and "viewed" per file, next and previous change keys, syntax colour.
- **Log and terminal output**: ANSI colour, line numbers, search, collapsible groups, follow toggle, windowing.
- **Tree**: `role="tree"`, arrow keys, typeahead, one tab stop, selection, change counts, a filter.
- **Data table**, the **composer** with mention and command menus and the existing model picker (`components/model-picker.tsx`), the **command palette** with a shortcut registry and help overlay, the **plan list** above the composer, and a repository and branch switcher over what Botbench already knows.
- Components move from `draft` to `stable` as they settle, with written criteria added to `docs/authoring.md`.

**Deferred, and said so in the addendum**: per-hunk accept and reject, comments on diff lines, citations, a context-window meter, an artefact panel, usage charts beyond today's data. Each needs engine behaviour first.

## Verification

- **Each unit**: `npm run typecheck`, `npm test`, `npm run build --prefix web`, affected e2e files; in design-system `npm run build`, `npm test`, `test:visual`, `test:visual:webkit`, Firefox.
- **Each phase**: full `npm run e2e` once on main, `npm run test:confined`, and `npm run test:live` where a real CLI turn is what is being proved.
- **Against the audit's own numbers**, by re-running Phase 0's measuring script:
  - Accept in view at 1280×800, 1440×900 and 390×844 without scrolling.
  - At least 14 work rows in view at 1440×900; the same work listed once.
  - Content uses the window at 1440; prose lines ≤ 68 characters.
  - No control under 44px on a coarse pointer; 32–36px on a fine one.
  - Per-event script time at 5,000 events against the Phase 0 baseline.
  - Dialog, sheet, menu and toast each have an entrance and an exit; a loader still moves under reduced motion.
  - axe clean on every screen in Chrome, Firefox and WebKit.
- **Evidence for the owner at each phase**: regenerated `docs/images/`, the before-and-after measurement table, and the critique summaries on the pull requests.

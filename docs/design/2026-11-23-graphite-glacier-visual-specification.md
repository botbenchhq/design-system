# Botbench visual specification: Graphite + Glacier

23 November 2026. It replaces the first draft of the same day and holds both rounds of the owner's decisions.

**Status.** Direction A, Graphite + Glacier, is approved. The final boards were sent to the owner as a PDF and are not yet visually approved. Approval of production behaviour is pending. Nothing here is a promise that the product does something: section 6 separates what is styling from what the system must first guarantee.

**The boards.** Forty-seven boards for direction A are on the design canvas, corrected after the owner's second round. All of them are pictured in appendix C. Eight are shown in the text.

**What the pictures are.** Every picture in this document is a render of a mock-up's markup and the reference stylesheet in headless Chrome, at the mock-up's own size. None is a picture of a built product. The canvas tool the mock-ups live in was not run: the render fills in the mock-up's values by hand and draws the result. Firefox, Safari and a real phone were not used. A phone board is a 390 by 844 frame drawn in desktop Chrome at twice the pixel density.

**Sources.** [The owner's design decisions of 23 November 2026](2026-11-23-design-decisions.md) (binding). The reference stylesheet [`2026-11-23/graphite-glacier.css`](2026-11-23/graphite-glacier.css): its `.v2{…}` block is dark and `.v2.dir-a.light{…}` is light; directions B and C in it were not chosen. The forty-seven final boards for direction A on the design canvas, each with its note. The design system at `origin/main` (`c0be2a8`, version 0.11.4) and two unreleased local commits of foundations work (type in rem, densities, spacing and radius scales), which are not on `main` and which a reader of the repository cannot open. Botbench at `origin/main` (`0f31463`).

**How the values were read.** Every direction A value in section 2 was read from the final stylesheet. The contrast figures in section 4 and appendix B come from a script over the same file. A second check ran in the browser on all 47 boards in dark, and in light on the five new layout and Settings boards and the two boards that are light by default: no text node under 4.5:1 as drawn, no text under 12px, no phone control under 44px high, nothing cut without a `title`. No board has a finding.

## 1. What is decided

**Direction**

- Direction A, Graphite + Glacier, is approved. No more colour identities are explored.
- The iteration 2 information architecture stays. No further broad redesign: the corrections of the second round are finished, the tokens are reconciled with the design system, and the work goes to a pull request with screenshots, tests and the three lists of section 6.

**Refinements the owner asked for, and where the final boards stand**

| # | Asked for | On the final boards |
|---|---|---|
| 1 | The real two-part Botbench mark, not a coloured rounded square | Two brackets that meet at a seam, drawn in one colour, the colour of the text beside it. 20px in the navigation. The two-tone mark stays for app icons. |
| 2 | Review: a simpler evidence panel in the order verification result, changed files, limitations, supporting activity, with the four kinds of claim kept apart | Drawn in that order on `V2Review`. A check, a model's review, the agent's statement and what nothing verified each have their own shape (5.1). |
| 3 | Decision panels a little lighter; routine neutral, risk stronger, destructive different in kind | Five levels, drawn side by side on `V2Levels` (5.2). |
| 4 | Home as a work queue that reads at twenty and at fifty items | `V2Home`, `V2HomeMany`, `V2HomeFifty` (5.3). The headline stays. |
| 5 | No "Planned" labels inside the application frame | None inside an application frame. The class is still in the stylesheet and is unused. What is speculative is named in the note beside each board; one whole board, the shared-work view, is planned and says so in its title. |
| 6 | A truncated title gives its full name | Every text the renders cut carries a `title` attribute, and the open item is named in full in the navigation, where it wraps. Conflict 3.13 still applies. |
| 7 | Warmth through typography, surface treatment and the brand, with no added colour | Heavier, tighter headings (2.2), most cards without a border in dark (2.9 and conflict 3.19), the mark. No colour was added. |

**Product decisions**

- Stale evidence blocks the normal Accept. Evidence is current only when tied to the exact commit under review. A newer commit, uncommitted changes or an invalidated result remove the normal Accept. The recovery is "Run checks again" or "Inspect changes", by cause.
- "No checks are set up" is a separate, honest state. Accepting is still possible there, subject to policy, and is never called verified.
- An unverified-accept override is not drawn. If it is ever built it is distinct, intentional and logged.
- Home is the summary and triage view. Work is the complete searchable inventory of tasks, runs and chats. Home's groups are Needs you, In progress, Waiting, Completed.
- To build: Waiting as its own group; attention ordered by simple, stated rules; the intent picker beside the composer; a note sent with Resume; Stop on a single task; layouts at 768px and 1280px in addition to today's switch at 1024px, which stays.
- Deferred, and not drawn: "Pick up where you left off"; the agreement summary across agents; a default model per agent. This document specifies none of them.
- Dropped: single-key Accept and Reject. No single keypress accepts, rejects, allows, or confirms a destructive or elevated-risk action. Shortcuts are for navigation. No decision button on a final board carries a key hint; the only key hints left are Tab, Enter, Esc, the arrows and Shift F10 on the accessibility board.

**The second round, after the refinement pass**

1. **Failures.** A failure that can be recovered is under Needs you. Completed means successful outcomes only. A terminal failure stays discoverable in Work with its real Failed state. Failures are never hidden.
2. **Files left behind by checks block Accept selectively.** A changed tracked source or configuration file, or an untracked file that could affect the reviewed result, the checks or the deliverable, removes acceptance readiness. Ignored, harmless artifacts such as coverage output do not block Accept by themselves: they are disclosed and cleaned up. Verification must correspond to the exact artifact accepted.
3. **Accepting without checks.** An outlined, secondary button labelled "Accept without verification", with the explanation that no checks ran. Never a green success treatment. Never offered as a way round failed or stale checks.
4. **The word "Blocked" is not shown.** The voice guide stays as it is. The group is "Waiting", and each item names a concrete cause: "Waiting on usage limit", "Waiting on dependency" (another task), "Waiting on teammate" (a paired workbench). "Needs you" is for what requires the owner.
5. **Breakpoints.** Today's 1024px transition stays, with adaptations at 768px and 1280px: three panes on a wide desktop, two in between, one pane with a sheet-based inspector on smaller screens. The content width actually available is validated, not only the breakpoint numbers.
6. **Tokens.** A fourth surface token only for a distinct semantic role. A borderless variant for decorative panels is fine, but pane boundaries in dark must not be invisible everywhere: the navigation, the inspector and interactive controls keep clear separation.
7. **A refused command** keeps "See the rule" and "Send a note". "Make the mode stricter" lives in the run's own control menu and is never presented as a way to make a refused command permissible.
8. **"Always allow"** is explained by a focusable disclosure that works on touch and keyboard and states exactly what is authorised, its scope, and whether the grant persists. No hover-only explanation.
9. **Three things are kept separate** in the plan and in this document: what can ship as styling, interactions that can ship on existing backend capabilities, and new correctness guarantees that need engineering.

**The frame every screen shares**

- Navigation, 264px: the mark and the name, then Home (with the count of things that need you), Work, Chats, New chat or task. Under them, a label "Open" and the one open item, named in full with its state mark. At the foot, the workbench, how many agents are available, and Settings. Settings replaces the list with "Back to Home" and its own groups. Under 1280px it is a rail of icons, and under 1024px it is behind a menu button in the top bar.
- On a phone the same places are a bottom bar: Home, Work, Chats, New, Settings.
- Main column: a 56px top bar (a trail and the state on a task; the agents and the pairing on Home and Work), then the page.
- Inspector, 340px (312px under 1440px), on a task: the decision or the steering, then facts about the task.

## 2. Tokens: the system today, the unreleased commits, and direction A

How to read the tables. "Main" is the design system on `origin/main` under the Botbench theme (`themes/botbench.css` over `tokens/tokens.css`). "Unreleased" is the value in the two unreleased local commits, shown only where they changed it. "A" is the final stylesheet. Actions: keep, change value, new token, remove.

Three facts frame every action:

- The vocabulary is closed. `AGENTS.md`: "The token vocabulary is closed. Do not add a token name to solve a local problem. A theme changes values only." A new token is a change to `tokens/tokens.css` for every theme, with pairs in `tokens/pairs.json`.
- After the unreleased commits a theme "sets colours, the two font stacks and the shadow. It cannot set a type size, a line height, a tracking or a radius". So A's type, radius and size values become the system's defaults, for every consumer. Which other apps consume the system was not checked.
- Colour tokens are six-digit hex, with the dark value repeated in the `[data-theme="dark"]` and `[data-theme="auto"]` blocks.

### 2.1 Colour by role

The unreleased commits change no colour, so that column is left out. Values are dark / light.

| A role | System token today | Main, Botbench theme | Direction A, final | Action |
|---|---|---|---|---|
| `--canvas`, the page | `--ds-color-surface` | `#161618` / `#F2F2F7` | `#111316` / `#F5F6F7` | Change value. Same meaning. |
| `--surface`, navigation, inspector, the phone's bottom bar and action band | none | n/a | `#181B20` / `#FBFBFC` | New token, for one semantic role: a pane of the app shell. Name to agree (`--ds-color-surface-pane`). The owner allows a fourth surface token only for a distinct role; see 2.9. |
| `--raised`, cards, decisions, dialogs, sheets | `--ds-color-surface-raised` | `#212124` / `#FFFFFF` | `#20242B` / `#FFFFFF` | Change value (dark only). |
| `--sunken`, inputs, diffs, output | `--ds-color-surface-sunken` | `#0F0F10` / `#EDEDF1` | `#0B0D10` / `#EEF0F2` | Change value. |
| `--fill`, chips, neutral tags, the selected row, the segmented track, a disabled button | `--ds-color-fill` | `#2C2C30` / `#E9E9EE` | `#2C3139` / `#ECEEF1` | Change value. In light, fill and sunken are now two values. |
| `--line`, the hairline inside one surface | `--ds-color-border` | `#29292D` / `#E6E6EB` | `#2A2F37` / `#DFE2E7` | Change value. |
| `--seam`, the border of a pane and of a card | `--ds-color-border` | as the hairline | the hairline, `#2A2F37` / `#DFE2E7`, in both modes | Keep. No new token: navigation, inspector and the phone bar have a 1px hairline in dark and in light. A plain card is the exception; see 2.9. |
| `--edge`, control borders | `--ds-color-border-strong` | `#75757C` / `#86868B` | `#727D8B` / `#76808E` | Change value. Add `ui` pairs on sunken, fill, and the attention and peer tints to `pairs.json` (section 4). |
| `--text` | `--ds-color-on-surface` | `#F5F5F7` / `#1C1C1E` | `#F2F3F5` / `#1A2028` | Change value. |
| `--text2`, secondary text | `--ds-color-muted` | `#A1A1A8` / `#636366` | `#ADB4BE` / `#545E6B` | Change value. Add the pairs muted on sunken and muted on fill. |
| `--act` as the primary button fill | `--ds-color-accent` | `#F5F5F7` / `#1C1C1E` | `#7CB7FF` / `#215BB8` | Change value. Conflict 3.1. |
| none | `--ds-color-accent-hover` | `#D8D8DC` / `#3A3A3C` | not defined | A must supply a hover value. The token is required and has a pair with on-accent. |
| `--on-act` | `--ds-color-on-accent` | `#161618` / `#FFFFFF` | `#0B1522` / `#FFFFFF` | Change value (dark). |
| `--act` as the focus ring | `--ds-color-focus` | `#4C9DFF` / `#0066CC` | `#7CB7FF` / `#215BB8` | Change value. Same hex as accent. |
| `--act` as active work (Working, Checking) | `--ds-color-info` | `#60A5FA` / `#2360E8` | `#7CB7FF` / `#215BB8` | Change value. Same hex as accent. |
| `--act-bg` | `--ds-color-info-subtle` | `#132438` / `#E9F0FF` | `#16263A` / `#E6EEFB` | Change value. |
| `--peer` | `--ds-color-peer` | `#06B6D4` / `#03748F` | `#60D4D4` / `#0C7187` | Change value. |
| `--peer-bg` | `--ds-color-peer-subtle` | `#002830` / `#DCF5FE` | `#10292B` / `#E0F3F6` | Change value. |
| `--attn`, needs a human decision | `--ds-color-approval` | `#FBBF24` / `#8F6202` | `#F2B95D` / `#97600E` | Change value. Same meaning. |
| `--attn-bg` | `--ds-color-approval-subtle` | `#2D2106` / `#FEF3C7` | `#2E2513` / `#FBF0DC` | Change value. |
| `--ok`, a check that passed, a result that was accepted | `--ds-color-success` | `#34D399` / `#037A54` | `#6ED5A4` / `#146A4A` | Change value. A finished step is not green: it is a neutral tick (5.7). |
| `--ok-bg` | `--ds-color-success-subtle` | `#09291D` / `#DCF8E9` | `#12281F` / `#E1F3EA` | Change value. |
| `--err`, failure, refusal, what cannot be undone | `--ds-color-danger` | `#F25050` / `#BA1C1C` | `#FF898A` / `#B43E46` | Change value. |
| `--err-bg` | `--ds-color-danger-subtle` | `#2F1614` / `#FEEBE8` | `#331A1C` / `#FBE6E7` | Change value. |
| none | `--ds-color-warning`, `-subtle` | `#FDE047`, `#292306` / `#736C02`, `#F3F2D7` | none | Keep the name, change value to the attention pair. Conflict 3.9. |
| none | `--ds-color-blocked`, `-subtle` | `#B285F8`, `#261D35` / `#6A31C4`, `#F1EDFF` | none; Waiting rows are drawn neutral | Keep the name, change value to the neutral pair (muted on fill). Conflict 3.9. |
| none | `--ds-color-tainted`, `-subtle` | `#FB7C2E`, `#341C0F` / `#BC4100`, `#FFEBE5` | the "Outside text" mark is drawn in the peer pair | Open question 1. Conflict 3.9. |
| scrim | none (the dialog and sheet draw their own `::backdrop`) | not compared | `rgb(0 0 0 / .55)`, both modes | Keep the component's backdrop. Its value on main was not read. |

### 2.2 Type sizes and line heights

Sizes are size/line in px at a 16px root. A's font stack is `system-ui, -apple-system, "Segoe UI", sans-serif` and `ui-monospace, "SF Mono", Menlo, monospace`, which the Botbench theme already sets. No font is loaded.

| A role | System token today | Main, Botbench theme | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| View title | `--ds-text-2xl` | 28px, 1.2 | 1.625rem, 1.154 (26/30), −0.02em | 28/34, weight 680, −0.022em | Change to 1.75rem, leading 1.214. Keep −0.02em. Weight: see the last row. |
| Heading: a section, a decision's question | `--ds-text-xl` | 22px, 1.25 | 1.25rem, 1.3 (20/26), −0.015em | 20/26, weight 650, −0.014em | Keep the unreleased value. |
| Sub-heading, card title | `--ds-text-lg` | 17px, 1.4 | 1rem, 1.375 (16/22), −0.01em | 16/22, weight 620, −0.006em | Keep the unreleased value. |
| Body | `--ds-text-ui`, `--ds-leading-ui` | 15px, 1.45 | 0.875rem, 1.5 (14/21) | 15/23 | Change to 0.9375rem, leading 1.533. Conflict 3.3. |
| Navigation, a default button's label, table cell, key and value | none | 15px role used | 14/21 as `--ds-text-ui` | 14/20 | New token (`--ds-text-md`, 0.875rem, leading 1.429). A needs both 14 and 15. |
| Metadata, and the label over a group or a field | none on main | 12px role used | `--ds-text-sm` 0.8125rem, 1.385 (13/18) | 13/18; the label is weight 600, sentence case, no tracking. A small button, a segment and a chip also set their label at 13px | Keep the unreleased value. The capitals and the +0.03em of the first draft are gone, so no tracking token is needed. |
| Small label: tag, source label, table head, count, the phone bar | `--ds-text-xs`, `--ds-leading-xs` | 12px, 1.4 | 0.75rem, 1.333 (12/16) | 12px. Weight 600 on a tag, a count and a table head (12/16); 500 on an outline tag and on a source label that is not a check; 400 on the phone bar, 600 for its active place | Keep. The smallest size there is. |
| 11px micro | none on main | none | `--ds-text-2xs` 0.6875rem (11/14), `--ds-tracking-2xs` | not used | Remove from the unreleased commit. Conflict 3.8. |
| Mono block: diff, command output | `--ds-text-mono` | 13px, 1.5 | 0.8125rem, 1.5 | 13/20 | Keep. |
| Inline code | none | inherits | 0.93em in the base layer | 0.9em; 1em inside metadata and a table head, so it never falls under 12px | Keep 0.93em, with the same exception. |
| Composer text | none | n/a | n/a | 16/24 | No token: the sub-heading size at regular weight. Designer to confirm it is meant to be larger than body. |
| A figure (Usage) | none | n/a | n/a | 26/32, weight 650, −0.02em | The `stat` component's own size. No token. |
| On the phone root | none | none | every size one pixel larger on a coarse pointer | body 16/24; button and input 16; small button and segment 14; title 24/30; metadata and tags unchanged | Plus-one gives the body and the inputs, not A's control label or its smaller title. See the note under the table. |
| Weights | `--ds-weight-normal`, `-medium`, `-semibold` | 400, 500, 600 | same | 400, 500, 600, and 620, 650 and 680 on headings and the brand | Conflict 3.16. |

On the phone root the unreleased plus-one rule and A differ in two places. A's control label goes from 14 to 16, and A's title is smaller on a phone, not larger. Recommended: keep plus-one for body and inputs, set a control's label to the body size on a coarse pointer, and set the title to 1.5rem under 768px.

### 2.3 Spacing

A's stated scale is 4, 8, 12, 16, 24, 32, 48.

| Step | System token today | Main | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| 2px | none | none | `--ds-space-2xs` | gaps in a segment, a settings row, a list of points | Keep the unreleased token. |
| 4px | `--ds-space-xs` | 4px | same | 4 | Keep. |
| 6px | none | none | `--ds-space-xs-sm` | label margin, chip and tag gaps | Keep the unreleased token. |
| 8px | `--ds-space-sm` | 8px | same | 8 | Keep. |
| 12px | `--ds-space-md` | 12px | same | 12 | Keep. |
| 16px | `--ds-space-lg` | 16px | same | 16; the page padding on a phone | Keep. |
| 20px | none | none | `--ds-space-lg-xl` | card and decision padding, a claim row's sides, though the stated scale omits it | Keep the unreleased token. |
| 24px | `--ds-space-xl` | 24px | same | 24; the inspector's and a dialog's padding | Keep. |
| 32px | `--ds-space-2xl` | 32px | same | 32; the page padding with a mouse | Keep. |
| 40px | none | none | `--ds-space-3xl` | not in A | A has no use for it. The design system's maintainer decides whether it stays. |
| 48px | none | none | none | in the stated scale; drawn only as the padding of the reference boards and as a height | No token until a screen uses it. |
| 64px | none | none | `--ds-space-4xl` | not in A | A has no use for it. The design system's maintainer decides whether it stays. |
| 3, 5, 10 and 14px | none | none | none | one-off paddings and gaps in the stylesheet (the segmented track, a key, the band, a claim's head) | Snap to 2 or 4, 4 or 6, 8 or 12, 12 or 16. No token. |

### 2.4 Radii

| A role | System token today | Main, Botbench theme | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| Tag, key, source label | `--ds-radius-sm` | 10px | `--ds-radius-xs` 4px | 6px | Change `xs` to 6px. |
| Control: button of either size, input, select, navigation row, segmented track | `--ds-radius-md` | 22px (a pill at 44px) | `--ds-radius-sm` 6px | 10px | Change `sm` to 10px. The 8px step of the first draft is gone: a small button is 10px too. |
| A segment inside its track | none | n/a | inner-radius rule | 7px (10 less the 3px of padding) | The inner-radius rule already gives it. |
| Output block | none | n/a | none | 8px | No token. Take the control radius. It is the one 8px left. |
| Card, decision surface, message | `--ds-radius-md` | 22px | `--ds-radius-md` 10px | 12px | Change `md` to 12px. |
| Dialog, sheet (top corners), composer | `--ds-radius-md` | 22px | `--ds-radius-lg` 14px | 16px | Change `lg` to 16px. |
| Pill | `--ds-radius-full` | 9999px | same, for a listed set of shapes | chips, counts, avatars, marks, the sheet's handle | Keep. Update the list: A draws the segmented control and Send at the control radius. |

### 2.5 Control heights and fixed widths

| A role | System token today | Main | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| Default control | none (`min-height: var(--ds-size-touch)` everywhere) | 44px | `--ds-size-control` 36px; compact 28, touch 44; 44 on a coarse pointer | 40px, 44 on the phone root | Change the comfortable value to 40px. Conflict 3.4. |
| Small control | none | 32px drawn, 44px target | small button 28px (`--ds-size-control-sm`); `-md` is 32px | 32px, mouse layouts only; no phone board uses one | `ds-button--small` takes `--ds-size-control-md`. |
| Navigation row | none | 44px | `--ds-size-row` 36px | 36px; 44px in the icon rail | Keep 36px. |
| List row | none | 44px | `--ds-size-row` 36px | at least 48px; 56 with two lines (60 for a row of Home's queue), 40 short | Set as `min-height`. No token. |
| Table row | none | 44px | 36px | 44px; 36px in Work's dense table | Comfortable and compact density, as the unreleased commit has them. |
| Tab | none | 44px | 36px | 40px | Takes the control height. |
| Segment | none | n/a | `--ds-size-control-md` 32px | 32px in a 38px track; 44px on the phone | Keep. |
| Chip | none | n/a | `--ds-size-control-sm` 28px | 28px | Keep. |
| Tag | none | n/a | `--ds-size-control-xs` 24px | 24px | Keep. |
| Source label | none | n/a | none | 20px. It is not pressable | Part of the evidence row (5.1). No token. |
| Touch floor | `--ds-size-touch` | 44px | 44px, coarse pointer only | 44px | Keep. |
| Fine-pointer floor | none | 44px | 24px | 24px, 8px between neighbours | Keep. |
| Navigation column | none | n/a | `--ds-size-sidebar` 260px | 264px from 1280px; a 64px rail of icons from 1024 to 1279px; behind a menu button under 1024px | Build at the token's 260px; the 4px is not meant. The rail is a new width for the app shell. |
| Inspector | none | n/a | `--ds-size-inspector` 360px | 340px from 1440px; 312px from 1024 to 1439px; a sheet under 1024px | Change to 340px. 312px belongs to the app shell's narrower layouts (5.5). |
| Reading column | `--ds-size-transcript` | 720px | same | 760px; 920px for the one centred composition (New chat or task) | Change value to 760px. |
| Wide content | `--ds-size-wide` | 1200px | same | 1040px (Home, Work) | Keep 1200px for tables in general. Home and Work set 1040px. |
| Dialog | `--ds-size-column` | 480px | same | 520px | Build at the token's 480px unless the Removed and Kept lists of the destructive dialog do not fit; then change the token. |
| Top bar, phone top bar, phone bottom bar | none | n/a | none | 56px, 56px, 60px | No token. They come from `app-header` and `tab-bar`. |

### 2.6 Shadow

| A role | System token today | Main | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| Dialog and sheet | `--ds-shadow-overlay` | `0 8px 24px 0 rgb(0 0 0 / 0.5)` dark, `/ 0.16` light | a theme may set it | `0 16px 40px rgb(0 0 0 / .5)` dark, `0 16px 40px rgb(26 32 40 / .16)` light | Change value in the theme. Use neutral black in light. Conflict 3.10. |
| 1px rings on the outline tag and on the Outside text mark inside a peer's message | none | n/a | none | `box-shadow: inset 0 0 0 1px` | No token. Draw them as borders. The source label already has a real border, and the selected segment in light uses an outline. |

Nothing else has a shadow. No gradient, blur or glow is used.

### 2.7 Motion

| A role | System token today | Main | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| A change of state | `--ds-duration-fast`, `-base`, `-slow` | 100, 160, 240ms | same | 120 to 240ms; with reduced motion only colour and opacity change | Keep. The stylesheet defines no motion; the figures are from the accessibility board. |
| Easing | `--ds-ease` | `cubic-bezier(0.2, 0, 0, 1)` | same | not defined | Keep. |

### 2.8 Breakpoints

| A role | System token today | Main | Unreleased | Direction A, final | Action |
|---|---|---|---|---|---|
| The phone layout below, one desktop pane from | `--ds-breakpoint` | 768px, the only width a media query may use | same | 768px | Keep. |
| Two panes from (Botbench's switch today) | none | Botbench switches once at 1024px, in script (`web/src/app/wide.ts`, `WIDE`) | none | 1024px | Keep (decided). A named width for the app shell. Conflict 3.7. |
| Three panes from | none | none | none | 1280px | New named width for the app shell. Conflict 3.7. |

The layouts and the width each leaves for the main column are in 5.5.

### 2.9 Where A cannot be expressed with today's token set

| Gap | Smallest change |
|---|---|
| A fourth surface level, in both modes. Navigation and inspector sit between the page and a card, and a decision card sits inside the inspector, so the two must differ. | One new colour token and its pairs, for the role "a pane of the app shell" and nothing else. It is not a general fourth elevation: a card inside a card and a decorative panel do not take it. |
| A plain card: no border in dark, a hairline in light. A colour token is six-digit hex, so "transparent" cannot be a value, and a component cannot ask which mode it is in. | The panes need nothing new: they take `--ds-color-border` in both modes. For the plain card there are two ways. One colour token for its border, equal to the card's own fill in dark and to the hairline in light. Or no token: the plain card has no border in either mode, and in light it is used only where a fill step of 1.08:1 against the page is enough. Open question 7. |
| Blue as primary fill, focus and active work at once. | No new token. Three existing tokens take one hex. The theme comment and `DESIGN.md` change. |
| Five semantic colours against eight status tokens. | No new or removed token. Tokens take another's values in the theme. |
| 14px and 15px roles side by side. | One new type token; the 11px role leaves, so the count stays at seven. |
| Heading weights of 620, 650 and 680. | None if the headings take 600. Otherwise one new weight token, which only a variable font can draw. |
| A hover value for the blue primary. | A value from the designer for `--ds-color-accent-hover`. |
| A three-pane layout from 1280px, and a rail of icons under it. | A second allowed width in the checker's `off-breakpoint` rule, for the app shell only. |
| The outlined secondary button. | A component change, not a token (5.7). |

## 3. Conflicts with the system's rules, each with a recommendation

Quotes are from the design system on main unless marked unreleased. Each quote was checked against the file.

| # | Conflict | The rule today | What A needs | Recommendation |
|---|---|---|---|---|
| 3.1 | Monochrome accent against a blue primary button | `themes/botbench.css`: "accent near-white in dark and near-black in light, as a chat app's Send button. The primary action is told apart by its fill, the one solid shape on the screen. The accent is never a status." And: "focus a system blue, so the ring is never mistaken for the accent or a status." `DESIGN.md`: "a monochrome primary action". | One interactive blue for the primary fill, the focus ring, selection and active work. | Adopt the blue: the owner approved it. Keep accent, focus and info as three tokens with one hex, so a later theme can give them different values. Rewrite the theme comment and `DESIGN.md` in the same change. "The one solid shape" still holds on every screen but one: the destructive dialog has a second solid button, Discard, filled in the error colour, and no blue one. Check the focus ring on a primary button by eye: ring and fill share a colour and are separated only by the 2px offset. |
| 3.2 | Cyan means another agent (settled) | `DESIGN.md`: "the two-tone mark, with its cyan second bracket, is for the app icons and the README only, since cyan in the interface means another agent." `tokens.css`: "Another person's agent: a peer's message or proposal." | The mark is one colour, as `DESIGN.md` says. Teal marks the paired workbench and its messages, and nothing else: the pull-request approval now uses the attention colour for what leaves this Mac. | No conflict left. Blue and teal are close in lightness in dark, so Working and a peer are told apart by word and mark, as the rule on colour already demands. |
| 3.3 | Body 15px against the unreleased 14px | Unreleased `tokens.css`: "Body: transcript prose, a control's label. 14px, line 21px." | Body 15/23; navigation, control labels and table cells 14/20; title 28/34 against the unreleased 26/30. | `--ds-text-ui` becomes 15/23. Add one 14/20 role. `--ds-text-2xl` becomes 28/34. Remove the 11px role. Compact density keeps 13/18 body. |
| 3.4 | Controls 40px against the unreleased 36px, and whether the density attribute is needed | Unreleased `rules/principles.md`: "a control of default size is 36px tall on a fine pointer and 44px on a coarse one". "compact is 28px controls, 32px rows and 13px body text, comfortable, the default, 36px for both with 14px text, and touch 44px for both." | 40px with a mouse, 44px on touch, 32px small. | Comfortable becomes 40px. Keep `--ds-size-control`, `--ds-size-row` and the coarse-pointer block: that block is how A gets 44px. Keep `compact` for Work's table (36px rows) and for file lists. Drop `touch` as an attribute value: the coarse-pointer block already does it, and nothing in A asks for 44px with a mouse. |
| 3.5 | Radii 6, 10, 12, 16 against 4, 6, 10, 14 | Unreleased `AGENTS.md`: "Radius is `--ds-radius-xs` (4px, a badge), `-sm` (6px, a control), `-md` (10px, a container), `-lg` (14px, a dialog or a sheet) and `-full`". On main the theme says "radius-md 22px … a button of normal size is a pill". | 6 tag, 10 control, 12 card, 16 dialog and sheet, pill for chips. | Change the four values to 6, 10, 12, 16. The values change for every theme, since a theme can no longer set a radius. |
| 3.6 | Type in rem | Unreleased `AGENTS.md`: "Each is in rem, so it follows the reader's font size … The build fails on a type size not in rem." | The stylesheet is in px. The accessibility board says sizes are built in rem. | No conflict. Convert: 12 is 0.75rem, 13 is 0.8125, 14 is 0.875, 15 is 0.9375, 16 is 1, 20 is 1.25, 28 is 1.75. Control heights stay in px as minimum heights, so a label can grow at 200%. Nothing in the mock-ups was tested at 200%. |
| 3.7 | One breakpoint against four layouts | `AGENTS.md`: "The one breakpoint is 768px." `docs/authoring.md`: "The only width in a media query is 768px". Checker rule `off-breakpoint`. | The phone layout under 768px, one pane to 1023px, two panes to 1279px, three from 1280px (decided: today's 1024px switch stays, and 768 and 1280 are added). | Add 1024px and 1280px as named widths that only a page pattern or an app shell may use; components keep 768 alone. Each layout is judged by the width it leaves the main column, which is smallest at 1024px, not at 768px (5.5). |
| 3.8 | "No text under 12px" against the 11px micro role | Unreleased `tokens.css`: "Micro: a meta label, a table head. Weight medium, with its tracking. 11px, line 14px." | Nothing under 12px. The renders found no text node under 12px on any board. | Remove `--ds-text-2xs`, its leading and its tracking. Table heads take 12/16 semibold and group labels 13/18 semibold. Add a build check that no type token is under 0.75rem. |
| 3.9 | Eight status hues against five semantic colours | `themes/botbench.css`: "status success, warning, danger, info, approval, blocked, peer and tainted keep the values of the amber theme before 0.8.0. Approval is amber with the paused circle, warning lemon in dark and olive in light, tainted input orange." `AGENTS.md`: "The badge's `statusSet` in `meta.json` is the one icon and tone for each state of a run." `tokens.css` on tainted: "Work that carries input from outside the trust boundary, such as a peer's message." | Interactive, peer, attention, success, error, and neutral. A peer's message carries an "Outside text" mark in the peer colour. A Waiting row is neutral, with a clock. | Keep the eight names and the status set. In the theme: warning takes the attention pair, blocked takes muted on fill. Each state keeps its own icon and word, so nothing is lost. In Botbench, Usage limit moves from the warning tone to the neutral one (`LOOKS.usageLimit`), because amber now means a decision. The colour for tainted is still the owner's to settle (open question 1): the boards draw outside input from a peer in teal, and no board draws a run that read a GitHub issue. |
| 3.10 | Shadow rules | `rules/never.md`: "a shadow here means one thing, that an overlay sits above the page. Use the overlay shadow token on overlays and no shadow elsewhere." Also banned: "Glowing or coloured shadows." | One shadow on dialogs and sheets, larger than today's; in light it is tinted with the text colour; two 1px rings drawn with `box-shadow`. | The theme sets the larger overlay shadow. Use `rgb(0 0 0 / .16)` in light. Draw the rings as borders, or `raw-shadow` fails the build. |
| 3.11 | A primary button inside the queue | `rules/core.md`: "An action repeated for each item in a list, table or card set is never primary." Checker rule `repeated-item-primary`. | Settled on the boards: the first waiting item is lifted out of the list into its own card with the view's one primary action, and every row's action is an outlined button. | Build it as drawn. The lifted card must be outside the list element, or the checker reads it as a row. |
| 3.12 | The word "Blocked" (settled) | `docs/product/voice.md` in Botbench, glossary, "Never shown" for the Failed row: `blocked`. The glossary is the list Botbench's tests enforce. | None. The boards say "Waiting" everywhere, with the causes "Waiting on usage limit", "Waiting on dependency" and "Waiting on teammate". | The voice guide stays. Add the three phrases to the glossary with the group. Today's product words are "Usage limit" and "Waiting for task N to finish". |
| 3.13 | Full title through a `title` attribute | `rules/never.md`: "Information shown only on hover … A tooltip holds supplementary text only and also opens on tap and on focus." | The decision: full name "on hover and focus (a `title` attribute) and in the selected item". The boards set `title` on every cut text. | A `title` attribute does not open on keyboard focus or on touch. The guaranteed path is the open item in the navigation and the detail header, both of which wrap. Keep `title` as an extra, and use the `tooltip` component where focus must show the name. "Always allow" is no longer explained in a `title`: it has a focusable disclosure (5.2). |
| 3.14 | What kind of product `DESIGN.md` describes | `DESIGN.md`: "Dense technical tool. Phone-first." "Closer to a well-made terminal or Linear than a friendly AI product." | 15px body, 40px controls and 32px page padding: larger and less dense than the text describes. | Rewrite the overview, Prefer and Components sections of `DESIGN.md` when the theme lands. Its token block is generated and updates by itself. |
| 3.15 | A brand typeface | `rules/never.md`: "Inter, Roboto, Geist or system-ui named as the typeface in an app." `DESIGN.md`: Botbench loads no font of its own. | None. The warmth pass stayed on the platform font. | No conflict. The Botbench theme stays the one exception that names `system-ui`. |
| 3.16 | Three weights against six | `tokens.css`: `--ds-weight-normal`, `-medium`, `-semibold` (400, 500, 600). | 680 on the title, 650 on headings and the brand, 620 on sub-headings. | These draw only where the platform font is variable (SF Pro on Apple devices). Segoe UI and Roboto as installed round them to 600 or 700, so Windows and Android would show either no change or bold headings. Recommend 600 for sub-headings and one new token, `--ds-weight-bold` at 650, for the title and headings, checked on Windows before release. Until it is checked, use 600. |
| 3.17 | The signal, a status with no fill | `AGENTS.md`: the badge's status set is "the one icon and tone for each state of a run". | A mark and a word with no fill, at the head of a decision surface and of a queue item: "Needs your decision", "Claude Code is paused", "Leaves this Mac", "Refused, not run". It says whose move it is, and is not a state of a run. | A variant of `badge` without a fill, outside the status set, used only at the head of a decision surface or a queue item. A view still shows a run's state once, as a badge. |
| 3.18 | The accessibility board disagrees with the layout boards | The accessibility board, for 768 to 1279px: "Two panes. The inspector opens as a sheet." | The layout boards and the widths board: one pane with the decision in a sheet from 768 to 1023px; from 1024px the decision keeps its own 312px column and the navigation becomes a rail. | The layout boards are the specification (5.5). The accessibility board's "Three layouts" card is out of date and should be redrawn as four. |
| 3.19 | "Decorative" borderless cards are most of the cards | The owner's decision: "A borderless variant for decorative panels is fine, but dark-mode pane boundaries must not be invisible everywhere". The stylesheet: the plain card is "decorative only: never on a card that is a link, a button or a choice". | 148 of the 185 cards on the final boards are plain, on 44 of the 47 boards, including the cards that hold the evidence and the queue. | The panes meet the decision: each has a hairline. The cards do not match the word "decorative": the plain card is in effect the default. Either make the bordered card the default again and mark the few decorative ones, or accept that a card on the page is told by its fill step in dark (1.19:1) and say so in the rule. This is a design choice for the owner to see on the boards; it is part of open question 4. |

## 4. Contrast

Computed with the WCAG 2.x formula from the final stylesheet, for 85 pairs in each mode. Ratios are cut to two decimals, never rounded up. Text needs 4.5:1; a control's edge, a focus ring and a mark need 3:1. The script and its raw output are not in this repository; appendix B lists every pair, and the formula and the values are enough to repeat it.

**No pair is under its threshold, in dark or in light.** The one failure of the first draft, the control edge on fill in dark (2.66), is now 3.12.

### 4.1 The lowest pair of each kind

| Group | Needs | Pairs | Lowest in dark | Lowest in light | Result |
|---|---|---|---|---|---|
| Primary and secondary text on the five surfaces | 4.5:1 | 10 | 6.25 (secondary text on fill) | 5.66 (secondary text on fill) | pass |
| Primary and secondary text on the five tints | 4.5:1 | 10 | 7.22 (secondary text on attention tint) | 5.50 (secondary text on error tint) | pass |
| A semantic colour on canvas, surface, raised or sunken | 4.5:1 | 20 | 6.81 (error on raised) | 4.60 (attention on sunken) | pass |
| A semantic colour on its own tint | 4.5:1 | 5 | 7.04 (error on error tint) | 4.65 (attention on attention tint) | pass |
| A semantic colour on fill (a mark on a selected row) | 4.5:1 | 5 | 5.72 (error on fill) | 4.52 (attention on fill) | pass |
| Label on a filled button (primary, and Discard) | 4.5:1 | 2 | 8.14 (canvas on error) | 5.21 (canvas on error) | pass |
| Control edge on a surface or a tint | 3:1 | 7 | 3.12 (control edge on fill) | 3.44 (control edge on fill) | pass |
| A coloured edge: risk, destructive, peer, chosen card | 3:1 | 9 | 6.81 (error on raised) | 4.72 (error on error tint) | pass |
| Focus ring, and the primary button against what is behind it | 3:1 | 6 | 6.27 (interactive on fill) | 5.55 (interactive on fill) | pass |
| A tick inside a filled step mark | 3:1 | 2 | 8.90 (canvas on secondary text) | 6.08 (canvas on secondary text) | pass |

### 4.2 Thin margins and what the figures do not cover

- **The smallest margins.** All pass. The first is in dark and the rest are in light. Control edge on fill, 3.12: a bordered button on a selected row. Attention on fill, 4.52: the state mark of the open item in the navigation. Attention on sunken, 4.60. Attention on its tint, 4.65: every "Ready for review" tag. Error on its tint, 4.72. A change to the light attention or error colour, or to those backgrounds, needs the script run again.
- **The hairline** (1.15 to 1.38) cannot mark a control's boundary. It is right for card borders and dividers only.
- **Surface steps are small by design.** Page to pane is 1.07 in dark and 1.04 in light; pane to card 1.10 and 1.03; page to card 1.19 and 1.08. No threshold applies, so these were judged by eye only.
- **The pane hairline.** The 1px border of the navigation and the inspector is 1.28:1 against the pane and 1.38:1 against the page in dark, and 1.25:1 and 1.20:1 in light. Whether that is enough separation in dark is open question 4.
- **The selected segment and the selected navigation row** differ from their neighbours by a small fill step (1.31 at most). Both also change weight and text colour, and the segment in light has an outline, so the fill is not the only signal.
- **The destructive dialog's edge in light** is 5.64 against the dialog's own fill and 1.12 against the dimmed page behind it. So in light the red edge is seen against the white of the dialog, not against the page. In dark it is 8.73 against the dimmed page.
- **The focus ring on a primary button** has the button's own colour. It is told apart by the 2px gap, which shows the surface behind.
- **The accessibility board's figures agree** with this script. It rounds where this document cuts (4.45 against 4.44), and its sentence "at least 3.50 to 1 on every surface" covers four surfaces, not fill.
- **Not measurable.** `--ds-color-accent-hover` has no A value. Hover, pressed and disabled states are not drawn, apart from one disabled button style, which is exempt.

## 5. Components

### 5.1 The review, its evidence rows and the four kinds of claim

![The review of task 12 at 1440 by 900, dark. Left, the navigation, with a hairline at its edge and the open task named in full. Centre, top to bottom: "1 of 1 check passed" with a green mark and an "Evidence is current" tag; a row labelled Check with a tick, the command and a Passed tag; a row labelled Review with Codex's name and "Verdict: looks right"; the changed file with its diff; a dashed card labelled Not verified about the branch being behind main; the agent's own words as a quotation, and a collapsed "What Claude Code did". Right, behind a hairline, a neutral decision panel "Accept this result?" with what accepting will do, a reason field, Reject, a blue Accept and "Send Claude Code a note instead".](2026-11-23/boards/V2Review.png)

The review reads top to bottom in the owner's order. Each block is one card.

1. **Verification result.** A 40px round mark, a heading (20/26) and one line that names the commit, with one tag at the right. The mark is green only when a check passed on the commit under review. Under it, one row per claim.
2. **Changed files.** A heading with the added and removed counts, then each file: its name in mono, a quiet outline tag ("Expected from the task"), and the diff on the sunken surface.
3. **Limitations.** One dashed card. Each row says what is not verified and may offer one outlined action ("Bring up to date with main").
4. **Supporting activity.** A flat card: the agent's own statement, then one collapsed row that opens the full activity, with a one-line count and the time.

A claim row is a grid of three columns: a label column of 104px, the claim, and an optional quiet action at the right. Padding 12px by 20px, a hairline between rows. The label is 20px high, 12px text, radius 6px, and is not pressable. The four kinds differ in shape as well as in word:

| Kind | Label | The claim | Never |
|---|---|---|---|
| A check Botbench ran | Filled (the fill colour, primary text, weight 600): "Check" | A tick in a circle, the command in mono, a result tag ("Passed"). Under it: who ran it, on which commit, how many tests, how long. Action: Output. | A result tag in green for a check that ran on another commit. |
| A model's review | Outlined (hairline border, secondary text, weight 500): "Review" | The reviewer's avatar and name in bold, its verdict in plain secondary words ("Verdict: looks right"). Under it: "A model's opinion, not a check.", then up to a few points it says it checked. Action: The full review. | A tick or a result tag. |
| The working agent's statement | Outlined: "Agent said" | The agent's words in quotation marks behind a 2px rule in the edge colour. At the right: "Claude Code's own words". | Any mark of success. |
| What nothing verified | Dashed (edge colour): "Not verified" | A plain sentence naming what was not verified, and one line of why. The card around it is dashed and has no fill. | The success colour. |

The same four shapes are used wherever a claim is shown: on the failure screen (5.7), on the refusal, and on the phone.

Four more states of the same screen, each on its own board:

![The same review when the check ran on an older commit, 1440 by 900, dark. The result block has an amber clock mark, the heading "The check ran on an older commit" and an amber "Evidence is out of date" tag. The check row has no tick and a neutral outline tag "Passed on a1b2c3d". Below, "1 commit since the check" lists commit f4e5d6c with an amber "Not checked" tag and its diff, above the older commit tagged "The check passed here". A dashed card says nothing has verified commit f4e5d6c. The decision panel is headed "Check this commit first" with a blue "Run checks again" button, a grey line "Accept is not offered. No check has run on the commit you would accept.", and Reject and Send a note. There is no Accept button.](2026-11-23/boards/V2ReviewStale.png)

- **Stale evidence** (`V2ReviewStale`). The mark is the attention colour with a clock. The old check and review stay, as passed on the older commit, with no green. The changed-files block becomes the commits since the check. The decision panel's primary action is "Run checks again". Where Accept would have been there is one line on the fill colour that says why it is not offered. Reject and Send a note remain, as two equal outlined buttons. There is no disabled Accept.
- **A tracked file changed after the checked commit** (`V2ReviewUncommitted`). The blocking case of files that are not in the commit. The result block reads "The task's copy differs from the commit" with the tag "Evidence does not cover it". The primary action is "Inspect changes", and the line says "Accept is not offered. calc.py, a tracked source file, changed after the commit that was checked."
- **An ignored file the checks left** (`V2ReviewLeftovers`). The case that does not block. The evidence is current and the normal Accept is offered. One quiet row under the changed file names `.coverage` and says: "Left by the checks and ignored by git. Not part of the commit; removed with the task's copy." The decision panel's list says the copy is removed "and `.coverage` with it". No attention colour is used. The rule between the two cases is the owner's: a changed tracked source or configuration file blocks, and so does an untracked file that could affect the reviewed result, the checks or the deliverable; an ignored, harmless artifact is disclosed and cleaned up.
- **No checks are set up** (`V2ReviewNoChecks`). The mark is a dashed neutral circle with a dash: no success colour and no alarm. The heading is "No checks are set up for this repository" and the line ends "This result is not verified." One line says how to set checks up, with an outlined "How to set up checks". The dashed card says that no check ran and that the task has no reviewer. The decision is headed "Accept without verification?" and says "No checks ran on commit a1b2c3d, so nothing was verified." Its list reads "Keep the branch on this Mac, as unverified work". The button is outlined and reads "Accept without verification", above Reject and Send a note. The panel has no filled button and no green. This button exists only in this state: it is never offered when checks failed or are stale.

### 5.2 The decision surface and its five levels

![Five decision surfaces side by side at one size, dark. 1, Routine review: a neutral card "Accept this result?" with Reject and a blue Accept. 2, Approval request: the same card with a small amber "Claude Code is paused" signal, Decline and a blue Allow. 3, Elevated risk: an amber edge and tint, an amber "Leaves this Mac" signal, "Botbench cannot take it back." with a warning mark, Cancel and a blue "Push and open". 4, Destructive: a red 2px edge and a red band "Cannot be undone", a focused "Keep them" button first and a filled red Discard at the far end. 5, Refused: a card with no fill, a red "Refused, not run" signal, and two outlined buttons, "Send a note" and "See the rule". Under each, when it is used, its primary action and whether it can be undone.](2026-11-23/boards/V2Levels.png)

One surface, louder only as the consequence grows. Radius 12px, padding 20px, 16px between its parts. Every level has, in this order: a signal that says whose move it is, the question as a heading, the thing decided on (a command or a commit, in an output block), one line of consequence, and its buttons. No level has a key hint.

| Level | Used when | Surface | Signal | Buttons | Can it be undone |
|---|---|---|---|---|---|
| 1. Routine review | A task is ready for review and its evidence is about the commit decided on | Raised fill, hairline border | Neutral, no mark: "Needs your decision" | Reject (outlined), Accept (primary, flex 2 to 1, about 1.6 times as wide as drawn) | In effect yes: nothing leaves the machine and the branch can be deleted |
| 2. Approval request | An agent waits on a command that stays inside the task's copy | The same surface | Attention colour with a dot: "Claude Code is paused". The one small attention mark | Decline (outlined), Allow (primary) | The command runs once; its changes stay in the copy, which can still be rejected |
| 3. Elevated risk | Something leaves the machine or acts outside the copy: a push, a pull request | Attention edge and attention tint. The first level with either | Attention colour with an arrow: "Leaves this Mac" | Cancel (outlined), then the action named in full (primary), after the list of consequences | Not by Botbench. The panel says how to undo it by hand |
| 4. Destructive | Work is removed for good: Discard, or Reject when "Delete the branch" is chosen | A 2px error edge, and a band across the top (error tint, error text, a warning mark) that says "Cannot be undone" once. Drawn as a dialog, 520px wide, radius 16px, with lists headed Removed and Kept | The band is the signal | The safe button first, with the focus ("Keep them"); the destructive one at the far end, filled in the error colour ("Discard"). No primary action | No |
| 5. Refused | The safety rules refused an action in a fully autonomous run | No fill, hairline border | Error colour with a lock: "Refused, not run" | No approve action. Two equal outlined buttons: Send a note, See the rule. One line says nothing here can run it | Nothing to undo: it did not run |

On the routine review the panel also lists what accepting will do, with neutral ticks, has an optional reason field, and ends with a quiet third action, "Send Claude Code a note instead". An approval that is one of several shows "1 of 2" and a next control in its header.

**"Always allow this command"** (`V2Approval`, `V2MApproval`). Under Decline and Allow there is a disclosure row, a real button that opens on click, tap, Enter or Space. Open, it states three things under their own labels: what it authorises ("Exactly this command, sh other.sh, without asking you. A different argument still asks."), its scope ("This repository, repo-refine: the Build step, from this folder.") and how long ("It persists until you take it back on the Permissions screen."). The "Always allow…" button inside opens the product's own confirmation. Nothing is explained on hover alone. On the phone sheet the row is closed by default, so the sheet stays short.

**A refusal and the run's mode** (`V2Refused`). The refusal panel keeps exactly its two buttons and adds one sentence: "A stricter mode never allows what was refused." The run has its own menu in the top bar of the task screen, a small "Run" button, which holds "Make the mode stricter" (with the current mode under it) and "Cancel run". The menu is the run's control. It is not on the refusal and is never worded as a way to make the refused command permissible.

### 5.3 Home: the queue and its ordering rule

![Home at 1440 by 900, dark, with three things that need you. A headline "3 things need you, 2 are in progress" and a line "1 is waiting and goes on by itself. 2 completed since yesterday." Under "Needs you 3" a line states the order. The first item, an approval with an amber pause mark, sits in its own card with "Waiting 12 min" and a blue Answer button. Two rows follow, a plan and a result, each with a waiting time and an outlined button. Below on the left, "In progress 2" and "Waiting 1", whose one row reads "Waiting on usage limit" and "Tries again at 14:30". On the right, "Completed 2" with two accepted tasks, and under it a quiet link "1 rejected and 1 cancelled are in Work".](2026-11-23/boards/V2Home.png)

- **Headline.** The count of what needs you and what is in progress, as the title. One line under it for what is waiting and what completed.
- **Needs you.** The ordering rule is printed on the screen, in one quiet line at the right of the heading: "In order: an approval holding an agent, a failure to recover, plans, then results. Oldest wait first." The rule has four ranks and one tie-break, and nothing else decides the order. The phone prints the same four ranks in fewer words: "Approvals, failures, plans, then results".
- **The first item** is lifted into its own card. It has the screen's one primary action. Its signal names the kind of ask and why it is first ("Approval · Claude Code is paused until you answer").
- **Every other item** is a row: a mark for the kind of ask, the title in bold, a metadata line that starts with the kind in words ("Plan", "Result", "Approval", "Failed"), how long it has waited, and one outlined button whose label is the next step ("Read the plan", "Review", "Answer", "See what failed"). There is no amber tag and no fixed tag column, so the title starts at the left edge.
- **In progress** rows show the title, the latest activity in words ("Working: editing README.md"), the agent, the repository and the elapsed time. They say "Nothing to do here".
- **Waiting** rows are neutral, with a clock. The metadata line starts with the cause in bold, in one of three phrases: "Waiting on usage limit", "Waiting on dependency", "Waiting on teammate". The right side says when the work goes on ("Tries again at 14:30"). The group says "Goes on by itself". The word "Blocked" is not used anywhere.
- **Completed** holds successful outcomes only: a tick in the success colour, the title, and the outcome in words ("Accepted · pull request #48 opened", "Accepted without you · branch kept"). Under the card, one quiet link names what ended otherwise and where it is: "1 rejected and 1 cancelled are in Work".
- **Failures are never hidden.** A failure that can be recovered is a row under Needs you, in the second rank ("Failed · the checks could not start, its work is kept", with "See what failed"). A failure that cannot is in Work with its Failed state, and is counted in Home's quiet link.

![Home at 1440 by 900, dark, with fifty items. The headline reads "7 things need you, 18 are in progress", and under it "6 are waiting and go on by themselves. 14 completed since yesterday. 50 in all." The first approval is in its own card with a blue Answer button. Six one-line rows follow in the stated order: an approval, a failure, two plans and two results, each with its kind in bold, a metadata line that is cut with an ellipsis where it does not fit, a waiting time and a small outlined button. Below are three columns. In progress 18, counted by agent and by repository, with the two longest-running named. Waiting 6, by cause: "Waiting on usage limit 3", "Waiting on dependency 2", "Waiting on teammate 1", and "Each goes on by itself. Nothing to do here." Completed 14: "10 accepted" and "4 accepted without you", and under the card the link "2 rejected, 2 cancelled and 1 failed are in Work". Each column has a link such as "Show all 18 in Work".](2026-11-23/boards/V2HomeFifty.png)

How the queue holds at scale:

| Items | Needs you | In progress | Waiting | Completed |
|---|---|---|---|---|
| A handful (`V2Home`) | First item lifted, the rest as two-line rows, 60px | Two-line rows | Two-line rows with the cause | The accepted items, one line each |
| Twenty (`V2HomeMany`) | All five shown and all actionable: the first lifted, four two-line rows | One line per item: the title takes the room, the state and agent sit beside it | One line per item, with its cause | Counted: accepted |
| Fifty (`V2HomeFifty`) | All seven shown, one line each | Counted by agent and by repository, with the two longest-running named | Counted by cause | Counted: accepted, and accepted without you |

- What needs you is never replaced by a count: every item is shown and has its button, at any number.
- In a one-line row the title keeps its full width and the metadata gives way first: it is cut with an ellipsis and carries a `title`. The waiting time (72px, right-aligned, tabular figures) and the button (124px wide, 32px high) are fixed.
- Each counted group leads to Work, filtered to that group. What ended without success is one quiet line under Completed at every scale.
- The queue never becomes a list of fifty rows.

### 5.4 Work: the inventory table

![Work at 1440 by 900, dark. A title "Work" with "Every task, run and chat on this workbench. 63 in all, newest change first." A search field "Search titles" beside a segmented control All 63, Tasks 41, Runs 9, Chats 13. A second row: a segmented control Any state, Needs you 3, In progress 2, Waiting 1, Completed 38, Failed 2, two pickers "Agent: Any" and "Repository: Any", and "14 of 63 shown". A table of fourteen rows with the columns State, Title, Kind, Agent, Repository and Last change. Each state has its mark and word; one row reads "Waiting on usage limit" and one reads "Failed" in bold with a red warning mark. Under the table a "Show older" button and "49 more, back to 3 November".](2026-11-23/boards/V2Work.png)

- **Header.** The title, and one line that says what the list is, how many it holds and how it is sorted.
- **Filters.** A search field over titles. Kind as a segmented control with counts (All, Tasks, Runs, Chats). State as a segmented control with counts: Any state, Needs you, In progress, Waiting, Completed (accepted work only), Failed. Rejected, cancelled and stopped items are reached under Any state. Agent and repository as pickers. At the right, how many of the total are shown.
- **Table.** Fixed columns so a cell can cut its text: State 204px, Title takes the rest, Kind 88px, Agent 124px, Repository 116px, Last change 140px and right-aligned. Rows are compact, 37px with their hairline. The head is 12/16 semibold in the secondary colour.
- **State cell.** The state word with its mark. A state that is live, needs you or failed is in bold primary text (Working, Checking, Ready for review, Needs input, Plan ready for review, Failed); every other is in secondary text (Chat, Waiting on usage limit, Accepted, Rejected, Done, Cancelled, Stopped). Only the marks carry colour: interactive for work under way, attention for what waits on you, success for accepted, error for failed.
- **Title cell.** A link, cut with an ellipsis, with the full title in `title`.
- **Foot.** "Show older" and how many more there are, back to which date.
- The last row of a table has no hairline under any of its cells: the card closes the table.

### 5.5 The four layouts and the width each leaves

`V2Widths` draws the four layouts at one scale, with the width the main column really gets. `V2Review768`, `V2Home768`, `V2Review1024` and `V2Review1280` draw them in full.

| Window | Layout | Navigation | Decision or inspector | Main column | A diff line holds |
|---|---|---|---|---|---|
| Under 768px (drawn at 390) | One pane, the phone root: 16/24 body, 44px controls | The bottom bar | A sticky action area at the foot, or a sheet | 358px | 41 characters, and a long path wraps |
| 768 to 1023px (drawn at 768) | One pane, desktop type and controls | Behind a menu button in the top bar | A sheet, drawn open at the foot of the pane and in the flow, so nothing lies hidden under it | 720px | 87 characters, then it wraps |
| 1024 to 1279px (drawn at 1024) | Two panes | A 64px rail of icons, each named on hover and focus | Its own column, 312px, always in view | 600px | 72 characters |
| From 1280px (drawn at 1280 and 1440) | Three panes | 264px, with its labels | 312px at 1280; 340px from 1440 | 656px at 1280, 760px from 1440 | 79 at 1280, 92 at 1440 |

- **The narrowest desktop main column is at 1024px, not at 768px.** This is why the owner asked for the content width to be validated and not only the breakpoint: whether a diff line or a path fits is decided by the main column.
- **At 768px** the top bar holds the menu button, the mark, the trail and the state, and the task's tabs as a segmented control. The review keeps the desktop order. The decision sheet puts the question and "Accepting will" side by side, and the reason field, Reject and Accept on one row, so the decision is in view without scrolling. Home is one column in the queue's order: Needs you with its one primary action, then In progress, Waiting and Completed as compact groups.
- **At 1024px** the rail has one 44px target per place, each with its name as its accessible name and `title`; Home keeps its count as a small pill on the icon; the open item is not listed. The task's tabs are in the top bar. The claim rows narrow: the label column is 92px, row padding 10px by 16px, the review's verdict takes its own line, and the file name joins the "1 file changed" heading.
- **At 1280px** the inspector gives way first (340 to 312px) and the page margin second (32 to 24px). The navigation keeps its 264px and its labels. The task's tabs move into the top bar to save a row. Everything is in view at 800px high.
- From 1440px the layout is the one in 5.1.

### 5.6 Phone patterns

![The review of a task on a phone frame, 390 by 844, dark. A top bar with a back arrow, "Task 12 · api-gateway" and an amber "Ready for review" tag. The title "Cap the retry delay", the agent and commit, and the branch botbench/studio-mac/run-12/task-12. Then cards in the same order as the desktop: "1 of 1 check passed" with a Check row and a Review row that reads "A model's opinion, not a check."; "1 file changed" with a long path that wraps over two lines and its diff; a dashed card "Not verified: 2 commits behind main"; a collapsed "What Claude Code did". Fixed above the bottom bar, an action area with the line "Accept keeps the branch. Nothing is pushed or merged.", Reject and a wider blue Accept. The bottom bar has Home, Work, Chats, New and Settings.](2026-11-23/boards/V2MReview.png)

- **Frame.** A 56px top bar (back, the task and repository, the state tag), the page with 16px padding and 24px between blocks, and a 60px bottom bar with five places. The active place is in the interactive colour and bold. Body text is 16/24, the title 24/30, controls 44px.
- **Sticky action area.** The decision sits in a band fixed above the bottom bar: the pane surface, a hairline on top, 12px by 16px padding, 8px between its rows. It holds one line of consequence and the buttons, the safe one first and the primary one wider (flex 2 to 1). It is used for the review (Reject, Accept), a failure (a note field, Resume, Inspect), a running task (Send a note, Details, and Stop in its own row under a hairline with its line of consequence), a comparison and a paired conversation. Nothing in it is under 44px high.
- **Sheet.** An approval opens as a sheet from the bottom over a dimmed page: raised surface, 16px top corners, the overlay shadow, a 36 by 4px handle in the edge colour. Inside: the signal and "1 of 2", the question, the command, why it asks, the closed "Always allow this command" row, a row to add a note, then Decline and Allow.
- **Long text.** A path wraps anywhere; it is never cut. A status line wraps under the title.
- **Home on a phone** uses the same four group names, Needs you, In progress, Waiting and Completed, and the same lifted first item with the one primary button.
- **Not drawn.** A destructive confirmation on a phone. The stylesheet has a destructive sheet, and no board uses it.

### 5.7 Failure, a running task, Settings, and the other components

![A failed task at 1440 by 900, dark. The top bar shows "Task 19" with a red Failed tag. A card says "Claude Code finished without changing any file." with a red mark. Under it "What Claude Code did" lists four steps with neutral ticks, then the agent's last words labelled "Agent said", as a quotation behind a rule. Below, a separate dashed card labelled "Not verified" says "No checks ran on this work, and no reviewer read it." At the right a panel headed "Resume this task" with an optional note field, a blue Resume button and an outlined "Inspect what happened", then "Kept until you decide otherwise" with the branch, the copy, the transcript and the session. At the foot of the column, set apart, a quiet "Discard…".](2026-11-23/boards/V2Failed.png)

- **Failure leads with recovery.** What happened, in one sentence, then the steps with neutral ticks, the agent's last words as a quotation behind a rule, and what nothing verified in its own dashed card, the same shapes as on the review. The panel beside it is the recovery: Resume as the primary action with an optional note field above it, and "Inspect what happened" outlined. What is kept is listed under it. Discard sits alone at the foot of the column under a hairline, with one line that says it asks first.
- **A running task** (`V2Executing`). The conversation, the command running now with its output, and a note composer. The inspector holds progress as three steps top to bottom (Build, Checks, Your decision), the files touched so far, and steering (Send a note, Move to another agent). Stop has its own place at the foot under a hairline, with the line that says the work is kept and the task can be resumed. Stop is not a steering action and is not next to one.
- **Done is not verified.** A finished step is a neutral tick. Green is kept for a check that passed and a result that was accepted. The stylesheet defines both marks for the progress track; no final board draws a track with a finished or a passed step, so they are specified from the stylesheet alone.
- **Settings** is six groups: Agents and models, Execution environments, Workbench identity, Permissions and autonomy, Usage and limits, Connections and peers. Execution environments (`V2SettingsEnvironments`) shows each repository as a card: where its commands run, its setup and check commands as short mono lists, and its state as a word with a mark. Beside them, a disclosure shows the settings-file entry to change, because Botbench reads that file and never writes it. Workbench identity (`V2SettingsIdentity`) shows the name, this workbench's fingerprint in mono, the version and its update choice, appearance, and memory with Edit and Forget on each note. Usage and limits shows tokens only, never money.
- **A paired workbench.** Every message from the other workbench carries the "Outside text" mark in the peer colour, and its meaning is said once under the header. Teal is used for nothing else.

How A's components map to the design system. "Tokens alone" means the component on main looks like A once the token values of section 2 are in.

| A component | Design-system component today | Tokens alone, variant, or new |
|---|---|---|
| Button | `button` (secondary tonal, `--primary`, `--quiet`, `--danger`, `--small`), `icon-button`, React `busy-button` | Primary, quiet and danger: tokens alone. A's default is outlined, where the system's default is a tonal fill: a variant, or a change of the default. A's filled danger is now drawn, on the destructive confirmation only. A disabled button has no edge, the fill colour and secondary text, with the reason written beside it. |
| Input | `field`, with `textarea`, `select`, `search-field` | A small component change. The field's control rests on the raised surface and uses the sunken one only when read-only; A draws every input on sunken. Otherwise tokens alone. |
| Segmented choice | `segmented-control` | Tokens alone for colour. A change to its radius: the unreleased commit makes it a pill and A draws 10px, with a hairline outline on the selected segment in light. A also uses it for On and Off in Settings. |
| Tag and status | `badge` with its `statusSet`; `tag` for a neutral label | Tokens alone for the six looks A uses. The outline tag ("Passed on a1b2c3d", "Expected from the task") and the signal (3.17) are variants of `badge`. |
| Card | `card` (bordered, `--sunken`) | Tokens alone. A's flat card (no fill, hairline border), dashed card (5.1) and plain card (no border in dark, 2.9) are variants. The stylesheet gives a card inside a card the pane surface; that fill has to come from elsewhere, since the pane token has one role. |
| Queue item and queue row | `list` (`--dense`), with `run-status` for a row of work | The lifted first item and the row with a kind, a waiting time and one action are a new arrangement of `run-status`: a variant. |
| Evidence row and its four kinds | `review-decision` (source and finding lines), `check-list`, `source-chip` (a link to a file, a page or a commit) | New. `source-chip` is a link and must not be reused for the label. The label is not a `badge`, so it does not count toward `excess-badges`. |
| Disclosure for "Always allow this command" | `disclosure`, `accordion` | Tokens alone, if `disclosure` is a real button with `aria-expanded`; check. |
| Decision surface, five levels | `review-decision` (routine review), `approval` (normal, `--elevated`), `confirm-dialog` (destructive), React `approval.tsx` and `dialog.tsx` | Routine and approval: tokens alone plus the signal and the "Accepting will" list, a variant. Elevated risk: variant; A tints the whole card, the system tints one line, and the system uses the warning tokens where A uses attention. Destructive: `confirm-dialog` with a band and a heavier edge, a variant. Refused: new, a record with no approve action. One component with a level is cleaner than four. |
| The line that says why an action is not offered | none | New, and small: an info mark and one sentence on the fill colour, radius 10px, in the place of the missing button. |
| Dialog | `dialog`, `confirm-dialog` | Tokens alone (radius, shadow). |
| Sheet | `sheet` (bottom on a phone, side panel from 768px) | Tokens alone. The grab handle is a small addition. From 768 to 1023px A docks the decision sheet at the foot of the pane, open and in the flow: a variant. |
| Sticky action area | `composer` has `--sticky`; nothing for a decision | New as a pattern in the app shell: a band above the tab bar. |
| Tabs | `tabs` | Tokens alone. The counts beside a tab are plain text. |
| Navigation | `sidebar-nav`, `tab-bar`, `app-header`, `pending-tray`, `menu` | Tokens alone, plus the pane token. The Run menu in the top bar is a `menu`. The open item is one `list` item under the places. The count pill and the icon rail are variants. |
| Composer | `composer` (`--sticky`) | Tokens alone for the box, at the dialog radius. The intent picker is four choice cards above a large composer on New chat or task: a composition of `option-picker` and `composer`, no new component. |
| Choice card | `option-picker` | The chosen card has a 2px edge in the interactive colour and a tick: a heavier edge and a mark, not colour alone. Tokens alone if `option-picker` already draws both; check. |
| Progress track | `stepper`, `run-timeline`, `progress` | `stepper` with descriptions covers Build, Checks, Your decision. A finished step is neutral and a passed one green: two states where the system may have one. A variant. |
| Table | `data-table`, `key-value`, `settings-row` | Tokens alone, in comfortable and compact density. |
| Avatar, key hint, diff, output | `avatar`, `kbd`, `diff`, `code-block`, `log-viewer` | Tokens alone. `kbd` stays for navigation shortcuts only. |

## 6. What can ship, in three lists

The owner asked for three things to be kept apart, because the largest risk is a polished interface that promises behaviour the system does not guarantee. Every item of this specification is in exactly one list. An item in list (c) must not appear in the product before its guarantee exists: until then the screen keeps today's wording.

The product facts are from Botbench's `main` (`0f31463`). Section 8 says which were checked again for this version.

### (a) What can ship as styling alone

No change in behaviour, in the server or in what a screen claims.

In the design system:

1. The unreleased foundations work, reworked before release: control 40px, body 15/23, a 14/20 role, title 28/34, no 11px role, radii 6, 10, 12 and 16, small button 32px, reading column 760px, inspector 340px.
2. The Botbench theme's colours and overlay shadow from section 2, a value for `--ds-color-accent-hover`, and the new pairs in `pairs.json` (edge on sunken, fill and the attention tint; muted on sunken and fill).
3. The pane surface token with its pairs, for the app shell's panes only, with a hairline on the navigation and the inspector in both modes.
4. The theme comment and the rules it touches: the accent, the status hues, the pill list, and 1024px and 1280px as widths the app shell may use beside 768px.
5. Component changes that tokens do not reach: the outlined button, the input's resting surface, the outline badge and the signal, the plain card, the elevated approval on the attention tokens, the band and heavier edge on the destructive confirmation, the segmented control's radius.
6. The release, the sync into Botbench, the regenerated token block of `DESIGN.md` and its rewritten prose.

In Botbench:

7. The mark in one colour.
8. Status tones: Usage limit moves from the warning tone to the neutral one.
9. Decision buttons without key hints. The five decision levels as surfaces, for the decisions the product already asks for: accept or reject, an approval, a push or pull request, Discard, and the record of a refusal with its sentence that a stricter mode never allows what was refused.
10. The full name of the open item in the navigation, and `title` on any text that is cut.
11. The paired-workbench screens, with the "Outside text" mark kept on every message a peer sent.
12. The look of the "No checks are set up" state, which the product already knows: the neutral dashed mark, never the success colour, never the word verified. The button keeps today's action and label until list (c) gives it its own.

### (b) Interactions that can ship on existing backend capabilities

Client work on routes and data the product already has. Each claims only what the server already does.

1. **The four layouts**: the phone under 768px, one pane with a menu button and a decision sheet to 1023px, two panes with the rail to 1279px, three from 1280px. Each is checked against the main-column width it leaves.
2. **The review in the owner's order**, with the four kinds of claim, from the evidence the task detail already sends (checks, the review, the agent's last message, the branch's distance from main). Without the "Evidence is current" tag and without the stale state: those are in list (c).
3. **The intent picker** on New chat or task, for the four intents whose routes exist: Ask a question, Start a task, Plan a run, Ask several agents.
4. **Failure that leads with recovery**, with Resume where the product offers it today: a stopped task, and a failed task whose agent changed no file. Without the note field (list c).
5. **Home as a queue** from today's board route: the headline, the first item lifted with the one primary action, the kind of ask in words, one outlined action per row, Completed as accepted work only with the quiet line to Work, and the counted groups, counted in the client from what the route sends. Without the stated order, the waiting times and the Waiting group (list c). Until then the rule line is not printed and a usage-limit wait stays where it is today.
6. **Work's table** over what the board route sends, with search in the client as today, and a line that says what is not listed. The Failed filter can filter what was sent; its count is in list (c).
7. **"Always allow this command"** as a focusable disclosure that states what is authorised, its scope and how long the grant lasts. The grant and its confirmation exist.
8. **The Run menu on a task's screen**, with "Make the mode stricter" and "Cancel run". Both controls exist on the run's screen today (`tightenMode`, `cancelRun`); the menu gathers them where a task of the run is open.
9. **The sticky action area and the approval sheet** on the phone, for the decisions that exist.
10. **Settings in six groups.** Workbench identity uses what exists, including the fingerprint, which the paired-workbench overview already carries. Execution environments needs one addition to an existing route: Settings returns each repository's path and execution kind, and the setup and check commands, which Botbench already reads from its settings file, must be sent with them. The Ready or problem state is in list (c).
11. **The agent strip**, Usage and limits in tokens, and a link from "How to set up checks" to a help page.

### (c) New correctness guarantees that need engineering

Each of these changes what the product guarantees. For each: what the product does today, what must be true before the screen may say it, and where the threat model changes. Sizes: small is one unit of work with no schema change; medium adds a route, a state or a migration; large changes a rule the engine enforces.

| Guarantee | What the product does today | What must be true first | Threat model | Size |
|---|---|---|---|---|
| **Verification tied to the exact commit** | `evidence` and `command_lists` rows carry a task, a kind and a round, and no commit. `reviews.head_commit` and the check-together row's `task_commit` do. The product cannot say which commit a check ran on. | The commit each round of checks ran on is stored. One evidence state is computed for the task on the server: current, stale by a newer commit, stale by files not in the commit, invalidated, or no checks. "Evidence is current" is shown only from that state. | "The verify station: check commands": the commit becomes part of the record of a check. | Medium |
| **The stale-evidence block** | `decide()` in `src/engine/decision.ts` refuses a moved branch only for the mode's own accept ("has moved past the commit Botbench made and checked, so only you can accept it"). The owner's accept goes through and stores the commit the branch holds now. The client offers Accept whenever no decision exists. | The owner's accept is refused on the server when the evidence state is stale or invalidated, with the cause in words. The client then shows "Run checks again" or "Inspect changes" by cause, and no Accept. A route takes a task that is ready for review back to Checking on the branch's current commit: today checks run again only inside a resume, after a note round, and after an update with main. | "Decisions: accept and reject": a new refusal, and the tampering case it closes, a commit nobody checked being accepted. "The verify station": an owner request now starts the repository's check commands again. | Large |
| **Safe acceptance: "Accept without verification" as its own action** | Accept is one action in every state. With no checks set up the client says "No checks are set up for this repository." and accepts. No route tells a verified accept from an unverified one, and nothing records which it was. | The server knows three cases and treats them apart: accept with current passing evidence; accept with no checks set up, stored and logged as unverified; and no accept at all when checks failed or are stale. "Accept without verification" is offered only in the second. A fully autonomous run never takes the second by itself (it already refuses: "No checks ran on it."). | "Decisions: accept and reject": the unverified accept is a logged owner action, never the mode's; a failed or stale check cannot be accepted round. | Medium |
| **Selective handling of files left by checks** | `taskLeftovers` lists the files in the task's copy that are not on the branch, as one list. The decision is refused until the request carries exactly that list, and the client asks "Accept and remove them" or "Keep the copy" for any leftover file. Nothing tells a changed tracked file from an ignored artifact. | Each file is classed on the server: a changed tracked source or configuration file, or an untracked file that could affect the result, the checks or the deliverable, blocks Accept; an ignored, harmless artifact is disclosed and removed with the copy. The rule for "could affect" is written down and tested; when it cannot tell, the file blocks. "Inspect changes" needs a view of those files beside the commit and a way to commit or remove them, after which the checks run again. | "Decisions: accept and reject", which counts both files the checks wrote and tracked files changed since. The classification is new attack surface: a hostile repository could try to pass a meaningful file off as an ignored artifact, for example through its own ignore rules. Deny on doubt. | Medium to large |
| **Stop on a single task** | None. A run can be cancelled (`cancelRun`, `stopRun`); a single task cannot be stopped. A hand-off stops a turn only inside a move. | A route stops the agent's turn or the running command and leaves the task Stopped, with its copy, so that Resume applies. The stop is in the log. The line "the work is kept and the task can be resumed" is true only then. | A paragraph under "The build line": an owner action, no new boundary. | Medium |
| **A note with Resume** | `POST /api/tasks/:id/resume` reads no body and `resume(id)` takes no note. Resume is offered for a stopped task and for the one failed case where the agent changed no file. | The route takes an optional note, stores it as an owner note and gives it to the agent as its first message on resume. No note field where no agent starts (a resume at the checks or at setup). | "Owner notes": the same length limit and the same marking as the owner's words. | Small to medium |
| **The Waiting group and its causes** | `taskGroup` in `src/api/board.ts` puts `waiting_for_limit` in Running, and `interrupted`, `failed` and `cancelled` in Finished. The product's words are "Usage limit" and "Waiting for task N to finish"; a task that waits for another is `building`, so Running. A wait on a paired workbench is not a state of a task at all. | A fifth group in the board API with a cause per item and when the wait began. "Waiting on usage limit" exists as a status. "Waiting on dependency" needs a derived state for a task that waits for another. "Waiting on teammate" needs a definition first (open question 3). "Goes on by itself" is shown only where that is true. The three phrases enter the voice glossary. A recoverable failure moves to Needs you, Completed holds accepted work only, and Home counts what ended otherwise. | None for the first two causes. "Waiting on teammate" touches the paired-workbench sections: the cause is shown from Botbench's own record, never from the peer's text. | Small to medium; teammate medium |
| **Attention ordering by stated rules** | `board()` sorts every group by `updatedAt`, newest first. A row carries `waitingOnApproval` as a yes or no, and no time the wait began. | A rank per row on the server: an approval that holds an agent, a failure to recover, a plan, a result; oldest wait first inside a rank. The row carries its kind and when the wait began (the approval's time, the plan's, or when the task became ready for review). The screen prints the rule and the waiting times only once the server orders by it. | None. No trust boundary. The activity line on a running row is the tool's and the model's text: plain text, one line, never drawn as markdown. | Small |
| **Work is complete, and its counts are true** | One route, `GET /api/board`. Needs you and Running are sent whole; Finished and Chats are cut to the newest 100. Search is in the client over what was sent. | Search, filters and paging on the server, with a count per state (among them Failed), the agent on each row and a number for a chat. Only then may the screen say "Every task, run and chat" and show totals. | None. No trust boundary. | Medium |
| **A repository's environment is Ready, or has a named problem** | The sentence about a missing container image appears only on the task that failed because of it. Settings does not know a repository's state. | A probe that asks Docker and looks for the image before a task starts, with its result and its time. "Ready" is shown only from a probe, and says when it was made. | The threat model's part on where commands run, and ADR 0002: the probe runs a command on the owner's machine on Settings' behalf; it must not run anything from the repository. | Small to medium |

Not in the product and not specified here: a shared-work view across two paired workbenches (one board draws it, marked as planned), a synthesis of several agents' answers, pause, and web access per chat.

## 7. Open questions for the owner

The second round answered the questions of the previous version. These remain.

1. Which colour marks work that carries outside input? The boards draw a peer's text in teal; the system has an orange `tainted` token for it, and a run that read a GitHub issue is not drawn.
2. Do rejected and cancelled work appear anywhere on Home beyond the quiet line now drawn under Completed ("1 rejected and 1 cancelled are in Work")?
3. What counts as "Waiting on teammate"? The board's example is "Dana's workbench is reviewing task 27". Today a wait on a paired workbench is not a state of a task.
4. Is the pane hairline enough separation in dark? Measured: 1.28:1 against the pane and 1.38:1 against the page, beside a fill step of 1.07:1 between page and pane. Most cards have no border in dark at all and rest on a fill step of 1.19:1 (conflict 3.19).
5. Heading weights of 650 and 680 against the system's three weight tokens (400, 500, 600): add one heavier token, which only a variable platform font can draw, or keep 600?
6. May the "Outside text" mark on each message of a paired workbench ever be reduced? It is a named spoofing mitigation in the threat model. The boards keep it on every message.
7. The plain card has no border in dark and a hairline in light, which no six-digit hex token can express. One new token for it, or no border in either mode? (2.9)

## 8. What was verified, and what was not

Verified for this version:

- Every direction A value in section 2, against the final stylesheet.
- Every contrast figure, by script, in both modes, on the final stylesheet. The in-browser check has no finding on any of the 47 boards in dark, nor on the seven that were also measured in light.
- Every quotation in section 3, against the design system at `c0be2a8`, the unreleased local commits and Botbench at `0f31463`.
- These product facts, against Botbench at `0f31463`: the 1024px switch, the glossary's ban on `blocked`, the board's grouping, its sort and its cut at 100, the resume route, the refusal sentence for a moved branch, the two "no checks" sentences, "Accept and remove them", the threat model's line on the Outside text badge, and `tightenMode`.
- Eleven final renders were read for the descriptions: the eight shown in the text, the no-checks review, the review at 768px and the widths board. The other boards are described from their markup and their notes.
- An independent reviewer checked an earlier version of this document against the stylesheet, the decisions and the eight pictures. Its corrections are in. The final version was not reviewed again.
- No file in this folder, and no picture's text that was read, names a person's account or machine.

Not verified:

- The owner has not approved the boards by eye. Nothing here is visually approved.
- Light mode in the browser for 40 of the 47 boards on the final stylesheet. Light is covered for all of them by the contrast script, which works on the colour values.
- Firefox, Safari, a real phone, a touch screen, a screen reader, text at 200%, and reduced motion. The mock-ups are static: no hover, pressed or loading state is drawn, and no transition. The disclosure and the menu are drawn open; their keyboard behaviour is specified, not tested.
- The mock-ups inside the canvas tool itself. The renders draw the markup and the stylesheet, not what the tool adds.
- Windows and Android, where the platform font is not variable and the heading weights would round.
- The "Main" and "Unreleased" columns of section 2 were carried from the first draft. The colour and radius rows and the type scale were compared with the files again; the rest was not re-read line by line.
- The other product facts of section 6 were taken from the first draft and the designers' notes: where notes may be sent, what the checks trigger allows, what Settings' route returns, that the fingerprint is already carried, that both run controls exist on the run's screen, the exact titles of the threat-model sections, and whether the voice glossary already allows the word "Waiting".
- The character counts per diff line and the main-column widths in 5.5 are the widths board's own figures. They were not measured again.
- Which other apps consume the design system.
- `option-picker`, `stepper` and `confirm-dialog` on main were not opened to see how close they already are.

## Appendix A. Rules in the reference stylesheet to collapse

The reference stylesheet was written by several designers, each appending rules. It draws the intended result. The last-row rules for tables, which drew the Usage tables wrong in an earlier version, are already collapsed to one. When the rest becomes design-system source, each group below becomes one rule.

| What the rules do now | Collapse to |
|---|---|
| **A cell that cuts its text.** `.tbl td.clip{max-width:0}` for every table, then `.tbl:not(.fix) td.clip{max-width:none}`. | `.tbl.fix td.clip{max-width:0}` alone. |
| **A setting row inside a card.** `.card>.set:first-child` and `:last-child` set the padding to 0; the same selectors appear again setting it back to 16px ("withdrawn"); `.set.bare` is the replacement. | Delete all four. Keep `.set.bare`. |
| **The large composer.** `.composer.big textarea{min-height:120px}`, then the same selector at 168px. | 168px. |
| **Type roles.** `.t-title`, `.t-h`, `.t-sub` and `.t-micro` are set once (26/32, 19/26, 16/24, 12/16 capitals), then again under `.dir-a` (28/34, 20/26, 16/22, 13/18 sentence case). The phone title is set for both. | One declaration per role with the direction A values. `.t-micro` becomes a group label and should be renamed. |
| **Direction switches.** `--head-w` and `--head-track` on the root, then under `.dir-a`. `--seam` is set to the hairline on the root and again under `.light`, so it is one value and can be replaced by the hairline. `.top` has a hairline that `.dir-a` makes transparent. `.stop.done` and `.rail.done` are green, then neutral under `.dir-a`. `.card.flat` and `.decide.refused` have a fill for B and C only. `.stop b` takes the hairline, then the edge under `.dir-a`. | The direction A value alone. Delete the `.dir-b` and `.dir-c` blocks and every rule that names them. |
| **The old mark.** `span.logo` draws a 6px-radius square in the interactive colour. Every final board uses the `svg.logo`. | Delete. |
| **Two selected rows.** `.item.sel` and `.item.on` both set the fill colour; `.on` adds a tick. | One. |
| **Small-button radius.** `.btn.sm` repeats `border-radius:10px`. | Inherit from `.btn`. |
| **Queue row.** `.q-t` and `.q-m`, then `.q-t.fit` and `.q-m.fill` to reverse which one grows. | One row component with a variant for "metadata follows the title". |
| **Claim row.** `.ev`, `.ev.stack`, `.ev.rv`, `.ev.rv.mid` and the `.m` overrides. | One evidence-row component with a narrow variant; the narrow one applies under 1280px. |
| **Row header cells.** `.tbl th[scope="row"]` restyles a head cell back to an ordinary cell. | A cell style that does not depend on the element. |
| **The plain card.** `.card.plain` makes the border transparent; a second rule under `.light` gives it the hairline back. 148 of 185 cards use it. | One decision on the card's default (conflict 3.19), then one rule. |
| **Layout boards.** The `w-` rules: `.w-one` and `.sheet.w-dock` are the one-pane layout and its docked decision sheet; `.w-frame` and `.w-pane` only draw the schematic frames of the widths board. | The first two belong to the app shell. The schematic rules are not product styles. |
| **Unused.** `.planned`, `.bar`, `.box`, `.btn.pill`, `.btn.off`, `.item.sel`, `.stop.wait`, `.done`, `.rail`, and the grids `.g12`, `.g23`, `.g112` appear on no final board. | Delete, unless the component they belong to needs them. |
| **Utility classes.** One-property helpers appended at the end (`.gap2`, `.gap12`, `.gap24`, `.minw0`, `.mt2`, `.w96`, `.fixed`, `.nowrap`, `.f2`), and 558 inline `style` attributes across the 47 boards, mostly for widths and gaps. | Component layout. The system allows no inline style. |

## Appendix B. Every contrast pair

Foreground on background, dark and light. "Needs" is the threshold; "none" is a hairline or a surface step, where no threshold applies. Role names are those of the reference stylesheet.

| Pair | Kind | Needs | Dark | Light | Result | Where it is drawn |
|---|---|---|---|---|---|---|
| Text on canvas (`--text` on `--canvas`) | text | 4.5:1 | 16.75 | 15.14 | pass | body and metadata |
| Text on surface (`--text` on `--surface`) | text | 4.5:1 | 15.54 | 15.84 | pass | body and metadata |
| Text on raised (`--text` on `--raised`) | text | 4.5:1 | 14.02 | 16.39 | pass | body and metadata |
| Text on sunken (`--text` on `--sunken`) | text | 4.5:1 | 17.52 | 14.34 | pass | body and metadata |
| Text on fill (`--text` on `--fill`) | text | 4.5:1 | 11.78 | 14.10 | pass | selected navigation row, chip, neutral tag, the line that says why Accept is not offered |
| Secondary text on canvas (`--text2` on `--canvas`) | text | 4.5:1 | 8.90 | 6.08 | pass | body and metadata |
| Secondary text on surface (`--text2` on `--surface`) | text | 4.5:1 | 8.26 | 6.36 | pass | body and metadata |
| Secondary text on raised (`--text2` on `--raised`) | text | 4.5:1 | 7.45 | 6.58 | pass | body and metadata |
| Secondary text on sunken (`--text2` on `--sunken`) | text | 4.5:1 | 9.31 | 5.76 | pass | body and metadata |
| Secondary text on fill (`--text2` on `--fill`) | text | 4.5:1 | 6.25 | 5.66 | pass | unselected segment, disabled button |
| Interactive on canvas (`--act` on `--canvas`) | text | 4.5:1 | 8.92 | 5.96 | pass | status word, signal or mark |
| Interactive on surface (`--act` on `--surface`) | text | 4.5:1 | 8.28 | 6.24 | pass | status word, signal or mark |
| Interactive on raised (`--act` on `--raised`) | text | 4.5:1 | 7.47 | 6.45 | pass | status word, signal or mark |
| Interactive on sunken (`--act` on `--sunken`) | text | 4.5:1 | 9.33 | 5.65 | pass | status word, signal or mark |
| Interactive on interactive tint (`--act` on `--act-bg`) | text | 4.5:1 | 7.34 | 5.52 | pass | tag, avatar, diff line, band |
| Peer on canvas (`--peer` on `--canvas`) | text | 4.5:1 | 10.51 | 5.20 | pass | status word, signal or mark |
| Peer on surface (`--peer` on `--surface`) | text | 4.5:1 | 9.75 | 5.44 | pass | status word, signal or mark |
| Peer on raised (`--peer` on `--raised`) | text | 4.5:1 | 8.79 | 5.63 | pass | status word, signal or mark |
| Peer on sunken (`--peer` on `--sunken`) | text | 4.5:1 | 10.99 | 4.93 | pass | status word, signal or mark |
| Peer on peer tint (`--peer` on `--peer-bg`) | text | 4.5:1 | 8.63 | 4.91 | pass | tag, avatar, diff line, band |
| Attention on canvas (`--attn` on `--canvas`) | text | 4.5:1 | 10.52 | 4.85 | pass | status word, signal or mark |
| Attention on surface (`--attn` on `--surface`) | text | 4.5:1 | 9.76 | 5.08 | pass | status word, signal or mark |
| Attention on raised (`--attn` on `--raised`) | text | 4.5:1 | 8.80 | 5.25 | pass | status word, signal or mark |
| Attention on sunken (`--attn` on `--sunken`) | text | 4.5:1 | 11.00 | 4.60 | pass | status word, signal or mark |
| Attention on attention tint (`--attn` on `--attn-bg`) | text | 4.5:1 | 8.54 | 4.65 | pass | tag, avatar, diff line, band |
| Success on canvas (`--ok` on `--canvas`) | text | 4.5:1 | 10.38 | 6.08 | pass | status word, signal or mark |
| Success on surface (`--ok` on `--surface`) | text | 4.5:1 | 9.63 | 6.36 | pass | status word, signal or mark |
| Success on raised (`--ok` on `--raised`) | text | 4.5:1 | 8.68 | 6.58 | pass | status word, signal or mark |
| Success on sunken (`--ok` on `--sunken`) | text | 4.5:1 | 10.85 | 5.76 | pass | status word, signal or mark |
| Success on success tint (`--ok` on `--ok-bg`) | text | 4.5:1 | 8.68 | 5.70 | pass | tag, avatar, diff line, band |
| Error on canvas (`--err` on `--canvas`) | text | 4.5:1 | 8.14 | 5.21 | pass | status word, signal or mark |
| Error on surface (`--err` on `--surface`) | text | 4.5:1 | 7.56 | 5.46 | pass | status word, signal or mark |
| Error on raised (`--err` on `--raised`) | text | 4.5:1 | 6.81 | 5.64 | pass | status word, signal or mark |
| Error on sunken (`--err` on `--sunken`) | text | 4.5:1 | 8.52 | 4.94 | pass | status word, signal or mark |
| Error on error tint (`--err` on `--err-bg`) | text | 4.5:1 | 7.04 | 4.72 | pass | tag, avatar, diff line, band |
| Text on interactive tint (`--text` on `--act-bg`) | text | 4.5:1 | 13.78 | 14.03 | pass | body text on a tint |
| Secondary text on interactive tint (`--text2` on `--act-bg`) | text | 4.5:1 | 7.32 | 5.63 | pass | metadata on a tint |
| Text on peer tint (`--text` on `--peer-bg`) | text | 4.5:1 | 13.76 | 14.29 | pass | body text on a tint |
| Secondary text on peer tint (`--text2` on `--peer-bg`) | text | 4.5:1 | 7.31 | 5.74 | pass | metadata on a tint |
| Text on attention tint (`--text` on `--attn-bg`) | text | 4.5:1 | 13.60 | 14.51 | pass | body text on a tint |
| Secondary text on attention tint (`--text2` on `--attn-bg`) | text | 4.5:1 | 7.22 | 5.82 | pass | metadata on a tint |
| Text on success tint (`--text` on `--ok-bg`) | text | 4.5:1 | 14.02 | 14.21 | pass | body text on a tint |
| Secondary text on success tint (`--text2` on `--ok-bg`) | text | 4.5:1 | 7.44 | 5.70 | pass | metadata on a tint |
| Text on error tint (`--text` on `--err-bg`) | text | 4.5:1 | 14.49 | 13.71 | pass | body text on a tint |
| Secondary text on error tint (`--text2` on `--err-bg`) | text | 4.5:1 | 7.69 | 5.50 | pass | metadata on a tint |
| Interactive on fill (`--act` on `--fill`) | text | 4.5:1 | 6.27 | 5.55 | pass | mark or count on a selected row |
| Peer on fill (`--peer` on `--fill`) | text | 4.5:1 | 7.39 | 4.84 | pass | mark or count on a selected row |
| Attention on fill (`--attn` on `--fill`) | text | 4.5:1 | 7.39 | 4.52 | pass | mark or count on a selected row |
| Success on fill (`--ok` on `--fill`) | text | 4.5:1 | 7.29 | 5.66 | pass | mark or count on a selected row |
| Error on fill (`--err` on `--fill`) | text | 4.5:1 | 5.72 | 4.85 | pass | mark or count on a selected row |
| Primary button text on interactive (`--on-act` on `--act`) | text | 4.5:1 | 8.80 | 6.45 | pass | primary button label |
| Canvas on error (`--canvas` on `--err`) | text | 4.5:1 | 8.14 | 5.21 | pass | filled Discard label |
| Canvas on success (`--canvas` on `--ok`) | graphic | 3:1 | 10.38 | 6.08 | pass | tick inside a passed step: defined in the stylesheet, on no final board |
| Canvas on secondary text (`--canvas` on `--text2`) | graphic | 3:1 | 8.90 | 6.08 | pass | tick inside a finished step: defined in the stylesheet, on no final board |
| Control edge on canvas (`--edge` on `--canvas`) | edge | 3:1 | 4.44 | 3.69 | pass | outlined button, input, select, composer, dashed label |
| Control edge on surface (`--edge` on `--surface`) | edge | 3:1 | 4.12 | 3.86 | pass | outlined button, input, select, composer, dashed label |
| Control edge on raised (`--edge` on `--raised`) | edge | 3:1 | 3.72 | 4.00 | pass | outlined button, input, select, composer, dashed label |
| Control edge on sunken (`--edge` on `--sunken`) | edge | 3:1 | 4.65 | 3.50 | pass | outlined button, input, select, composer, dashed label |
| Control edge on fill (`--edge` on `--fill`) | edge | 3:1 | 3.12 | 3.44 | pass | outlined button, input, select, composer, dashed label |
| Control edge on attention tint (`--edge` on `--attn-bg`) | edge | 3:1 | 3.61 | 3.54 | pass | outlined button on the elevated-risk surface |
| Control edge on peer tint (`--edge` on `--peer-bg`) | edge | 3:1 | 3.65 | 3.49 | pass | outlined button on a peer's message |
| Interactive on canvas (`--act` on `--canvas`) | focus | 3:1 | 8.92 | 5.96 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Interactive on surface (`--act` on `--surface`) | focus | 3:1 | 8.28 | 6.24 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Interactive on raised (`--act` on `--raised`) | focus | 3:1 | 7.47 | 6.45 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Interactive on sunken (`--act` on `--sunken`) | focus | 3:1 | 9.33 | 5.65 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Interactive on fill (`--act` on `--fill`) | focus | 3:1 | 6.27 | 5.55 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Interactive on attention tint (`--act` on `--attn-bg`) | focus | 3:1 | 7.24 | 5.71 | pass | focus ring, 2px offset, and the primary button's own boundary |
| Attention on surface (`--attn` on `--surface`) | edge | 3:1 | 9.76 | 5.08 | pass | edge of the elevated-risk surface in the inspector |
| Attention on canvas (`--attn` on `--canvas`) | edge | 3:1 | 10.52 | 4.85 | pass | edge of the elevated-risk surface on the page |
| Error on raised (`--err` on `--raised`) | edge | 3:1 | 6.81 | 5.64 | pass | destructive dialog's edge against its own fill |
| Error on surface (`--err` on `--surface`) | edge | 3:1 | 7.56 | 5.46 | pass | outlined danger button in the inspector |
| Error on canvas (`--err` on `--canvas`) | edge | 3:1 | 8.14 | 5.21 | pass | outlined danger button, destructive surface on the page |
| Error on error tint (`--err` on `--err-bg`) | edge | 3:1 | 7.04 | 4.72 | pass | rule under the band |
| Peer on canvas (`--peer` on `--canvas`) | edge | 3:1 | 10.51 | 5.20 | pass | edge of a peer's message |
| Peer on peer tint (`--peer` on `--peer-bg`) | edge | 3:1 | 8.63 | 4.91 | pass | ring of the Outside text mark on a peer's message |
| Interactive on raised (`--act` on `--raised`) | edge | 3:1 | 7.47 | 6.45 | pass | edge and tick of the chosen card (covered by focus on raised) |
| Hairline on canvas (`--line` on `--canvas`) | separation | none | 1.38 | 1.20 | n/a | hairline or surface step: no threshold applies |
| Hairline on surface (`--line` on `--surface`) | separation | none | 1.28 | 1.25 | n/a | hairline or surface step: no threshold applies |
| Hairline on raised (`--line` on `--raised`) | separation | none | 1.15 | 1.29 | n/a | hairline or surface step: no threshold applies |
| Surface on canvas (`--surface` on `--canvas`) | separation | none | 1.07 | 1.04 | n/a | hairline or surface step: no threshold applies |
| Raised on canvas (`--raised` on `--canvas`) | separation | none | 1.19 | 1.08 | n/a | hairline or surface step: no threshold applies |
| Raised on surface (`--raised` on `--surface`) | separation | none | 1.10 | 1.03 | n/a | hairline or surface step: no threshold applies |
| Fill on raised (`--fill` on `--raised`) | separation | none | 1.19 | 1.16 | n/a | hairline or surface step: no threshold applies |
| Fill on surface (`--fill` on `--surface`) | separation | none | 1.31 | 1.12 | n/a | hairline or surface step: no threshold applies |
| Raised on fill (`--raised` on `--fill`) | separation | none | 1.19 | 1.16 | n/a | hairline or surface step: no threshold applies |

## Appendix C. All boards

Every final board for direction A, as rendered in dark from its markup and the reference stylesheet. Two boards are light by default. Sizes are in CSS pixels; a phone board's picture has twice as many.

| Board | Picture | Size | What it shows |
|---|---|---|---|
| `V2Access` | [V2Access.png](2026-11-23/boards/V2Access.png) | 1440 by 1400 | Reference: contrast tiles in dark and light, focus, keyboard, target sizes, text scaling, reduced motion. Its "Three layouts" card is out of date (conflict 3.18). |
| `V2Approval` | [V2Approval.png](2026-11-23/boards/V2Approval.png) | 1440 by 900 | An approval that holds an agent: the request, why it asks, Decline and Allow, and the open "Always allow this command" disclosure. |
| `V2ApprovalRisk` | [V2ApprovalRisk.png](2026-11-23/boards/V2ApprovalRisk.png) | 1440 by 900 | Elevated risk: opening a pull request, with what would be sent and the consequences before the buttons, in the attention colour. |
| `V2Compare` | [V2Compare.png](2026-11-23/boards/V2Compare.png) | 1440 by 900 | Three agents asked one question, side by side, each answering alone, with "Ask one to compare the answers". |
| `V2Critique` | [V2Critique.png](2026-11-23/boards/V2Critique.png) | 1440 by 1400 | Reference: what iteration 1 got wrong and what replaces it. |
| `V2Destructive` | [V2Destructive.png](2026-11-23/boards/V2Destructive.png) | 1440 by 900 | The Discard dialog: a red edge, the "Cannot be undone" band, Removed and Kept lists, the safe button first. |
| `V2Executing` | [V2Executing.png](2026-11-23/boards/V2Executing.png) | 1440 by 900 | A task being built: the conversation, the running command and its output, the note composer, progress, steering, and Stop on its own. |
| `V2Failed` | [V2Failed.png](2026-11-23/boards/V2Failed.png) | 1440 by 900 | A failed task that can be resumed: what happened, the agent's last words, what nothing verified, and Resume with a note. |
| `V2Home` | [V2Home.png](2026-11-23/boards/V2Home.png) | 1440 by 900 | Home with three things that need you: the queue, In progress, Waiting, Completed. |
| `V2Home768` | [V2Home768.png](2026-11-23/boards/V2Home768.png) | 768 by 1024 | Home at 768px: one pane, navigation behind the menu button. |
| `V2HomeFifty` | [V2HomeFifty.png](2026-11-23/boards/V2HomeFifty.png) | 1440 by 900 | Home with fifty items: every ask shown, the other groups counted. |
| `V2HomeLight` | [V2HomeLight.png](2026-11-23/boards/V2HomeLight.png) | 1440 by 900 | The same Home, light by default. |
| `V2HomeMany` | [V2HomeMany.png](2026-11-23/boards/V2HomeMany.png) | 1440 by 900 | Home with twenty items: every ask shown, the other groups one line each. |
| `V2Levels` | [V2Levels.png](2026-11-23/boards/V2Levels.png) | 1440 by 760 | Reference: the five decision levels side by side. |
| `V2MApproval` | [V2MApproval.png](2026-11-23/boards/V2MApproval.png) | 390 by 844 | Phone: an approval as a sheet over the task. |
| `V2MCompare` | [V2MCompare.png](2026-11-23/boards/V2MCompare.png) | 390 by 844 | Phone: three agents' answers, one at a time behind a switch. |
| `V2MExecuting` | [V2MExecuting.png](2026-11-23/boards/V2MExecuting.png) | 390 by 844 | Phone: a task being built, with Stop in its own row of the action area. |
| `V2MFailed` | [V2MFailed.png](2026-11-23/boards/V2MFailed.png) | 390 by 844 | Phone: a failed task, with the note field, Resume and Inspect in the action area. |
| `V2MHome` | [V2MHome.png](2026-11-23/boards/V2MHome.png) | 390 by 844 | Phone: Home with the four groups and one primary button. |
| `V2MPeer` | [V2MPeer.png](2026-11-23/boards/V2MPeer.png) | 390 by 844 | Phone: a paired workbench's question, with "Outside text" on each of its messages. |
| `V2MReview` | [V2MReview.png](2026-11-23/boards/V2MReview.png) | 390 by 844 | Phone: the review, with Reject and Accept in the sticky action area. |
| `V2MSettings` | [V2MSettings.png](2026-11-23/boards/V2MSettings.png) | 390 by 844 | Phone: Settings in six groups, each with one line of state. |
| `V2NewChat` | [V2NewChat.png](2026-11-23/boards/V2NewChat.png) | 1440 by 900 | New chat or task: four intents, then a large composer with the repository, agent, model and mode. |
| `V2Peer` | [V2Peer.png](2026-11-23/boards/V2Peer.png) | 1440 by 900 | A paired workbench: what the other person needs, earlier messages, what is permitted, End pairing. |
| `V2Plan` | [V2Plan.png](2026-11-23/boards/V2Plan.png) | 1440 by 1850 | Reference: the plan as three lists (styling, interactions on today's backend, new guarantees), 1850px tall. |
| `V2Refused` | [V2Refused.png](2026-11-23/boards/V2Refused.png) | 1440 by 900 | A refused command in a fully autonomous run, with the Run menu open in the top bar. |
| `V2Review` | [V2Review.png](2026-11-23/boards/V2Review.png) | 1440 by 900 | The review: verification result, changed file, limitation, activity, and the routine decision. |
| `V2Review1024` | [V2Review1024.png](2026-11-23/boards/V2Review1024.png) | 1024 by 768 | The review at 1024px: two panes, navigation as a rail. |
| `V2Review1280` | [V2Review1280.png](2026-11-23/boards/V2Review1280.png) | 1280 by 800 | The review at 1280px: three panes at their narrowest. |
| `V2Review768` | [V2Review768.png](2026-11-23/boards/V2Review768.png) | 768 by 1024 | The review at 768px: one pane, the decision in a sheet docked at the foot. |
| `V2ReviewLeftovers` | [V2ReviewLeftovers.png](2026-11-23/boards/V2ReviewLeftovers.png) | 1440 by 900 | The review when the checks left an ignored file: disclosed, and Accept is still offered. |
| `V2ReviewLight` | [V2ReviewLight.png](2026-11-23/boards/V2ReviewLight.png) | 1440 by 900 | The same review, light by default. |
| `V2ReviewNoChecks` | [V2ReviewNoChecks.png](2026-11-23/boards/V2ReviewNoChecks.png) | 1440 by 900 | The review when no checks are set up: an outlined "Accept without verification". |
| `V2ReviewStale` | [V2ReviewStale.png](2026-11-23/boards/V2ReviewStale.png) | 1440 by 900 | The review when the check ran on an older commit: "Run checks again", no Accept. |
| `V2ReviewUncommitted` | [V2ReviewUncommitted.png](2026-11-23/boards/V2ReviewUncommitted.png) | 1440 by 900 | The review when a tracked file changed after the checked commit: "Inspect changes", no Accept. |
| `V2SettingsAgents` | [V2SettingsAgents.png](2026-11-23/boards/V2SettingsAgents.png) | 1440 by 900 | Settings: agents and models, as connection health, with the fallback order. |
| `V2SettingsConnections` | [V2SettingsConnections.png](2026-11-23/boards/V2SettingsConnections.png) | 1440 by 900 | Settings: the paired workbench, signed-in devices and notifications. |
| `V2SettingsEnvironments` | [V2SettingsEnvironments.png](2026-11-23/boards/V2SettingsEnvironments.png) | 1440 by 900 | Settings: where each repository's commands run, its setup and check commands, and its state. |
| `V2SettingsIdentity` | [V2SettingsIdentity.png](2026-11-23/boards/V2SettingsIdentity.png) | 1440 by 900 | Settings: the workbench's name, fingerprint, version, appearance and memory. |
| `V2SettingsPermissions` | [V2SettingsPermissions.png](2026-11-23/boards/V2SettingsPermissions.png) | 1440 by 900 | Settings: the default mode, web access, Ask before every command, commands always allowed. |
| `V2SettingsUsage` | [V2SettingsUsage.png](2026-11-23/boards/V2SettingsUsage.png) | 1440 by 900 | Settings: usage in tokens by agent and by run, and what a usage limit does. |
| `V2SharedWork` | [V2SharedWork.png](2026-11-23/boards/V2SharedWork.png) | 1440 by 900 | Planned, not in the product: one objective across two paired workbenches. |
| `V2Specimen` | [V2Specimen.png](2026-11-23/boards/V2Specimen.png) | 1440 by 1120 | Reference: the direction's components on one page. |
| `V2States` | [V2States.png](2026-11-23/boards/V2States.png) | 1440 by 1400 | Reference: the map of states and decisions. |
| `V2Tokens` | [V2Tokens.png](2026-11-23/boards/V2Tokens.png) | 1440 by 1240 | Reference: the colour roles in dark and light, spacing, radii and control sizes. |
| `V2Widths` | [V2Widths.png](2026-11-23/boards/V2Widths.png) | 1440 by 760 | Reference: the four layouts at one scale, with the width the main column gets. |
| `V2Work` | [V2Work.png](2026-11-23/boards/V2Work.png) | 1440 by 900 | Work: the searchable inventory of every task, run and chat, with its filters. |

47 pictures, 8.6 MB in all.

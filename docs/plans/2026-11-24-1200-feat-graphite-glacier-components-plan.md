# Build the Graphite + Glacier components, after the foundations of 0.12.0

## Context

0.12.0 put the approved direction into the tokens, the Botbench theme, the rules and the components that already exist: sizes, type, spacing, radii, the pane surface, the interactive blue, three breakpoints. It built no component the mock-ups introduce. This plan lists what is left, for the release after it.

The source for every item is section 5 of the [visual specification](../design/2026-11-23-graphite-glacier-visual-specification.md), with the owner's [decisions](../design/2026-11-23-design-decisions.md). Section 6 of the specification says which items are styling, which need only the client, and which need a guarantee the product does not give yet. A component here may be built before its guarantee exists; a screen may not show it until then.

Nothing below is built. No class, variant or example for any of it is in 0.12.0.

## What changed after this was briefed

While 0.12.0 was being built the owner decided that Botbench's interface will be built on shadcn/ui on Tailwind, themed to the approved direction. A spike in Botbench is proving it and is to be recorded there as ADR 0012, which supersedes the choice of Base UI in Botbench's ADR 0011 and in this repository's proposed ADR 0001 (pull request 41, not merged). This plan was written before that and has to be read with it:

- **The hand-built component layer is expected to be retired screen by screen**, as each Botbench screen moves to shadcn. No `ds-` component gets further polish beyond what a change of the scale breaks. The tables below are then a record of what the direction needs, not a queue of `ds-` components to write: each item is built where the screen that needs it is built.
- **The design system's lasting role is the tokens, the theme and the product-specific composites.** The tokens and the Botbench theme of 0.12.0 are the source the shadcn theme is built from: the sizes, the type roles, the radii, the four surfaces, the interactive blue, the status colours, the contrast pairs and the three breakpoints. The composites are the things no general library has: the evidence row with its four kinds of claim, the decision surface and its five levels, the queue row, the track.
- **What stays to be decided** when ADR 0012 lands: which of the checks here (the contrast gate, the checker's rules, the closed class vocabulary) still apply to a screen built from shadcn components, and how the Tailwind preset and the rules files change for it. Nothing in 0.12.0 anticipates that.

## New components

| Component | What it is | Specification | Notes for the build |
|---|---|---|---|
| Evidence row | One claim on a review, in a grid of a label column, the claim and an optional quiet action. Four kinds told apart by shape as well as word: a check Botbench ran (filled label, a tick, a result tag), a model's review (the reviewer's avatar and name, a verdict in plain words), the agent's own statement (a quotation behind a rule), and what nothing verified (a dashed label in a dashed card). | 5.1 | The label is not a `badge` and not a `source-chip`, so it does not count toward `excess-badges`. A narrow variant for a column under 1280px and for a phone. The mark of the verification result (green only when a check passed on the commit under review, amber with a clock when stale, a dashed neutral circle when no checks are set up) belongs with it. |
| Decision surface | One surface with five levels: routine review, approval request, elevated risk, destructive, refused. Each has a signal that says whose move it is, the question, the thing decided on, one line of consequence and its buttons. | 5.2 | One component with a level, in place of `review-decision`, `approval` and `confirm-dialog` each drawing their own. The destructive level has a band and a 2px edge, the safe button first with the focus, and no primary action. The refused level has no approve action. No level has a key hint. "Always allow" is explained by a focusable disclosure, never a `title`. |
| The line that says why an action is not offered | An info mark and one sentence on the fill colour, where the missing button would have been. | 5.1, 5.7 | Small. Needs the scoped pair of secondary text on the fill only if it uses that colour; the board uses the main text colour. |
| Queue row | A row of Home's queue: a mark for the kind of ask, the title, a metadata line that starts with the kind in words, a waiting time and one outlined action. The first item is lifted into its own card with the view's one primary action. | 5.3 | The lifted card sits outside the list element, or `repeated-item-primary` reads it as a row. A one-line variant in which the metadata is cut first. Counted groups at twenty and fifty items. |
| Work table | The inventory: fixed columns so a cell can cut its text, compact rows, a state cell with the product's word and its mark. | 5.4 | A variant of `data-table` in a `data-ds-density="compact"` container may be enough; decide when it is built. The last row has no hairline under it. |
| Intent cards | Four choice cards above a large composer on New chat or task. | 5.7 | The specification reads this as a composition of `option-picker` and `composer`. Check first that `option-picker` draws the chosen card with a 2px edge in the interactive colour and a tick. |
| Track | Progress along a run or a task: Build, Checks, Your decision, across or top to bottom, each with a line of explanation. A finished step is a neutral tick; green is for a check that passed and a result that was accepted. | 5.7 | `stepper` has one "done" state today and needs two. |
| Sheet dock | From 768 to 1023px the decision sheet is docked at the foot of the pane, open and in the flow. On a phone the decision is a sticky action area above the tab bar: the pane surface, a hairline on top, the safe button first and the primary one wider. | 5.5, 5.6 | A pattern of the app shell, with the grab handle of the phone sheet. The pane surface is already a token. |

## Variants of existing components

These change a component that exists. 0.12.0 left them out because each changes how every app looks, beyond what the new scale and the theme's colours do, and none had been seen by the owner on a built page.

| Component | Change | Specification |
|---|---|---|
| `button` | A's default button is outlined (the control's edge, no fill); the system's is a tonal fill. Either a variant or a change of the default. A filled danger button, on the destructive confirmation only. A disabled button with no edge, the fill colour and secondary text. | 5.7 |
| `field`, `textarea`, `select`, `search-field` | Every input rests on the sunken surface. Today the control rests on the raised surface and is sunken only when read-only, so read-only needs another sign. | 5.7 |
| `badge` | An outline tag ("Passed on a1b2c3d", "Expected from the task"), and the signal: a mark and a word with no fill, outside the status set, at the head of a decision surface or a queue item only. Draw the outline as a border, not a shadow. | 3.17, 5.7 |
| `card` | A flat card (no fill, a hairline) and a dashed card. Whether the plain card is the default is the owner's open question 4 of the specification: 0.12.0 has `ds-card--borderless` for a decorative panel only. | 3.19, 5.7 |
| `badge`, the status set | "Ready for review" is drawn in the success tone today. In A it waits on a person, so it takes the approval tone, and green is kept for a check that passed and a result that was accepted. The set changes in `badge` and in the six components that draw it, together. | 2.1, 4.2 |
| `approval` | The elevated level tints the whole card and takes the approval tokens; today one line is tinted in the warning tokens. Under the Botbench theme the two pairs now hold the same values. | 5.2 |
| `confirm-dialog` | The band that says "Cannot be undone" and the 2px edge in the danger colour. | 5.2 |
| `segmented-control` | A track on the fill colour with no border, and a hairline outline on the chosen segment in light. 0.12.0 changed its radius only. | 5.7 |
| `sidebar-nav`, `tab-bar` | The count pill on a place, the 64px rail of icons from 1024 to 1279px, the open item named in full under the places. | 5.5, 5.7 |
| `sheet` | The grab handle. | 5.6 |
| `stat` | A's figure is 26px on a 32px line, which is not a step of the type scale: the value is the heading size today. | 2.2 |
| `composer` | A's composer text is 16px on a 24px line at every width. Today it is body text. The designer was to confirm it is meant to be larger. | 2.2 |

## Tokens and rules still open

- **The title on a narrow screen.** A draws the title of a view at 24px on a 30px line under 768px. 0.12.0 keeps it at 28px on a coarse pointer and does not make it smaller: a size keyed to the width of the screen needs a block in `tokens/tokens.css` that the build does not have.
- **Heading weights.** A draws 620, 650 and 680, which only a variable font can draw. 0.12.0 uses 600 for every heading, as the specification recommends until a heavier weight is checked on Windows and Android.
- **The colour of outside input.** `--ds-color-tainted` holds the peer pair under the Botbench theme, as the boards draw a peer's text. A run that read a GitHub issue is not drawn. Open question 1 of the specification.
- **The pane's hairline in dark** is 1.28:1 against the pane. Whether that is enough is the owner's to judge on a built page.
- **A hover value for the accent.** The designer supplied none. 0.12.0 uses `#9AC8FF` in dark and `#1B4C9C` in light; both hold 4.5:1 under the label of a primary button.

## Order

1. The variants of `button`, `field` and `badge`, since most new components are built from them.
2. The evidence row and the decision surface, with `review-decision`, `approval` and `confirm-dialog` moved onto the decision surface.
3. The queue row, the work table and the track.
4. The app shell: the rail, the sheet dock and the sticky action area, in the `app-shell` and `agent-run` patterns, at 768, 1024 and 1280px.

Each step is a release of its own: the component's folder with its examples and metadata, its row in `rules/choosing-components.md`, the tests, and reviewed screenshots.

# Progressive disclosure

Progressive disclosure shows the few things most readers need first and moves the rest one step away. The idea is described at https://www.nngroup.com/articles/progressive-disclosure. This file says how it applies here.

## How to apply it

- **Show the common path first.** The view opens on what most readers do most of the time. They finish the common task without opening anything.
- **Defaults before advanced.** Choose a sensible default for every setting. Put settings that few readers change in one advanced disclosure.
- **At most two levels.** A disclosure may hold one more disclosure. Content that would be a third level moves to a view of its own.
- **A summary says what is inside.** Write it as text, with a count or a result where there is one: "Ran 3 commands", "Environment, 12 variables". The reader decides whether to open it from the summary alone.
- **Keep the primary initial.** The first view holds everything needed to decide and act. The disclosed part holds evidence and detail.

## What must never be hidden

- A critical action, such as Delete, Decline or Stop. Mark it with `data-gw-critical`. It appears in the view, or the disclosure that holds it is open by default.
- An error, or the reason something is blocked.
- A status the reader must act on, such as an approval that waits.
- The one primary action of the view.
- Anything the reader needs in order to go on. A tooltip or a hover card holds supplementary information only.

## Patterns available

| Need | Pattern |
|---|---|
| Detail most readers can do without, such as a log or the environment | `disclosure` |
| A changed file that opens to its diff | A `list` row holding a `disclosure` in its row variant, with the path and the `diff` counts in the summary |
| The technical output behind a failed load | The detail part of `error-state` |
| The arguments of a tool call, or the output of its result | The details part of `message` |
| The full command or the reason behind a request | The details part of `approval` |
| The advanced settings of a view | One `disclosure` marked `data-gw-advanced` |
| A task that needs the whole screen for a moment, or detail beside a selected item | A sheet or an inspector. Neither is in the catalogue yet. Until one is, use a view of its own. |

## Anti-patterns

- Hiding the main action in a menu or a disclosure to make the view look clean.
- A summary that is only an icon, or says "More" or "Details" with no hint of what is inside.
- Several advanced sections in one view. Readers cannot tell which one holds the setting they want.
- A disclosure inside a disclosure inside a disclosure.
- Hiding information the reader needs to compare two items. They must open both and remember one.
- A disclosure around two lines of text. Show the text.
- Information that appears only on hover. It does not exist on a touch screen.

## What enforces each limit

| Limit | Checker rule |
|---|---|
| One primary action per view | `one-primary-action` |
| An action repeated for each item is never primary | `repeated-item-primary` |
| One advanced-settings disclosure per view | `one-advanced-disclosure` |
| Disclosures nest at most two levels | `disclosure-depth` |
| Every summary has text | `summary-without-text` |
| No critical action only inside collapsed content | `hidden-critical-action` |

The rest of this file is checked in review, with `review-rubric.md`.

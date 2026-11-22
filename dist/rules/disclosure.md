# Progressive disclosure

Progressive disclosure shows the few things most readers need first and moves the rest one step away. The idea is described at https://www.nngroup.com/articles/progressive-disclosure. This file says how it applies here.

## How to apply it

- **Show the common path first.** The view opens on what most readers do most of the time. They finish the common task without opening anything.
- **Defaults before advanced.** Choose a sensible default for every setting. Put settings that few readers change in one advanced disclosure.
- **At most two levels.** A disclosure may hold one more disclosure. Content that would be a third level moves to a view of its own.
- **A summary says what is inside.** Write it as text, with a count or a result where there is one: "Ran 3 commands", "Environment, 12 variables". The reader decides whether to open it from the summary alone.
- **Keep the primary initial.** The first view holds everything needed to decide and act. The disclosed part holds evidence and detail.

## What must never be hidden

- A critical action, such as Delete, Decline or Stop. Mark it with `data-ds-critical`. It appears in the view, or the disclosure that holds it is open by default.
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
| The arguments of a tool call and its output | The details part of `tool-call`, which is the content of a tool-call row of `message` |
| A stretch of consecutive steps in a long run | `step-group`, whose summary counts the steps by kind |
| The full command or the reason behind a request | The details part of `approval` |
| The advanced settings of a view | One `disclosure` marked `data-ds-advanced` |
| A task that needs the whole screen for a moment, or detail beside a selected item | A sheet or an inspector. Neither is in the catalogue yet. Until one is, use a view of its own. |

## Agent activity

A reader trusts an agent more when they can see what it did. So a run is never one spinner, and never a wall of output either: every step has a line that is always in view, and its detail is one press away. `agent-run` is the whole screen built this way.

| Where | What |
|---|---|
| Always in view | The agent's text, a question to the reader, and the final answer, as rows of `message`. One line for every step: the status in words, a plain summary and the time, from `tool-call`. For a stretch of steps, one line from `step-group` that counts them by kind. What the agent is doing right now, in `now-doing`, with Stop. |
| One level down | The steps of a finished stretch, behind the summary of their `step-group`. The arguments and output of a step that stands by itself in the transcript, behind its own summary. Reasoning, in `reasoning`. |
| Two levels down | The arguments and output of a step inside a group: the group, then the step's details. Reasoning the agent wrote between the steps of a group is a row of that group, beside the steps, never inside one. |
| Never a third level | Long output is cut to its last lines in a block that scrolls inside itself, with a button for the rest. It is not another disclosure. |

Three things are never behind a fold:

- **A failure.** A failed step says Failed and why on its own line, and its row is shown open. Its group says so in words in its summary, such as "1 command failed", and stays open. A count never hides it.
- **A pending approval.** Allow and Decline sit in the row, outside its details, each marked `data-ds-critical`. The group that holds the row is open and says "Awaiting your approval" in its summary, and `now-doing` names the wait and links to the row.
- **The final answer.** It is the last message row of the turn, outside every group.

The app opens and closes a group through the open attribute, and the rule is exact: open while any step in it is running or awaits approval, and when one has failed. Close a finished group only if the reader has not opened or closed it themselves. A retry is a new row. A failed row is never set back to running.

What is announced to a screen reader is narrower still: `activity-announcer` says when the run starts, needs approval, finishes, stops or fails, and nothing else speaks.

## Anti-patterns

- Hiding the main action in a menu or a disclosure to make the view look clean.
- A summary that is only an icon, or says "More" or "Details" with no hint of what is inside.
- Several advanced sections in one view. Readers cannot tell which one holds the setting they want.
- A disclosure inside a disclosure inside a disclosure.
- Hiding information the reader needs to compare two items. They must open both and remember one.
- A disclosure around two lines of text. Show the text.
- Information that appears only on hover. It does not exist on a touch screen.
- An agent's work behind one spinner, or a failure or a request for approval inside a closed group.

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

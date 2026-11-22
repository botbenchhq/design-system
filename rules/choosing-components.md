# Choosing a component

Find the need, then look the component up in `components.json` for its markup, variants and limits.

## Page structure

| Need | Use |
|---|---|
| The bar at the top of every screen, with the product name or a back link and the view's title | `app-header` |
| The title of a view, with an optional description and its one main action | `page-header` |
| Moving between the two to five main screens on a phone | `tab-bar`. At 768px and wider, list the same destinations in a sidebar with `gw-sidebar-layout`. |
| Arranging content | The layout primitives: `gw-stack`, `gw-cluster`, `gw-split`, `gw-grid`, `gw-sidebar-layout`, `gw-container` |

## Actions and navigation

| Need | Use |
|---|---|
| An action on the current view: start, save, confirm, cancel | `button`. One primary per view. |
| Going to another view or another site | `link`. The main action of a view that happens to navigate is a link with the primary button classes. |
| An action repeated on every row | `button` with secondary or quiet emphasis, never primary |

## Forms

| Need | Use |
|---|---|
| One line of text | `field` with a text input |
| Several lines of text saved with a form | `field` with `textarea` as its control |
| One choice from a short fixed list | `field` with `select` as its control |
| Sending the next prompt to an agent, or stopping a turn | `composer` |
| A value the reader copies and cannot change | `copy-field` |

## Messages and status

| Need | Use |
|---|---|
| A message about the app itself, true on every screen, such as a lost connection | `banner` |
| A message about what this view shows, or the lasting result of an action in it | `alert` |
| A mistake in one form control | The error message of `field` |
| The one status of an item, in a word or two | `badge` |
| A view or panel with nothing in it yet, or a search with no matches | `empty-state` |
| A view or panel whose data could not be loaded | `error-state` |
| Something is loading and how long it will take is not known | `spinner`. A working button sets `aria-busy` and draws its own. |

## Data

| Need | Use |
|---|---|
| A set of like things to scan and open: tasks, repositories, changed files | `list` |
| A command, a log, a program's output or an excerpt of a file | `code-block` |
| What changed in one file | `diff` |
| Detail most readers can do without | `disclosure`. See `disclosure.md`. |

## Agent surfaces

| Need | Use |
|---|---|
| One event in a transcript: a prompt, the agent's text, a tool call, its result, a denial, usage, the end of a turn | `message` |
| The agent is still producing output | `streaming`, as the last row of the transcript |
| A request that waits for the reader to allow or decline it | `approval` |
| How many approvals are waiting, visible from every screen | `pending-tray`, in the trailing slot of `app-header` |
| The reader's next prompt | `composer` |

## Telling similar components apart

- `banner` or `alert`: a banner is about the whole app and sits under the app header. An alert is about this view and sits in it.
- `empty-state` or `error-state`: empty means the load worked and found nothing. Error means the load failed. Never show empty when the load failed.
- `spinner` or `streaming`: a spinner stands in for content that has not arrived. Streaming sits beside content that is still arriving.
- `approval` or `message`: an approval still waits for an answer. Once answered, it is a message row in the transcript.
- `code-block` or `diff`: a diff shows a change. A code block shows text with no change.
- `app-header` or `page-header`: the app header is the app's bar. The page header is the view's title inside the page.
- `button` or `link`: a button changes something. A link goes somewhere.

## When nothing fits

1. Read the "when not to use" entries of the nearest components in `components.json`. They often name the right one.
2. Try composing catalogue components with layout primitives. Most screens need nothing else.
3. If a need is still unmet, build an app-local component. Give its classes the app's own prefix, never `gw-`. Style it with tokens only. Record it in the app's gaps file with a name, a reason, its classes and its files. The checker prints every declared gap on each run, so the gap is visible in review.
4. Do not restyle a catalogue component, add a modifier to it, or edit the vendored copy. If a component is wrong, change it in the design system's own repo.

Components this catalogue does not have yet, such as a table, a dialog, a menu, tabs, a toast, a card, a checkbox and a radio group, go through the same route until they arrive.

# Choosing a component

Find the need, then look the component up in `components.json` for its markup, variants and limits.

## Page structure

| Need | Use |
|---|---|
| The bar at the top of every screen, with the product name or a back link and the view's title | `app-header` |
| The title of a view, with an optional description and its one main action | `page-header` |
| Moving between the two to five main screens on a phone | `tab-bar`. At 768px and wider, list the same destinations in `sidebar-nav`. |
| The destinations of the app in a column beside the content, at 768px and wider | `sidebar-nav`, as the first child of `gw-sidebar-layout`. Below 768px it is not shown, so pair it with `tab-bar`. |
| Where this page sits under the pages above it | `breadcrumb` |
| One section of a view set apart from the rest | `card`. Never one inside another, and never a grid of identical ones. |
| The details of the item selected in the content beside it | `inspector` |
| Panels of one view, one shown at a time | `tabs` |
| Sections of which one is open at a time | `accordion` |
| Arranging content | The layout primitives: `gw-stack`, `gw-cluster`, `gw-split`, `gw-grid`, `gw-sidebar-layout`, `gw-container` |

## Actions and navigation

| Need | Use |
|---|---|
| An action on the current view: start, save, confirm, cancel | `button`. One primary per view. |
| Going to another view or another site | `link`. The main action of a view that happens to navigate is a link with the primary button classes. |
| An action repeated on every row | `button` with secondary or quiet emphasis, never primary |
| A familiar action where a text label has no room | `icon-button`, with an accessible name |
| The actions at the end of a form, or a joined row of closely related actions | `button-group` |
| Three or more actions on one thing, opened from a button | `menu` |
| The next or previous page of a long list | `pagination` |
| The rest of long text, or of a list cut short, shown in place | `show-more` |

## Forms

| Need | Use |
|---|---|
| One line of text | `field` with a text input |
| Several lines of text saved with a form | `field` with `textarea` as its control |
| One choice from a short fixed list | `field` with `select` as its control |
| One yes-or-no choice, or several independent choices, sent with a form | `checkbox` |
| Exactly one of a few options that need full labels or descriptions | `radio` |
| Exactly one of two to five options with one- or two-word labels | `segmented-control` |
| A setting that takes effect the moment it changes | `switch` |
| Finding items in a list by text | `search-field` |
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
| Content is loading and its shape is known | `skeleton` |
| How far a job with a known length has got | `progress` |
| How much of a limit is used | `usage-meter` |
| A brief report that something happened, which needs no answer | `toast` |
| An action was done at once and can be taken back | `undo-toast` |
| A neutral label for a category or a filter value | `tag` |
| A line of supplementary text about a control that already has a label | `tooltip` |

## Overlays

| Need | Use |
|---|---|
| One short task that must be finished or cancelled before going on | `dialog` |
| Asking before something is deleted or discarded | `confirm-dialog` |
| A longer form, filters or the details of an item, over the page | `sheet` |
| Short supplementary content or a small form beside the button that opens it | `popover` |
| A list of actions on one thing | `menu` |

## Data

| Need | Use |
|---|---|
| A set of like things to scan and open: tasks, repositories, changed files | `list` |
| A command, a log, a program's output or an excerpt of a file | `code-block` |
| What changed in one file | `diff` |
| Detail most readers can do without | `disclosure`. See `disclosure.md`. |
| Things compared across columns | `data-table` |
| The facts of one thing, as labels and values | `key-value` |
| One number with its comparison, period or scope | `stat` |
| Events in the order they happened | `timeline` |
| A person or an agent, named, with a small mark | `avatar` |

## Agent surfaces

| Need | Use |
|---|---|
| One event in a transcript: a prompt, the agent's text, a tool call, its result, a denial, usage, the end of a turn | `message` |
| The agent is still producing output | `streaming`, as the last row of the transcript |
| A request that waits for the reader to allow or decline it | `approval` |
| How many approvals are waiting, visible from every screen | `pending-tray`, in the trailing slot of `app-header` |
| The reader's next prompt | `composer` |
| Suggested next prompts under the composer or an empty transcript | `suggestion-chips` |
| A file or image attached to a prompt, which can be removed | `attachment-chip` |
| A link to where something came from: a file, a page or a commit | `source-chip` |
| The agent's reasoning or plan notes, closed by default | `reasoning` |
| One tool call outside a transcript, with its arguments and output behind disclosures | `tool-call` |
| A run or a task as one row of a `list` | `run-status` |
| What agents and people did, day by day | `activity-feed` |
| Rating an answer as helpful or not | `feedback` |

## Telling similar components apart

- `banner` or `alert`: a banner is about the whole app and sits under the app header. An alert is about this view and sits in it.
- `empty-state` or `error-state`: empty means the load worked and found nothing. Error means the load failed. Never show empty when the load failed.
- `spinner` or `streaming`: a spinner stands in for content that has not arrived. Streaming sits beside content that is still arriving.
- `approval` or `message`: an approval still waits for an answer. Once answered, it is a message row in the transcript.
- `code-block` or `diff`: a diff shows a change. A code block shows text with no change.
- `app-header` or `page-header`: the app header is the app's bar. The page header is the view's title inside the page.
- `button` or `link`: a button changes something. A link goes somewhere.
- `tabs` or `tab-bar`: tabs switch panels inside one view. The tab bar holds links between screens.
- `tab-bar` or `sidebar-nav`: the same destinations, the tab bar below 768px and the sidebar nav at 768px and wider.
- `tabs` or `accordion`: tabs when a panel is the main content of the view. An accordion when the sections are secondary and read down the page.
- `accordion` or `disclosure`: an accordion closes one section when another opens. Disclosures open and close alone.
- `disclosure`, `show-more` or `reasoning`: a disclosure names what it holds. Show more continues content already begun. Reasoning holds an agent's notes only.
- `dialog`, `confirm-dialog` or `sheet`: a dialog for one short task, a confirm dialog before something is lost, a sheet for a longer form or an item's details.
- `popover`, `menu` or `tooltip`: a menu is a list of actions. A popover is content or a small form. A tooltip is one line of text and holds no control.
- `toast`, `undo-toast` or `alert`: a toast leaves by itself, so it carries nothing the reader must act on. An undo toast offers Undo. An alert stays in the view.
- `checkbox` or `switch`: a checkbox is sent with a form. A switch takes effect at once.
- `radio`, `segmented-control` or `select`: a segmented control for two to five short labels, a radio group when the labels need room, a select for more than six options.
- `button-group` or `segmented-control`: a button group holds actions. A segmented control keeps a choice.
- `badge` or `tag`: a badge is a status with a tone. A tag is a neutral category.
- `spinner`, `skeleton` or `progress`: a skeleton when the shape of the content is known, progress when the length of the wait is known, a spinner when neither is.
- `progress` or `usage-meter`: progress moves towards done. A usage meter measures against a limit.
- `list` or `data-table`: a list for things to scan and open. A table when the reader compares them across columns.
- `key-value`, `stat` or `data-table`: key-value for several facts about one thing, a stat for one number that matters, a table for the same facts about many things.
- `timeline` or `activity-feed`: a timeline is the events of one thing, joined by a rail. An activity feed is what agents and people did across the app, grouped by day.
- `message` or `tool-call`: a message is a row of a transcript. A tool call summarises one call outside a transcript.
- `source-chip` or `attachment-chip`: a source chip is a link to where something came from. An attachment chip is a file the reader attached and can remove.
- `inspector` or `sheet`: an inspector sits beside the content it describes. A sheet covers the page until it is closed.

## When nothing fits

1. Read the "when not to use" entries of the nearest components in `components.json`. They often name the right one.
2. Try composing catalogue components with layout primitives. Most screens need nothing else.
3. If a need is still unmet, build an app-local component. Give its classes the app's own prefix, never `gw-`. Style it with tokens only. Record it in the app's gaps file with a name, a reason, its classes and its files. The checker prints every declared gap on each run, so the gap is visible in review.
4. Do not restyle a catalogue component, add a modifier to it, or edit the vendored copy. If a component is wrong, change it in the design system's own repo.

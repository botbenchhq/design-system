# Choosing a component

Find the need, then look the component up in `components.json` for its markup, variants and limits. `components-index.json` lists every component and pattern with its purpose and classes and nothing else, which is quicker to search when the need is not in the tables below.

For a whole screen, start from a page pattern. They are listed under "Page patterns" below, and in the patterns list of `components.json`.

## Page structure

| Need | Use |
|---|---|
| The bar at the top of every screen, with the product name or a back link and the view's title | `app-header` |
| The title of a view, with an optional description and its one main action | `page-header` |
| Moving between the two to five main screens on a phone | `tab-bar`. At 768px and wider, list the same destinations in `sidebar-nav`. |
| The destinations of the app in a column beside the content, at 768px and wider | `sidebar-nav`, as the first child of `ds-sidebar-layout`. Below 768px it is not shown, so pair it with `tab-bar`. |
| Where this page sits under the pages above it | `breadcrumb` |
| One section of a view set apart from the rest | `card`. Never one inside another, and never a grid of identical ones. |
| The details of the item selected in the content beside it | `inspector` |
| Panels of one view, one shown at a time | `tabs` |
| Sections of which one is open at a time | `accordion` |
| A list and the detail of its chosen row side by side, each scrolling by itself | `split-panel` |
| Where the reader is in three to five named steps that happen in a fixed order | `stepper` |
| The files of a repository or the outline of a document, with folders that open and close | `tree` |
| One setting on a settings page: its label, a one-line description and a single control | `settings-row` |
| Arranging content | The layout primitives: `ds-stack`, `ds-cluster`, `ds-split`, `ds-grid`, `ds-sidebar-layout`, `ds-container` |

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
| A main action with two or more variations of it behind a joined menu button | `split-button` |
| An option of the current view that is on or off and is not saved, such as Wrap lines | `toggle-button` |
| Three or more related controls for one view, grouped and labelled | `toolbar` |
| Copying a value the view already shows as text | `copy-button` |
| Three or more actions on one row of a list or table | `context-menu`, opened from a More actions button in the row |
| Any command of the app, run from the keyboard | `command-palette`. Every command is also a button or a menu item in its own view. |
| Naming a key or a shortcut in text | `kbd` |
| The actions on the rows the reader has selected | `selection-basket`, straight after the list it acts on |

## Forms

| Need | Use |
|---|---|
| One line of text | `field` with a text input |
| Several lines of text saved with a form | `field` with `textarea` as its control |
| One choice from a short fixed list | `field` with `select` as its control |
| One yes-or-no choice, or several independent choices, sent with a form | `checkbox` |
| Exactly one of a few options that need full labels or descriptions | `radio` |
| Exactly one of two to five options with one- or two-word labels | `segmented-control` |
| Exactly one of up to about ten options that each need a description or a state, such as a repository, an agent or a mode | `option-picker` |
| A setting that takes effect the moment it changes | `switch` |
| Finding items in a list by text | `search-field` |
| Sending the next prompt to an agent, or stopping a turn | `composer` |
| A value the reader copies and cannot change | `copy-field` |
| An amount the reader types or nudges, with its unit | `number-field` |
| A rough amount, or a scale of a few named steps | `slider` |
| A password or another secret the reader types and may want to check | `password-field` |
| A short one-time code from an authenticator app, a text message or an email | `otp-input` |
| One calendar day, or a day and a time, that the reader knows or picks | `date-field` |
| A day near today where the weekday matters | `calendar` |
| One choice from a list too long to scan, found by typing | `combobox` |
| One or several of a known set, with the options and a fact about each always in view | `listbox` |
| Several short values of one kind that the reader types | `tag-input` |
| One or more files from the reader's device, sent with a form | `file-upload` |
| Narrowing a list by a few known values the reader switches on and off | `filter-chips`, directly above the list |
| A short ordered list of one-line items the reader corrects in place | `editable-list` |
| Connecting an outside account by entering a short code on that account's site | `device-code` |

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
| What happened while the reader was away, as unread and earlier | `notification-list` |
| The results of the automated checks on a run | `check-list` |

## Overlays

| Need | Use |
|---|---|
| One short task that must be finished or cancelled before going on | `dialog` |
| Asking before something is deleted or discarded | `confirm-dialog` |
| A longer form, filters or the details of an item, over the page | `sheet` |
| Short supplementary content or a small form beside the button that opens it | `popover` |
| A list of actions on one thing | `menu` |
| A preview of a linked item beside its link, holding only facts the linked page also shows | `hover-card` |

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
| How a number moved over the last few runs or days, beside the number | `sparkline` |

## Agent surfaces

| Need | Use |
|---|---|
| One event in a transcript: the start of the session, a prompt, the agent's text while it arrives and once it has ended, a question to the reader, an answered permission request, a denial, an error, usage, the end of a turn | `message` |
| One tool call, from the request to its result: the status in words, a plain summary and the time on one line, with the arguments and output behind it | `tool-call`, as the content of a tool-call row of `message` in a transcript, or as a card by itself |
| Three or more consecutive steps of a long run, folded under one line that counts them | `step-group`, holding `tool-call` rows |
| What the agent is doing right now, with Stop, or what the run waits on the reader for | `now-doing`, under the transcript |
| New rows arrived while the reader was scrolled up | `jump-to-latest`, above the composer or the now-doing line |
| The stations of a run and the state of each: done, running, waiting, failed, not started | `run-timeline`, at the top of the run's screen |
| Telling a screen reader that a run started, needs approval, finished, stopped or failed | `activity-announcer`, once in the view |
| A note that work is going on, where there is no transcript and no Stop | `streaming` |
| A request that waits for the reader to allow or decline it, with its risk, where it runs and room for a note | `approval`. A request the reader can judge from one line is a `tool-call` row that awaits approval. |
| How many approvals are waiting, visible from every screen | `pending-tray`, in the trailing slot of `app-header` |
| The reader's next prompt | `composer` |
| Suggested next prompts under the composer or an empty transcript | `suggestion-chips` |
| A file or image attached to a prompt, which can be removed | `attachment-chip` |
| A link to where something came from: a file, a page or a commit | `source-chip` |
| The agent's reasoning or plan notes, closed by default | `reasoning` |
| A run or a task as one row of a `list` | `run-status` |
| What agents and people did, day by day, oldest first, or newest first for a log the reader pages back through | `activity-feed` |
| Rating an answer as helpful or not | `feedback` |

## Page patterns

A pattern is a whole screen composed from the components above, with a little layout of its own. Start a new screen from the nearest one: copy its example from the patterns list of `components.json` and replace the content.

| Screen | Start from |
|---|---|
| The frame of every signed-in screen: the app header with the pending tray, the sidebar nav and the tab bar, and the main column with its page header | `app-shell` |
| A long list or table the reader narrows by text and by two or three fixed properties | `filter-results` |
| A list the reader goes through item by item, acting on each, with a short detail beside it | `master-detail` |
| A task with more fields than fit one view, in three to five steps with a review before the final action | `multi-step-form` |
| The settings of one thing: the few most people change, one advanced disclosure and a danger area | `settings-page`. Write each setting as a `settings-row`. |
| The screen a signed-out reader meets, or another single task outside the app's navigation | `sign-in` |
| An address that matches no screen, or a screen whose item does not exist | `not-found` |
| The screen of one agent run: its stations, the transcript with step groups, the now-doing line and the composer, and the same run once it has finished | `agent-run`, inside the main column of `app-shell` |

- `app-shell` and the other patterns: the app shell is the frame, and another pattern goes inside its main column. The page header in the main column holds the view's one h1. Sign in and not found for a signed-out reader stand outside it.
- `master-detail` or `split-panel`: master and detail is a screen, and on a phone it shows the list or the detail, never both. A split panel is a region of a view whose two parts each scroll, stacked below 768px.
- `multi-step-form` or `stepper`: the pattern is the whole flow, one step to an address. The stepper is the component that shows where the reader is in it.
- `not-found`, `error-state` or `empty-state`: not found when the item does not exist, an error state when loading it failed, an empty state when a list or search has no results.
- `agent-run` or `master-detail`: an agent run is one run and its transcript. Master and detail is a list of runs with a short detail beside it.
- `filter-results` or `search-field`: a search field alone for text over one list. The pattern when there are other filters and the reader must see which are in force.

## Telling similar components apart

- `banner` or `alert`: a banner is about the whole app and sits under the app header. An alert is about this view and sits in it.
- `empty-state` or `error-state`: empty means the load worked and found nothing. Error means the load failed. Never show empty when the load failed.
- `approval` or `message`: an approval still waits for an answer. Once answered, it is a message row in the transcript.
- `code-block` or `diff`: a diff shows a change. A code block shows text with no change.
- `app-header` or `page-header`: the app header is the app's bar. The page header is the view's title inside the page, and it holds the view's one h1. The product name in the app header is a link, not a heading.
- `button` or `link`: a button changes something. A link goes somewhere.
- `tabs` or `tab-bar`: tabs switch panels inside one view. The tab bar holds links between screens.
- `tab-bar` or `sidebar-nav`: the same destinations, the tab bar below 768px and the sidebar nav at 768px and wider.
- `tabs` or `accordion`: tabs when a panel is the main content of the view. An accordion when the sections are secondary and read down the page.
- `accordion` or `disclosure`: an accordion closes one section when another opens. Disclosures open and close alone.
- `disclosure`, `show-more` or `reasoning`: a disclosure names what it holds. Show more continues content already begun. Reasoning holds an agent's notes only.
- `dialog`, `confirm-dialog` or `sheet`: a dialog for one short task, a confirm dialog before something is lost, a sheet for a longer form or an item's details.
- `popover`, `menu` or `tooltip`: a menu is a list of actions. A popover is content or a small form. A tooltip is one line of text and holds no control.
- `toast`, `undo-toast` or `alert`: a toast leaves by itself, so it carries nothing the reader must act on. An undo toast offers Undo. An alert stays in the view.
- `undo-toast` or `confirm-dialog`: an undo toast only when Undo puts everything back as it was. An action with no real undo, such as revoking a standing permission, takes a confirm dialog first.
- `checkbox` or `switch`: a checkbox is sent with a form. A switch takes effect at once.
- `radio`, `segmented-control` or `select`: a segmented control for two to five short labels, a radio group when the labels need room, a select for more than six options.
- `radio` or `option-picker`: a radio group when a label, with a line of help at most, names each option. An option picker when each option is a row with a description, a state such as Signed out, a warning, or a field shown under it, up to about ten. Beyond that, a select or a combobox.
- `button-group` or `segmented-control`: a button group holds actions. A segmented control keeps a choice.
- `badge` or `tag`: a badge is a status with a tone. A tag is a neutral category. For the state of a run, take the badge's icon and tone from its status set, listed in `content.md`.
- `spinner`, `skeleton` or `progress`: a skeleton when the shape of the content is known, progress when the length of the wait is known, a spinner when neither is.
- `progress` or `usage-meter`: progress moves towards done. A usage meter measures against a limit.
- `list` or `data-table`: a list for things to scan and open. A table when the reader compares them across columns.
- `key-value`, `stat` or `data-table`: key-value for several facts about one thing, a stat for one number that matters, a table for the same facts about many things.
- `timeline` or `activity-feed`: a timeline is the events of one thing, joined by a rail. An activity feed is what agents and people did across the app, grouped by day.
- `message` or `tool-call`: a message is a row of a transcript. A tool call is one call through its whole life, and in a transcript it is the content of a message row of the tool-call kind. There is no other way to show a tool call there.
- `tool-call` or `approval`: a tool-call row that awaits approval carries Allow and Decline for a request that one line and its arguments explain. An approval is a card for a request that needs its risk, its place and a note read first, and for a queue of requests.
- `step-group`, `disclosure` or `reasoning`: a step group folds steps and counts them. A disclosure names any other detail. Reasoning holds the agent's notes, and inside a group it is a row beside the steps.
- `now-doing`, `streaming` or `spinner`: the now-doing line says what the agent does at this moment and holds Stop, under a transcript. Streaming is a note that work goes on, anywhere else. A spinner stands in for content that has not arrived.
- `run-timeline`, `stepper` or `timeline`: a run timeline gives each station of a run its state in words and its time. A stepper is the reader's own place in a form, with links back. A timeline is what already happened, with times and who acted.
- `jump-to-latest` or `show-more`: jump to latest goes to the newest row of a transcript that kept growing. Show more reveals the rest of content already begun.
- `activity-announcer`, `toast` or `alert`: the activity announcer is heard and never seen. A toast and an alert are seen, and announce themselves.
- `source-chip` or `attachment-chip`: a source chip is a link to where something came from. An attachment chip is a file the reader attached and can remove.
- `inspector` or `sheet`: an inspector sits beside the content it describes. A sheet covers the page until it is closed.
- `select`, `combobox` or `listbox`: a select for a short fixed list, a combobox when typing is faster than scrolling, from about fifteen options up, a listbox when the options stay in view. A listbox and a combobox need script. A select does not.
- `combobox` or `search-field`: a combobox picks one value from options it holds. A search field filters a list already on the page.
- `tag-input`, `filter-chips` or `tag`: a tag input collects values the reader types. Filter chips switch known values on and off. Tags with remove buttons show the filters in force.
- `number-field` or `slider`: a number field for an exact amount, a slider when the feel matters more than the figure.
- `password-field`, `otp-input` or `copy-field`: a password field for a secret the reader types, a one-time-code input for a short code from elsewhere, a copy field for a secret the app made.
- `date-field` or `calendar`: a date field is the native date input, for a date the reader knows. A calendar is for a day near today where the weekday matters.
- `copy-button` or `copy-field`: a copy button sits beside a value the view already shows. A copy field is for when taking the value away is the point of the view.
- `device-code` or `otp-input`: a device code is a code the app shows for the reader to enter elsewhere. A one-time-code input takes a code the reader brings.
- `button`, `split-button` or `menu`: a split button when one action is right most of the time and the rest are variations of it. A menu behind a labelled button when the actions are not variations of one another.
- `toggle-button`, `switch` or `segmented-control`: a toggle button for a view option that is not saved, a switch for a stored setting, a segmented control for one of several views.
- `toolbar` or `button-group`: a toolbar holds three or more controls for one view. A button group holds the actions at the end of a form.
- `menu`, `context-menu` or `command-palette`: a menu for the actions on one thing, a context menu for the actions on a row, the command palette for every command of the app.
- `tooltip`, `hover-card` or `popover`: a tooltip is one line about a control. A hover card previews a linked item and may never open, so it holds nothing the reader needs. A popover is opened on purpose from a button.
- `tree`, `list` or `sidebar-nav`: a tree for a hierarchy the reader opens folder by folder, a list for items with none, the sidebar nav for the app's destinations.
- `split-panel` or `inspector`: a split panel when the reader reads each item at length and both regions scroll. An inspector for a few facts beside content that scrolls with the page.
- `stepper`, `progress` or `timeline`: a stepper for a few named steps in a fixed order, progress when the steps have no names, a timeline for what already happened, with times.
- `settings-row`, `field` or `key-value`: a settings row for a setting that takes effect by itself, fields for values sent together with one button, key-value for facts the reader cannot change.
- `editable-list`, `list` or `checkbox`: an editable list when the reader corrects the items, a list when they only read or open them, checkboxes for tasks to tick off.
- `selection-basket` or `toolbar`: a selection basket appears only while rows are selected and acts on them. A toolbar acts on the view.
- `notification-list`, `activity-feed` or `toast`: a notification list has read and unread entries about things that changed while the reader was away. An activity feed is the record of what was done. A toast is a passing report on the current view.
- `check-list`, `timeline` or `badge`: a check list for the result of each automated check, a timeline for the steps in the order they happened, a badge for one overall status.
- `sparkline` or `stat`: a stat is one number with its comparison. A sparkline beside it shows how the number moved.
- `kbd` or `code-block`: a kbd names a key the reader presses. Code is text the reader types out or reads.

## When nothing fits

1. Read the "when not to use" entries of the nearest components in `components.json`. They often name the right one.
2. Try composing catalogue components with layout primitives. Most screens need nothing else.
3. If a need is still unmet, build an app-local component. Give its classes the app's own prefix, never `ds-`. Style it with tokens only. Record it in the app's gaps file with a name, a reason, its classes and its files. The checker prints every declared gap on each run, so the gap is visible in review.
4. Do not restyle a catalogue component, add a modifier to it, or edit the vendored copy. If a component is wrong, change it in the design system's own repo.

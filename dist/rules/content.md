# Content

How to write the words in an interface.

## Rules

- **Sentence case everywhere.** Capitalise the first word and proper names: "New task", "Base branch", "Delete workspace". No title case and no capitals for emphasis.
- **A label is a verb and what it acts on.** "Start task", "Copy branch name", "Delete workspace". A lone "Submit", "OK" or "Confirm" does not say what will happen. "Cancel" and "Close" may stand alone.
- **An error says what happened and what to do.** "The repository could not be cloned. Check that the deploy key has read access, then try again." Do not write "Something went wrong" or "Invalid input", and do not blame the reader.
- **No filler and no marketing phrases.** Cut "simply", "just", "easily", "seamless", "powerful", "Welcome to" and "Oops". If a sentence can go without loss, it goes.
- **Real content, never placeholder text.** Write the examples a real screen would hold: a real-looking branch name, a real task title. No lorem ipsum, no "Item 1", no "John Doe".
- **A number comes with its unit and its context.** "3 of 12 tests failed", "412 ms", "$0.84 for this run". A bare "3" or "84%" needs a label that says of what.
- **Status is written in words.** "Working", "Needs input", "Check failed". A colour or an icon supports the word and never replaces it.

## The status set

The states of a run each have one icon and one tone, listed in the `statusSet` of the `badge` entry in `components.json`. The words are the app's, so "Building" may stand for Working, but the icon and the tone are the state's, in every component that shows it: `badge`, `run-status`, `run-timeline`, `check-list` and `tool-call`.

| State | Icon | Tone |
|---|---|---|
| Queued | circle-dashed | neutral |
| Working | loader | info |
| Checking | search | info |
| Needs input | circle-pause | approval |
| Ready for review | eye | success |
| Stopped | circle-stop | blocked |
| Cancelled | circle-slash | neutral |
| Check passed | circle-check | success |
| Check failed | circle-alert | danger |
| Failed | circle-x | danger |
| Done | check | success |
| Accepted | thumbs-up | success |
| Rejected | x | neutral |

- **One state, one icon.** Never show a state with another icon or another tone, and never give two states the same pair.
- **Pick the state, then the words.** Waiting on the reader's answer is Needs input, whether the answer is an approval, a reply or a decision. Ended early and able to resume is Stopped. Will not go on is Cancelled.
- **A timeout is not a failure.** A check or a tool call that ran out of time takes a clock and the warning tone, with words that name the limit: "Timed out after 10 min".

## Smaller points

- A placeholder is not a label. Every control has a visible label.
- Name a thing the same way everywhere. If it is a "task" on one screen, it is not a "job" on the next.
- Write times so they cannot be misread: "2 minutes ago", "14 March, 09:30".
- An empty view says what is missing and how to add the first one. It does not welcome or promote.
- A confirmation names the thing: "Delete the workspace api-refactor?" The confirming button repeats the verb: "Delete workspace".
- Text for assistive technology that is not drawn, such as the label of an icon-only control, goes in an element with the `ds-visually-hidden` class.

## Step summaries

The line for a step an agent took, in `tool-call`, and the line for a group of steps, in `step-group`. The app writes these words, so they can change without the stylesheet changing.

- **A plain verb in the past tense for what was done.** "Ran", "Edited", "Read", "Searched for", "Opened". Not the tool's name, and not "Executed Bash" or "Called Edit".
- **The object in mono.** The command, the file or the pattern goes in a code element: "Ran `npm test`", "Edited `src/auth/session.ts` +12 −1", "Searched for `startRefreshTimer`". Give a file its lines added and removed, joined by a no-break space so the two counts stay on one line.
- **Reads count as one.** Several files read or searched in a row are one line: "Explored 5 files in `src/auth`".
- **The plain verb before it runs, and when it never ran.** A step that waits, was declined or was cancelled did not happen, so it is not in the past tense: "Run `npm install`".
- **The status word is separate, and the system's.** Preparing, Awaiting approval, Running, Succeeded, Failed, Declined, Timed out, Cancelled. It comes first on the line. After the word Running, write the command alone, not "Running Run".
- **A group counts by kind, in the same verbs.** "Ran 4 commands, edited 2 files", "Explored 5 files, edited 1 file, ran 1 command". Largest or first kind first, a comma between, no "and 3 more". While steps are still arriving, end with "so far".
- **A failure or a wait is said in words, after the counts.** "1 command failed", "Awaiting your approval". Never "5 of 6 done".
- **A duration has a unit and two parts at most.** "380 ms", "2.4 s", "42 s", "4 min 12 s", "1 h 4 min". The total once the step has ended, the time so far while it runs.
- **What the agent is doing now is a present participle.** "Running `npm test` · 42 s", "Editing `src/auth/session.ts`", "Writing a reply". A wait names what is waited for: "Waiting for your approval to run `npm install`".
- **A reason is one sentence.** Why the agent made the call, or why it failed or did not run: "The command exited with code 1. 1 of 30 tests failed." Say what happened, not "Something went wrong".

## What the checker sees

The checker catches an emoji in interface text and the same stock phrase on three controls in one view. Everything else on this page is checked in review, with `review-rubric.md`.

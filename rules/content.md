# Content

How to write the words in an interface.

## Rules

- **Sentence case everywhere.** Capitalise the first word and proper names: "New task", "Base branch", "Delete workspace". No title case and no capitals for emphasis.
- **A label is a verb and what it acts on.** "Start task", "Copy branch name", "Delete workspace". A lone "Submit", "OK" or "Confirm" does not say what will happen. "Cancel" and "Close" may stand alone.
- **An error says what happened and what to do.** "The repository could not be cloned. Check that the deploy key has read access, then try again." Do not write "Something went wrong" or "Invalid input", and do not blame the reader.
- **No filler and no marketing phrases.** Cut "simply", "just", "easily", "seamless", "powerful", "Welcome to" and "Oops". If a sentence can go without loss, it goes.
- **Real content, never placeholder text.** Write the examples a real screen would hold: a real-looking branch name, a real task title. No lorem ipsum, no "Item 1", no "John Doe".
- **A number comes with its unit and its context.** "3 of 12 tests failed", "412 ms", "$0.84 for this run". A bare "3" or "84%" needs a label that says of what.
- **Status is written in words.** "Building", "Awaiting decision", "Blocked by a failed check". A colour or an icon supports the word and never replaces it.

## Smaller points

- A placeholder is not a label. Every control has a visible label.
- Name a thing the same way everywhere. If it is a "task" on one screen, it is not a "job" on the next.
- Write times so they cannot be misread: "2 minutes ago", "14 March, 09:30".
- An empty view says what is missing and how to add the first one. It does not welcome or promote.
- A confirmation names the thing: "Delete the workspace api-refactor?" The confirming button repeats the verb: "Delete workspace".
- Text for assistive technology that is not drawn, such as the label of an icon-only control, goes in an element with the `gw-visually-hidden` class.

## What the checker sees

The checker catches an emoji in interface text and the same stock phrase on three controls in one view. Everything else on this page is checked in review, with `review-rubric.md`.

# Blind-build trial, 22 November 2026

Two fresh agents each built three screens from `test/trial/brief.md`. Each had a scratch app holding only a synced copy of version 0.3.0 at `vendor/groundwork/`, and was told to learn the system from that folder alone. Neither saw this repository, its plan or its tests.

## Result

Both runs pass. Every screen passes the static scan and the rendered rules with zero waivers and zero declared gaps, and uses catalogue components only.

| Check | Run A | Run B |
|---|---|---|
| Model | Claude Sonnet | Claude Haiku |
| Static scan, final | 0 findings, 0 waivers, 0 gaps, 3 files | 0 findings, 0 waivers, 0 gaps, 3 files |
| Static scan, first attempt | 0 findings | 0 findings |
| Rendered rules, 3 screens at 390px and 1280px | 0 findings | 0 findings |
| axe, 3 screens at 390px and 1280px | 0 violations | 0 violations |
| Horizontal page scroll | none | none |
| Requests that failed | none | none |
| Inline styles, app-local classes | none | none |
| Primary buttons on the approval queue | none, as the approval guidance asks | none |

The static scan was rerun here on both outputs, and the rendered rules and axe were run here in Chrome; the agents had no browser. Run B also wrote a throwaway page with deliberate faults and confirmed the scan reports them, then deleted it.

Both runs used Claude models. A run with another vendor's CLI was not made, because it would send this repository's files to that provider.

## What each run built

- **Approval queue.** Both put three approval cards in a list, each with its command, directory, task and reason, a text-summary disclosure for the full request, and Allow and Decline at secondary emphasis. Both marked one request as elevated risk in words.
- **Settings.** Both started from the settings page pattern: the common settings first, one advanced disclosure, a separate danger area, and a confirm dialog for disconnecting. Both chose save on change, so neither has a save button.
- **Runs board.** Both used three labelled lists of run rows with a status badge in words.

Screens and screenshots are in `test/trial/results/run-a/` and `run-b/`.

## What the agents found missing or unclear

- Example paths are written for the gallery, so icon links had to be repointed at the vendored sprite. `rules/core.md` now says so.
- No example shows a whole page shell: header, sidebar layout, main column and tab bar together.
- The pending tray's place in the app header is described but not shown in an example.
- Neither the app header nor the page header says which one carries the view's `h1` when both are present. Run B first wrote two and fixed it by hand.
- Approval examples use one heading level, and the guidance does not say what a queue should use.
- The dialog examples are drawn open. How an app opens a closed dialog is in the accessibility notes, not in an example.
- `components.json` is 1.1 MB. Finding one component took several reads; a short index of names, purposes and classes would be faster.
- The checker has no rule for a duplicate `h1` or a dead link, and its summary does not say how many rules ran.
- Neither run designed empty, loading or error states for the queue or the board. The review rubric asks for them; nothing fails without them.

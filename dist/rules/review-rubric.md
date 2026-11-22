# Review rubric

The checker cannot see what this file covers. A reviewer answers each question with yes or no and gives the evidence: the screen, the element and the text in question. A "no" is a finding to fix before the work is done.

Review each screen at 390px and at 1280px, in light and in dark.

## Copy

1. Is every label specific to this product and this task? Evidence: quote any label that would fit an unrelated app unchanged.
2. Does every action label say what will happen, as a verb and what it acts on?
3. Does every error message say what happened and what to do next?
4. Is all copy in sentence case, with no filler and no marketing phrases?
5. Is the content real, with no placeholder text and no invented sample names? See `content.md`.

## States

6. Is the empty state designed, saying what is missing and how to add the first item?
7. Is the loading state designed, and does it avoid a flash for a load of under a second?
8. Is the error state designed, with a way to try again? Does it differ from the empty state?
9. Do the long cases hold: a long title, a long path, a list of two hundred rows, a missing optional value?

## Density and hierarchy

10. Does the density suit the task: dense for boards, transcripts and diffs, with more room for forms and decisions?
11. Is it obvious within a few seconds what the view is and what matters most in it? Evidence: name the first three things the eye lands on.
12. Is there one clear primary action, and is it the thing most readers came to do? A view with no action needs none.
13. Is anything shown that could be disclosed later? Evidence: name each element most readers would not miss on first view. See `disclosure.md`.
14. Is anything hidden that a reader needs in order to decide or act?

## Signals

15. Does every status, error and required marker carry words or an icon as well as colour?
16. Is every piece of information reachable without hover?
17. Does the shadow token appear only on overlays?
18. Does the navigation list only screens that exist?

## Fit with the system

19. Is each component used for the purpose `components.json` gives it, and not for one of its "when not to use" cases?
20. Is every declared gap a real gap? Evidence: for each one, name the nearest catalogue component and say why it does not fit.
21. Does every waiver give a reason that still holds?
22. Would this screen sit beside the app's other screens without looking like a different product?

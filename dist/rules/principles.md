# Principles

This system follows Apple's Human Interface Guidelines for hierarchy, harmony and consistency: https://developer.apple.com/design/human-interface-guidelines

Read the guidelines there. This file records only what this system adds to them or decides for itself.

## What this system decides

- **The interface defers to the content.** A run, a transcript, a diff or a status is what the reader came for. Chrome stays minimal. Nothing is on screen for decoration.
- **One primary action per view.** Hierarchy starts with one thing that is clearly the main thing to do. Everything else has secondary or quiet emphasis.
- **Every pointer target is at least 44px in both directions.** A control drawn smaller reaches 44px through a padded hit area. A link inside running text is the one exception.
- **Use the behaviour the platform already has.** A native button, input, select, details element, dialog and popover come with keyboard handling, focus and accessibility. Use them before inventing a control. Do not build a custom scroll, a custom select or a custom focus ring.
- **Consistency comes from the catalogue.** The same need gets the same component on every screen of every app. A screen that needs something new declares it as a gap. It does not restyle an existing component.
- **Elevation is a background shift or a 1px border.** Only an overlay, such as a menu, a popover, a dialog or a toast, takes the shadow token.
- **Density suits the task.** Boards, transcripts and diffs are dense. Forms and decisions have room around them.

## Structure, not Apple's look

The guidelines govern structure and behaviour here. They do not govern appearance.

- The typeface is IBM Plex Sans, with IBM Plex Mono for code. Do not use San Francisco or any other system font.
- Do not use Liquid Glass, translucency, blur or vibrancy.
- Do not copy the look of an Apple control: no replica of the iOS switch, segmented control, navigation bar or sheet. Use the catalogue component for the need.
- Colours, radii and spacing come from the tokens, not from Apple's palettes or metrics.

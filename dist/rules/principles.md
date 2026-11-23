# Principles

This system follows Apple's Human Interface Guidelines for hierarchy, harmony and consistency: https://developer.apple.com/design/human-interface-guidelines

Read the guidelines there. This file records only what this system adds to them or decides for itself.

## What this system decides

- **The interface defers to the content.** A run, a transcript, a diff or a status is what the reader came for. Chrome stays minimal. Nothing is on screen for decoration.
- **One primary action per view.** Hierarchy starts with one thing that is clearly the main thing to do. Everything else has secondary or quiet emphasis.
- **A pointer target is at least 44px in both directions on a coarse pointer, such as a finger, and at least 24px on a fine one, such as a mouse.** The system does this by itself: a control of default size is 36px tall on a fine pointer and 44px on a coarse one, and a control drawn smaller, such as a small button, reaches 44px on a coarse pointer through a padded hit area. A link inside running text is the one exception.
- **Use the behaviour the platform already has.** A native button, input, select, details element, dialog and popover come with keyboard handling, focus and accessibility. Use them before inventing a control. Do not build a custom scroll, a custom select or a custom focus ring.
- **Consistency comes from the catalogue.** The same need gets the same component on every screen of every app. A screen that needs something new declares it as a gap. It does not restyle an existing component.
- **Elevation is a background shift or a 1px border.** Only an overlay, such as a menu, a popover, a dialog or a toast, takes the shadow token.
- **Density suits the task.** Boards, transcripts and diffs are dense. Forms and decisions have room around them. `data-ds-density` on a container sets how tall the controls and rows inside it are: compact is 28px controls and 32px rows, comfortable, the default, 36px for both, and touch 44px for both. On a coarse pointer everything is the touch density, whatever the attribute says, so never set a height to undo it.

## Structure, not Apple's look

The guidelines govern structure and behaviour here. They do not govern appearance.

- The typeface is the theme's: IBM Plex Sans with IBM Plex Mono by default, the platform's own font under the Botbench theme. Use the font tokens and never name a typeface in an app.
- Do not use Liquid Glass, translucency, blur or vibrancy.
- Do not copy the look of an Apple control: no replica of the iOS switch, segmented control, navigation bar or sheet. Use the catalogue component for the need.
- Colours, radii and spacing come from the tokens, not from Apple's palettes or metrics.

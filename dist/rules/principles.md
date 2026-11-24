# Principles

This system follows Apple's Human Interface Guidelines for hierarchy, harmony and consistency: https://developer.apple.com/design/human-interface-guidelines

Read the guidelines there. This file records only what this system adds to them or decides for itself.

## What this system decides

- **The interface defers to the content.** A run, a transcript, a diff or a status is what the reader came for. Chrome stays minimal. Nothing is on screen for decoration.
- **One primary action per view.** Hierarchy starts with one thing that is clearly the main thing to do. Everything else has secondary or quiet emphasis.
- **One interactive colour.** It is used for the primary action, focus, selection and active work, and never for a status that is not "working". A theme may give the accent, the focus ring and the working status one value, as the Botbench theme does, or part them; a screen treats them as one colour either way and spends it on nothing else.
- **The 44px rule is for coarse pointers.** A pointer target is at least 44px in both directions on a coarse pointer, such as a finger, and at least 24px on a fine one, such as a mouse. The system does this by itself: a control of default size is 40px tall on a fine pointer and 44px on a coarse one, and a control drawn smaller, such as the 32px small button, reaches 44px on a coarse pointer through a padded hit area. A link inside running text is the one exception.
- **No text under 12px.** Body text is 15px, the label of a control and a row 14px, metadata 13px, and a tag, a count or a table head 12px, the smallest size there is. The label over a group is in sentence case, never in capitals or tracked out.
- **Use the behaviour the platform already has.** A native button, input, select, details element, dialog and popover come with keyboard handling, focus and accessibility. Use them before inventing a control. Do not build a custom scroll, a custom select or a custom focus ring.
- **Consistency comes from the catalogue.** The same need gets the same component on every screen of every app. A screen that needs something new declares it as a gap. It does not restyle an existing component.
- **Elevation is a background shift or a 1px border.** Only an overlay, such as a menu, a popover, a dialog or a toast, takes the shadow token.
- **Density suits the task.** Lists, tables and an inventory of work are dense. Forms and decisions have room around them. By default a control and a row are 40px tall with 15px body text. `data-ds-density="compact"` on a container, the attribute's one value, makes the controls inside it 32px, the rows 36px and body text 13px. On a coarse pointer every control and row is 44px and the type is larger, whatever the attribute says, so never set a height or a size to undo it.
- **Three breakpoints.** A layout changes at 768px, where the phone layout ends, at 1024px, where a second pane fits, and at 1280px, where a third does. A media query writes one of those numbers and no other. A component changes at 768px alone; the panes of a screen are a pattern's or the app shell's to arrange. A container query may use any width, since it measures the room a part has and not the screen. Judge each layout by the width it leaves the main column, not by the number.
- **Amber is a small signal.** The approval tone marks what waits on a person: a mark, a badge, a count. It is never a band of background.

## Structure, not Apple's look

The guidelines govern structure and behaviour here. They do not govern appearance.

- The typefaces are the theme's, set through the two font tokens: IBM Plex Sans with IBM Plex Mono by default, the platform's own font under the Botbench theme. An app does not set a font family outside them.
- Do not use Liquid Glass, translucency, blur or vibrancy.
- Do not copy the look of an Apple control: no replica of the iOS switch, segmented control, navigation bar or sheet. Use the catalogue component for the need.
- Colours, radii and spacing come from the tokens, not from Apple's palettes or metrics.

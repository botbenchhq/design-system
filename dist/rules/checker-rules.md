# Checker rules

Every rule the checker can report, what it means and how to fix it. The finding itself names the file and line, and often the nearest token or class.

The static scan reads CSS, HTML, JSX, TSX and class names in script. The structural rules read a static HTML file as a tree, and the rendered page through `gwCheckDom()`.

No setting switches a rule off. The one exception to a rule is an inline waiver: a comment holding `gw-waive <rule-id>: <reason>`, on the line of the finding or the line before it. Every run prints each waiver.

## Tokens and properties, in CSS

| Rule | Meaning | Fix |
|---|---|---|
| `raw-color` | A colour is written by hand, or comes from a custom property that is not a system token. | Use a colour token. The finding names the nearest one. |
| `raw-font-family` | A font is named outside the tokens. | Use the font token for interface text or the one for mono text. |
| `raw-shadow` | A shadow is written by hand. | Use the overlay shadow token on an overlay, and no shadow elsewhere. |
| `raw-z-index` | A layer number is not on the layering scale. | Use a layering token. |
| `raw-duration` | A transition or animation time is not a duration token. | Use a duration token. |
| `off-scale-spacing` | A margin, padding, gap or inset is not on the spacing scale. | Use a spacing token. The finding names the nearest one. |
| `off-scale-font-size` | A font size is not on the type scale. | Use a type size token. |
| `off-scale-radius` | A corner radius is not on the radius scale. | Use a radius token. |
| `off-breakpoint` | A media query uses a width other than the one breakpoint. | Write the query at 768px. Style the compact layout first. |
| `banned-gradient` | A gradient is used. | Use a flat colour token. |
| `banned-backdrop-filter` | A backdrop filter is used. | Use an opaque surface colour token. |
| `banned-blur` | A blur filter is used. | Remove the blur. |
| `banned-background-clip-text` | Text is clipped to a background. | Set the text colour with a colour token. |
| `banned-blend-mode` | A blend mode is used. | Remove the blend mode. |

## Classes and markup

| Rule | Meaning | Fix |
|---|---|---|
| `unknown-class` | A class with the system prefix is not in the catalogue. | Use a class listed in `components.json`. The finding suggests the nearest name. |
| `dynamic-class` | A system class name is built at run time, so it cannot be checked. | Write each class name in full, for example in a lookup table from value to class. |
| `visual-utility` | A colour, border, radius, shadow or type utility is used in a screen. | Use a catalogue component, or declare an app-local component in the gaps file. |
| `unlisted-class` | A class is neither a system class, a declared app-local class nor an allowed utility. | Use a catalogue component, or declare an app-local component in the gaps file. |
| `unlisted-variant` | A utility carries a variant, such as a hover or dark variant, that screens may not use. | Remove the variant. Screens may use the breakpoint variant only. States belong to components. |
| `off-scale-utility` | A spacing or sizing utility uses a value that is not on the scale. | Use a key the finding lists. |
| `arbitrary-value` | A utility holds an arbitrary value in square brackets. | Use a utility on the token scale, or a catalogue component. |
| `undeclared-app-class` | A class with the app's prefix is not listed in the gaps file. | Use a catalogue component, or record the gap in the gaps file. |
| `inline-style` | An element has an inline style, or script sets one. | Use a component or a class. Script may set a custom property that starts with the system prefix, and nothing else. |

## Structure and disclosure

| Rule | Meaning | Fix |
|---|---|---|
| `one-primary-action` | A view has more than one primary button outside repeated items. | Keep one primary button in the view and give the others secondary emphasis. |
| `repeated-item-primary` | A primary button sits inside a list row, a table row or another repeated item. | Give an action repeated for each item secondary emphasis. |
| `one-advanced-disclosure` | A view has more than one advanced-settings disclosure. | Put the advanced settings of a view in one disclosure. |
| `disclosure-depth` | A disclosure is nested three levels deep. | Nest at most two levels. Move the deeper content to its own view. |
| `summary-without-text` | A summary has no text. | Write what the disclosure holds as text in its summary. |
| `hidden-critical-action` | A critical action is reachable only inside collapsed content. | Show the action outside the collapsed content as well, or open the disclosure by default. |

## Visual tells and copy

| Rule | Meaning | Fix |
|---|---|---|
| `nested-cards` | A card is inside another card. | Use one card. Separate what is inside it with a heading or a divider. |
| `identical-card-grid` | Three or more sibling cards have the same structure. | Use a list or a table for uniform items, or vary the layout by what each item holds. |
| `excess-badges` | A view shows eight or more badges outside list rows. | Keep a badge for a status the reader must act on, and write the rest as plain text. |
| `centred-body-text` | Long text is centred across more than the reading column. | Align body text to the start. Centre only a short line. |
| `emoji-as-icon` | Interface text contains an emoji. | Use an icon from the icon set, or remove it. Mark content a person wrote with `data-gw-content`. |
| `stock-phrase` | The same stock phrase is on three or more controls in a view. | Name what each control does, in the words of the task. |

## The run itself

No waiver covers these.

| Rule | Meaning | Fix |
|---|---|---|
| `vendored-file-changed` | A file in the vendored copy is missing or does not match its recorded hash. The run stops here. | Restore the copy by syncing again. Change the system in its own repo. |
| `parse-error` | A file could not be read, so nothing in it, or nothing after that point, was checked. | Fix the syntax. |
| `waiver-without-reason` | A waiver names no rule or gives no reason, so it is ignored. | Write it as `gw-waive <rule-id>: <reason>`. |
| `unused-waiver` | A waiver matches no finding on its line or the next. | Remove the waiver. |

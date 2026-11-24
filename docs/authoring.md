# Authoring a component

This is the contract every component follows. Every folder in `components/` is built to it, and so is every page pattern in `patterns/`. Copy `components/button/` or `components/field/` to start.

A component is one folder, `components/<name>/`, holding three hand-written files:

| File | Holds |
|---|---|
| `<name>.css` | The styles. |
| `examples.html` | Labelled example markup, including what not to do. |
| `meta.json` | What the component is for and what it offers. |

`<name>` is lower case with hyphens, and is the same in the folder name, the stylesheet name, the class prefix and `meta.json`.

Nothing else needs editing. `npm run build` reads every folder and adds the component to `dist/design-system.css`, `dist/components.json`, `dist/components-index.json`, the `classes` list in `dist/manifest.json` and the gallery in `dist/gallery/`. The build fails, naming the folder, when a folder breaks a rule on this page that it can check.

## What a component may be

- It works as class names on plain HTML. It needs no framework and no script of its own.
- Behaviour comes from native elements first: `<button>`, `<input>`, `<dialog>`, `<details>`, the Popover API.
- It has a purpose other than decoration. Nothing exists for motion, glow, gradient or texture.
- Elevation is a background shift or a 1px border. Only an overlay (menu, popover, dialog, toast) takes the shadow token.

## The stylesheet

```css
@layer ds.components {
  .ds-card { … }
  .ds-card__title { … }
  .ds-card--sunken { … }
}
```

- Every rule is inside `@layer ds.components`.
- Class names are `ds-<name>` for the block, `ds-<name>__part` for an element inside it and `ds-<name>--variant` for a variant or size. A stylesheet defines no class outside its own name.
- One element may carry the classes of two components when one composes the other. A textarea and a select are the control of a field, so each sits on the same element as `ds-field__control` and adds to it. The build bundles component stylesheets in alphabetical order of folder name, and such a pair relies on that order: the component that adds must sort after the one it builds on.
- Values are tokens: `var(--ds-…)` for every colour, font, type size, line height, tracking, spacing, radius, shadow, duration and layer. Do not write a raw colour or length where a token exists, and do not declare a custom property. A calculation on a token is allowed, such as `calc(var(--ds-border-width) * 2)`, but not to reach a value the scale already has: write `var(--ds-space-lg-xl)`, not `calc(var(--ds-space-lg) + var(--ds-space-xs))`.
- No gradient, blur, backdrop filter, blend mode or text clipped to a background.
- The only width in a component's media query is 768px, written as the number: `@media (min-width: 768px)`. Style the compact layout first. The system has two more breakpoints, 1024px and 1280px, where a second and a third pane fit: they are for the layout of a screen, so only a page pattern uses them, and a test fails on a component that does. A container query may use any width, since it measures the room the component has, not the screen.
- Do not restyle the focus ring. The base layer draws one ring for every focusable element.
- Put hover styles inside `@media (hover: hover)`, so a touch screen does not keep them after a tap.
- A transition names its properties and takes its duration and easing from tokens. Anything that animates on its own stops under `@media (prefers-reduced-motion: reduce)`.
- Text inherits `overflow-wrap: break-word` from the base layer, so a long unbroken word breaks inside a block. That is not enough for an element that is only as wide as its text, or for text that is a flex item beside an icon: give those `overflow-wrap: anywhere` as well, as `ds-alert__body` and `ds-field__error` do. A browser test puts a 90-character path in the places a message lands and fails when the page scrolls sideways at 390px.
- An icon the stylesheet draws itself is a mask over `currentColor`, from a single icon file: `mask: url("icons/loader.svg") center / contain no-repeat`. The path is relative to `dist/design-system.css`.

### Colour

- There is one interactive colour, `--ds-color-accent`. It is used for the primary action, focus, selection and active work, and never for a status that is not "working". The focus ring (`--ds-color-focus`) and the working status (`--ds-color-info`) are tokens of their own, which a theme may give the same value: the Botbench theme does. A tooltip, a count or a finished step is none of the four, so it takes another token.
- A surface is one of four levels, each with one role: `--ds-color-surface` is the page, `--ds-color-surface-pane` a pane of the app shell (the sidebar nav, the inspector, the tab bar, and nothing else, which a test checks), `--ds-color-surface-raised` a card, a dialog, a sheet or a control that rests above the page, and `--ds-color-surface-sunken` a well: a block of code, a diff, command output, a read-only field. `--ds-color-fill` is the tone of a secondary control, a chip and a selected row.
- `--ds-color-border` is a hairline, for a card, a divider and the edge of a pane. A pane keeps its hairline in both modes, since in dark the page and the pane are a small step apart. `--ds-color-border-strong` is the edge of a control and holds 3:1; the hairline cannot mark a control.
- The approval tone is a small signal for what waits on a person: a mark, a badge, a count. It is never the fill of a band or a whole panel.
- A text and background combination a component draws has a pair in `tokens/pairs.json` with no `themes` list, so every theme passes it. Secondary text (`--ds-color-muted`) has such a pair on the page, a pane and a card only: keep it off the sunken surface, the fill and the tints.

### Type

Text takes one of seven roles. A role is a size token with the line height of the same name, and the three headings have a tracking token and a weight as well. The sizes are in rem, so they follow the font size the reader chose in the browser: the pixels below are at the usual 16px root. Nothing is under 12px, and the build fails on a type token that is.

| Role | Tokens | Size, line | Weight, tracking | Use it for |
|---|---|---|---|---|
| Label | `--ds-text-xs`, `--ds-leading-xs` | 12px, 16px | normal; semibold for a table head | A badge, a tag, a key, a count, a table head, the tab bar, a tooltip. The smallest size there is. |
| Metadata | `--ds-text-sm`, `--ds-leading-sm` | 13px, 18px | normal; semibold for the label over a group | A timestamp, a duration, the second line of a row. Helper text: the description of a field, a settings row, a checkbox, a radio, a switch or an option, a hint, a caveat. The label over a group: in a menu, a listbox, a sidebar or an inspector, the term over a value, the label of a figure. A small button, a chip, and an option of the segmented control. |
| Control | `--ds-text-md`, `--ds-leading-md` | 14px, 20px | normal; medium for a button and a tab | The label of a button or a tab, a row of a list, a menu, a tree, a sidebar or a table, a breadcrumb, a key with its value. |
| Body | `--ds-text-ui`, `--ds-leading-ui` | 15px, 23px | normal | Prose in a transcript, a paragraph, the text of a field. It is what `body` sets, so most text sets no size. |
| Sub-heading | `--ds-text-lg`, `--ds-leading-lg`, `--ds-tracking-lg` | 16px, 22px | semibold, -0.01em | The title of a card, a dialog, a sheet, an approval, an empty state or a section of settings. |
| Heading | `--ds-text-xl`, `--ds-leading-xl`, `--ds-tracking-xl` | 20px, 26px | semibold, -0.015em | The heading of a section of a page, and the value of a stat. |
| Title | `--ds-text-2xl`, `--ds-leading-2xl`, `--ds-tracking-2xl` | 28px, 34px | semibold, -0.02em | The one title of a view. One on a screen. |

- Set the size, the line height and, where the role has one, the tracking together. A test fails when a rule sets `--ds-text-lg`, `-xl` or `-2xl` without the tracking of the same name.
- The label over a group is in sentence case, 13px semibold, with no tracking and never in capitals: a test fails on `text-transform: uppercase`. Such a label may be a heading element, which has a tracking of its own in the base layer, so its rule sets `letter-spacing: normal`.
- Helper text is the metadata role, never the label role: on a settings screen it carries most of the words. A test fails when a class ending in `__description`, `__hint` or `__caveat` takes `--ds-text-xs`.
- On a coarse pointer each size is one pixel larger, which the tokens do by themselves. Two are not: the label of a control (`--ds-text-md`) is the body size there, 16px, and the title of a view stays 28px.
- The text of a form control is the body role. That is 16px on a coarse pointer, which is what keeps iOS from zooming when the control takes focus; a control in the mono size uses `--ds-text-lg` below 768px for the same reason and takes no tracking. `ds-field__control` and `ds-copy-field__value` are the patterns.
- `--ds-text-mono` is the size of a block of code. Code inside a sentence is `0.93em` of the text around it, which the base layer sets on `code`, `kbd` and `samp`: a component sets a size on a code element only when it is a block or a line of its own.
- A compact container (`data-ds-density="compact"`) sets `--ds-text-ui` and `--ds-leading-ui` to the metadata size and line height, so body text inside it is 13px on an 18px line. The control role does not change there. Work a height out from the tokens of the role the text takes, never from the numbers.
- Every number a reader compares or that changes in place is set in tabular figures, `font-variant-numeric: tabular-nums`: a duration, an elapsed time, a count, a line total, a numeric table cell, a page number.
- A title or a heading that may wrap takes `text-wrap: balance`. Do not use `pretty`, which Firefox does not have.

### Spacing

The scale is `--ds-space-xs` (4px), `-sm` (8), `-md` (12), `-lg` (16), `-xl` (24), `-2xl` (32) and `-3xl` (48). Three steps sit between, because components need them: `-2xs` (2px) and `-xs-sm` (6px) are gaps inside a small control, and `-lg-xl` (20px) is the side of a small mark such as a checkbox. Each step is also a `ds-gap-` class and a key of the Tailwind preset (`gap-xs-sm`, `p-3xl`).

### Radius

The radius says what kind of thing a box is, so take it from this list, not from what looks right beside its neighbour:

| Token | Value | For |
|---|---|---|
| `--ds-radius-xs` | 6px | A badge, a tag, a key, the box of a checkbox, the bar of a meter or of a progress, a tooltip, a segment inside the track of the segmented control. |
| `--ds-radius-sm` | 10px | A control: a button of any size, a field, a select, a textarea, an icon button, a toggle, a tab, a page number, the track of the segmented control, a row that takes a press. |
| `--ds-radius-md` | 12px | A card and what is drawn like one: a code block, a diff, a message, an alert, a menu, a listbox, a popover, a toast, a tool call, an approval. |
| `--ds-radius-lg` | 16px | A dialog, a sheet and the composer box. |
| `--ds-radius-full` | a pill | A chip (filter, suggestion, source, attachment), the track and thumb of a switch, an avatar, a count, and Send in the composer. |

- A box inside another takes the step under it. A row or a block inside a card or a menu is `sm`, the textarea inside the composer box is `md`, a segment inside its track is `xs`, the mark inside a calendar day is `xs`.
- The pill is for the shapes in the last row only. A circle is the other use of the same token, for a mark that is round because of what it is: a radio and its dot, an unread dot, the number of a step. A test lists both and fails on any other use.
- A box that runs edge to edge has no radius: a banner, a row between two rules, the sheet at its lower edge.
- A textarea is a field, 10px, which leaves the resize grip clear of the corner.

### State

Style state from what the element already says about itself. Never style it from a class that a script would have to toggle, because React, Alpine and hand-built DOM must all get the same result from the same markup.

| State | Selector |
|---|---|
| Unavailable | `:disabled`, and `[aria-disabled="true"]` for an element that must stay focusable |
| Working | `[aria-busy="true"]` |
| Invalid | `[aria-invalid="true"]` |
| Read-only | `[readonly]` |
| Open | `[open]`, `:popover-open` |
| Current page or step | `[aria-current]` |
| Selected | `[aria-selected="true"]`, `:checked`, `[aria-pressed="true"]` |
| Pointer and keyboard | `:hover`, `:active`, `:focus-visible` |

Write the unavailable rules after the hover and pressed rules, so an unavailable control never answers the pointer.

### No inline style

No component relies on a `style` attribute. The apps' content security policies block it. A size that comes from data uses `<progress>` or `<meter>`.

### Pointer targets

A pointer target is at least 44px in both directions on a coarse pointer, such as a finger, and at least 24px on a fine one, such as a mouse (WCAG 2.2, 2.5.8). Three tokens carry this, and a component never writes the numbers:

| Token | Use it for | Value |
|---|---|---|
| `--ds-size-control` | The height of a control of default size, and the side of a square one. Set it as `min-height` and `min-width`. | 40px by default, 32px in a compact container, 44px on every coarse pointer |
| `--ds-size-row` | The least height of a row in a list, a menu, a tree or a table. | 40px by default, 36px in a compact container, 44px on every coarse pointer |
| `--ds-size-touch` | The hit area of a control drawn smaller, on a coarse pointer only. | 44px |

The first two are 40px unless something sets them. `data-ds-density="compact"` on a container, the attribute's one value, makes them 32px and 36px and sets body text to the metadata size, through `--ds-text-ui` and `--ds-leading-ui`. Under `@media (pointer: coarse)` both are 44px everywhere, whatever the attribute says, and the type is larger. The blocks that do this are in `tokens/tokens.css`; a component only reads the tokens, and a theme cannot set them.

One line of text is centred in a control or a row by block padding worked out from the same token, never by a fixed padding that only fits one height:

```css
.ds-field__control {
  min-height: var(--ds-size-control);
  padding-block: calc((var(--ds-size-control) - var(--ds-text-ui) * var(--ds-leading-ui)) / 2 - var(--ds-border-width));
}
```

A size variant is a fixed height that does not follow the container: `--ds-size-control-xs` (24px, a tag and the smallest target of a fine pointer), `-sm` (28px), `-md` (32px, a small control) and `-lg` (48px, a large one). A small button sets its label in the metadata role, with the padding worked out from `--ds-text-sm` and `--ds-leading-sm`. Nothing interactive is smaller than 24px in either direction. A control drawn smaller than the touch size reaches 44px on a coarse pointer through a padded hit area: an invisible box centred on the control that takes the press without adding height to the row. It is written inside `@media (pointer: coarse)`, which is the only place a component uses `--ds-size-touch`, and a test checks that. `ds-button--small` is the pattern.

```css
.ds-button { position: relative; }

.ds-button--small { min-height: var(--ds-size-control-md); }

@media (pointer: coarse) {
  .ds-button--small::after {
    content: "";
    position: absolute;
    top: 50%;
    inset-inline: 0;
    height: var(--ds-size-touch);
    translate: 0 -50%;
  }
}
```

A width is a size token too: `--ds-size-sidebar` for a navigation or list column, `--ds-size-inspector` for a detail column beside the main one, `--ds-size-column`, `--ds-size-transcript` and `--ds-size-wide`. Do not multiply a control's height to make a width.

A link inside running text is exempt. In markup that is a link with no class.

The browser test measures the target, not the drawn box: how far the pointer can move from the centre of each control, along each axis, and still land on it. It asks for 44px with a coarse pointer at 390px and for 24px with a fine pointer at 1280px.

### Status is never colour alone

A status, an error or a required marker is always text or an icon as well as a colour. `ds-field__error` draws its icon in the stylesheet so that no markup can leave it out.

### Tooltips and hover cards

A tooltip or hover card holds supplementary information only. Nothing the reader needs in order to act, and no control, lives only inside one. It opens on tap and on keyboard focus as well as on hover.

## The examples

`examples.html` is a fragment, not a page. It holds only example elements, one after another at the top level. Comments between them are allowed.

```html
<div data-example="one-primary" data-title="One primary action" data-reason="The view has one main action, and the primary button marks it.">
  <div class="ds-cluster">
    <button type="button" class="ds-button ds-button--primary">Start task</button>
    <button type="button" class="ds-button">Save as template</button>
  </div>
</div>

<div data-example="two-primaries" data-title="Two primary actions" data-dont="one-primary-action" data-reason="Two primary buttons compete, and the reader has to work out which one matters.">
  <div class="ds-cluster">
    <button type="button" class="ds-button ds-button--primary">Start task</button>
    <button type="button" class="ds-button ds-button--primary">Save as template</button>
  </div>
</div>
```

The wrapper element is any element. Its attributes, written with double quotes:

| Attribute | Required | Meaning |
|---|---|---|
| `data-example` | Always | The example's id, unique in the file. |
| `data-title` | Always | A short label, shown above the example. |
| `data-state` | For state coverage | The state this example shows, spelled as in `meta.json`. |
| `data-dont` | On a don't example | The id of the checker rule the example breaks, or `review` when no rule can catch it. |
| `data-reason` | On every don't, and on the do paired with one | One or two sentences on why. |

The wrapper is not part of the component: what an agent copies is the markup inside it. So a layout class the example needs, such as `ds-cluster` or `ds-stack`, goes on an element inside the wrapper, not on the wrapper itself, where it would be lost from the copied markup. Some existing examples carry a layout class on the wrapper. Do not copy that.

Rules for the set of examples:

- An example without `data-dont` is a do example. There is at least one.
- There is at least one don't example, and at least one do example carries `data-reason`. Together they are the do and don't pair every component shows. Each gives its reason.
- Every state listed in `meta.json` has a do example with the matching `data-state`. Show every variant and size too.
- A do example is correct by itself. It passes the checker with no findings and no waivers when it is the only thing on a page, so it holds at most one primary button, for instance. It also passes axe.
- A don't example with a rule id breaks that rule and no other. Use `review` for a mistake only a person can see, such as a placeholder used as a label.
- For `hover`, `active`, `focus` and `focus-visible`, show the control at rest. The screenshot test forces the state on every control in that example.
- An `id` is unique across the file. Start it with the component and example names, such as `field-invalid-error`.
- An example may use another component's classes, such as a button inside an alert. Copy that component's markup from its own examples.
- All the examples of a component share one gallery page. Give each landmark a label that is unique on that page, such as a different `aria-label` on each `nav`, or axe reports the duplicates.
- A control inside a closed `<details>` cannot be hit-tested, so the pointer-target test cannot measure it. In a do example, keep controls out of collapsed content or give the element the `open` attribute.
- A component with no controls, such as a badge or a spinner, is fine. Its examples have no pointer targets to measure.
- Reference an icon as `icons.svg#ds-icon-<name>`, with no directory. The gallery adds its own path, and an app adds the path it serves the system from.

```html
<svg class="ds-button__icon" aria-hidden="true"><use href="icons.svg#ds-icon-plus"></use></svg>
```

- Copy is specific and plain, as it would be in a real screen: "Start task", "Repository", "Put a slash between the owner and the name." No "Click me", no placeholder text, no emoji.

## Page patterns

A page pattern is a whole screen composed from components: a settings page, a sign-in screen, a list with its detail. It shows an agent how the components go together, so a new screen starts from a finished one. It lives in `patterns/<name>/` and holds the same three files as a component, built to everything on this page, with these differences:

- `meta.json` has one more field, `"kind": "pattern"`. The build fails when a folder in `patterns/` leaves it out, and when a folder in `components/` has it.
- The stylesheet is minimal. A pattern arranges components and does not restyle them, so it holds only the layout the screen needs under `ds-<name>`, and often only a class or two. Reach for the layout classes of the base layer first.
- Each example is a whole screen in one state. The components inside it keep the markup of their own examples.
- A pattern cannot take the name of a component: the two share the class list, the index and the gallery.

The build bundles pattern stylesheets into `dist/design-system.css` after every component, in the same `@layer ds.components`, so a pattern's layout wins over a component it arranges. It lists patterns in the `patterns` array of `dist/components.json`, each entry holding the metadata fields, `kind` and the do examples. The `components` array holds components only, as it always has. Pattern classes join the `classes` list of `dist/manifest.json`.

In the gallery a pattern has a page of its own, listed after the components on the index. Its examples run down the page in one column, not two abreast, because each is a whole screen. `data-gallery-frame` on an example gives it room and keeps anything fixed inside it. Name every pattern in `rules/choosing-components.md`, with when to start from it.

## Themes

A component never knows which theme is loaded. It takes every value from a token, so a theme in `themes/` restyles it by changing token values, and the component needs nothing for it. A theme sets colours, the two font stacks and the shadow. It cannot set a type size, a line height, a tracking, a radius or a density token: those scales are the same under every theme, and the build fails, naming the token, when a theme sets one. Do not test for a theme in a stylesheet, and do not add a token for one component.

A theme is `themes/<name>.css`: values for existing token names in light and dark, in the selector shape of `tokens/tokens.css`, inside `@layer ds.theme`. "Default mode: dark" in its first comment makes a page with no `data-theme` dark. The build checks that it adds no name, sets no size or radius, sets both modes and passes every pair in `tokens/pairs.json` in both modes, then writes its stylesheet, its token block, its token data and its summary to `dist/themes/`. `docs/consumer-guide.md` has the full list of checks.

A new status colour is a token, added to `tokens/tokens.css` with its pairs in `tokens/pairs.json`, and then given a value in every theme, since the build checks each theme against every pair. A pair may carry a `themes` list, such as `"themes": ["botbench"]`: the build then checks it for those themes and no other. It records a combination one theme holds and another does not, for that theme's app to use in its own components. A component of the system relies only on a pair with no list.

The gallery loads a theme with `?brand=<name>`, beside `?theme=dark` for the mode, and the bar has a link for each. `npm run test:visual` screenshots a fixed list of pages under the Botbench theme, in light and dark at both widths, and runs axe, the structural rules and the pointer-target check on them.

## The metadata

`meta.json` holds these fields. All are required. A list may be empty.

| Field | Type | Holds |
|---|---|---|
| `name` | text | The folder name. |
| `title` | text | The name as a heading, such as "Button". |
| `purpose` | text | One sentence on what it is for. |
| `status` | `"draft"` or `"stable"` | Start at `draft`. Apps may use a draft. |
| `whenToUse` | list of text | The situations it is for. |
| `whenNotToUse` | list of text | The situations it is not for, each naming what to use instead. |
| `variants` | list | One entry per variant. |
| `sizes` | list | One entry per size. |
| `states` | list of text | Every state the component has, such as `default`, `hover`, `focus-visible`, `active`, `disabled`, `busy`, `invalid`, `read-only`, `open`, `selected`, `empty`, `loading`, `error`. A content state such as `loading`, `empty` or `error` may have an example and no styling of its own: the example shows what the component holds in that state. |
| `accessibility` | list of text | The element to use, the attributes to set, what the keyboard does. |
| `icons` | list of text | Every icon the examples reference and the stylesheet draws. Each is in `base/icons.json`. |
| `classes` | list of text | Every class the stylesheet defines: the block, its parts and its modifiers. |

One field is optional. `statusSet` is a list of `{ "state", "icon", "tone", "use" }`: a fixed set of states, each with one icon and one tone, that other components reuse. The tone is the name of one of the component's variants and the icon is in its `icons` list. The build fails when two states share an icon or a tone is not a variant. Only `badge` has one: it is the status set of a run, and `run-status`, `run-timeline`, `check-list` and `tool-call` draw the same icon and tone for the same state, which a test checks.

An entry in `variants` or `sizes` is `{ "name", "class", "use" }`: the name, the modifier class that selects it and when to choose it. Leave out `class` for the default, which needs no modifier.

```json
{ "name": "primary", "class": "ds-button--primary", "use": "The one main action of a view, dialog or popover." }
```

The build copies these fields into `dist/components.json`, with the markup of each do example, which is where an agent looks a component up before writing markup. Write them for that reader. It copies `name`, `title`, `purpose`, `status` and `classes` into `dist/components-index.json`, the short list an agent searches first, so the purpose must say by itself what the component is for.

## What the build checks

The build stops, naming the folder, when:

- one of the three files is missing, or `meta.json` is not valid JSON;
- a pattern has no `"kind": "pattern"`, a component has it, or a pattern has the name of a component;
- a metadata field is missing or of the wrong type, the name is not the folder name, or the status is not `draft` or `stable`;
- the stylesheet is not in `@layer ds.components`, or defines a class outside `ds-<name>`, `ds-<name>__…` and `ds-<name>--…`;
- the classes the stylesheet defines and the `classes` list differ;
- `examples.html` holds anything outside an element with `data-example`, an example has no `data-title`, or two share an id;
- there is no do example, no don't example, a don't without `data-reason`, or no do with `data-reason`;
- a state in `meta.json` has no do example with that `data-state`;
- the `icons` list differs from the icons actually used, or names an icon `base/icons.json` does not have;
- a `statusSet` gives two states one icon, or names a tone that is not a variant or an icon the `icons` list leaves out.

## Running the checks

```sh
npm run build        # regenerate dist/, including the gallery
npm test             # build rules, and the checker over every example and component stylesheet
npm run test:visual  # the gallery in Chrome, compared with the committed screenshots
```

`npm test` runs the shipped checker over each example as a page of its own and over each component and pattern stylesheet. Do examples and stylesheets must produce no finding and no waiver. Each don't example with a rule id must produce that rule and nothing else. It also fails when the committed `dist/` does not match the sources, so commit the regenerated `dist/` with the folder.

`npm run test:visual` opens the gallery page of each component and each pattern at 390px and 1280px, in light and dark. The 390px pages are opened with a coarse pointer, as a phone has, and the 1280px pages with a fine one. On the do examples it runs axe, runs the structural rules on the rendered page and measures every pointer target: 44px at 390px and 24px at 1280px. It compares each page, width and theme with its screenshot in `test/visual/screenshots/` and fails when they differ. After a change you mean to make, run `npm run test:visual:update`, look at the screenshots it rewrote, then commit them: they are what the owner reviews.

A component with behaviour worth proving, such as keyboard operation, adds its own test to `test/visual/gallery.spec.mjs`, as the button and the field do.

To look at the gallery in a browser, serve `dist/` and open `/gallery/`. The icons do not load from a `file:` URL.

```sh
python3 -m http.server --directory dist
```

## Before you finish

- The component looks finished in all four screenshots, not merely present.
- Every variant, size and state has an example, and the do and the don't each give a reason.
- `npm run build`, `npm test` and `npm run test:visual` pass, and `git status` shows the regenerated `dist/` and the screenshots `npm run test:visual:update` rewrote or added.

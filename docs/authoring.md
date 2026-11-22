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
- Values are tokens: `var(--ds-…)` for every colour, font, type size, spacing, radius, shadow, duration and layer. Do not write a raw colour or length where a token exists, and do not declare a custom property. A calculation on a token is allowed, such as `calc(var(--ds-border-width) * 2)`.
- No gradient, blur, backdrop filter, blend mode or text clipped to a background.
- The only width in a media query is 768px, written as the number: `@media (min-width: 768px)`. Style the compact layout first.
- Do not restyle the focus ring. The base layer draws one ring for every focusable element.
- Put hover styles inside `@media (hover: hover)`, so a touch screen does not keep them after a tap.
- A transition names its properties and takes its duration and easing from tokens. Anything that animates on its own stops under `@media (prefers-reduced-motion: reduce)`.
- Text inherits `overflow-wrap: break-word` from the base layer, so a long unbroken word breaks inside a block. That is not enough for an element that is only as wide as its text, or for text that is a flex item beside an icon: give those `overflow-wrap: anywhere` as well, as `ds-alert__body` and `ds-field__error` do. A browser test puts a 90-character path in the places a message lands and fails when the page scrolls sideways at 390px.
- An icon the stylesheet draws itself is a mask over `currentColor`, from a single icon file: `mask: url("icons/loader.svg") center / contain no-repeat`. The path is relative to `dist/design-system.css`.

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

Every control is at least 44px in both directions, which is `var(--ds-size-touch)`. Set it as `min-height` and `min-width`.

A control drawn smaller, for a dense row or a toolbar, reaches 44px through a padded hit area: an invisible box centred on the control that takes the press without adding height to the row. `ds-button--small` is the pattern.

```css
.ds-button { position: relative; }

.ds-button--small::after {
  content: "";
  position: absolute;
  top: 50%;
  inset-inline: 0;
  height: var(--ds-size-touch);
  translate: 0 -50%;
}
```

A link inside running text is exempt. In markup that is a link with no class.

The browser test measures the target, not the drawn box. It checks that the four edges of a 44px square centred on each control land on that control.

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

## The metadata

`meta.json` holds exactly these fields. All are required. A list may be empty.

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
- the `icons` list differs from the icons actually used, or names an icon `base/icons.json` does not have.

## Running the checks

```sh
npm run build        # regenerate dist/, including the gallery
npm test             # build rules, and the checker over every example and component stylesheet
npm run test:visual  # the gallery in Chrome
```

`npm test` runs the shipped checker over each example as a page of its own and over each component and pattern stylesheet. Do examples and stylesheets must produce no finding and no waiver. Each don't example with a rule id must produce that rule and nothing else. It also fails when the committed `dist/` does not match the sources, so commit the regenerated `dist/` with the folder.

`npm run test:visual` opens the gallery page of each component and each pattern at 390px and 1280px, in light and dark. On the do examples it runs axe, runs the structural rules on the rendered page and, at 390px, measures every pointer target. It writes one screenshot per page, width and theme to `test/visual/screenshots/`. Look at them, then commit them: they are what the owner reviews.

A component with behaviour worth proving, such as keyboard operation, adds its own test to `test/visual/gallery.spec.mjs`, as the button and the field do.

To look at the gallery in a browser, serve `dist/` and open `/gallery/`. The icons do not load from a `file:` URL.

```sh
python3 -m http.server --directory dist
```

## Before you finish

- The component looks finished in all four screenshots, not merely present.
- Every variant, size and state has an example, and the do and the don't each give a reason.
- `npm run build`, `npm test` and `npm run test:visual` pass, and `git status` shows the regenerated `dist/` and screenshots.

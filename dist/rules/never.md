# Never

Each entry gives the reason, what to do in its place, and what catches it. A rule ID means the checker fails the build. "Review" means a reviewer catches it with `review-rubric.md`. The fix for each rule ID is in `checker-rules.md`.

## Colour and surface

**Purple, indigo or violet gradients, in a background or in text.**
Why: this is the most recognised mark of a generated interface. Use a flat surface token. Caught by `banned-gradient`, and the colours themselves by `raw-color`.

**Gradient text.**
Why: it lowers contrast and decorates where it should inform. Set the text colour with a colour token. Caught by `banned-background-clip-text` and `banned-gradient`.

**Glassmorphism or frosted panels.**
Why: blur and translucency reduce contrast and exist for effect. Use an opaque surface token with a 1px border. Caught by `banned-backdrop-filter` and `banned-blur`.

**Glowing or coloured shadows.**
Why: a shadow here means one thing, that an overlay sits above the page. Use the overlay shadow token on overlays and no shadow elsewhere. Caught by `raw-shadow`.

**Shadows on every element.**
Why: when everything is raised, nothing is. Show elevation with a background shift or a 1px border. A hand-written shadow is caught by `raw-shadow`, and a shadow utility by `visual-utility`. The shadow token on something that is not an overlay is caught in review.

**Decorative orbs and abstract AI backgrounds.**
Why: they say nothing about the content and push it down the page. Leave the surface plain. The usual ways to build them are caught by `banned-gradient`, `banned-blur` and `banned-blend-mode`. An image used this way is caught in review.

**Raw colours.**
Why: a colour outside the tokens breaks the dark theme and the contrast guarantees. Use a colour token. Caught by `raw-color`.

**Colour as the only signal.**
Why: some readers cannot tell the colours apart, and a colour alone does not say what it means. Add words or an icon to every status, error and required marker. Caught in review.

## Type

**Inter, Roboto, Geist or system-ui named as the typeface in an app.**
Why: they are the defaults every generated interface reaches for. The typeface comes from the font tokens: IBM Plex Sans with IBM Plex Mono by default, and the platform's own font where a theme chooses it, as the Botbench theme does. Caught by `raw-font-family`, and a font utility by `visual-utility`.

**Centred body text wider than the reading column.**
Why: each line starts in a different place, so long centred text is hard to read. Align body text to the start and centre only a short line. Caught by `centred-body-text`.

**Off-scale sizes.**
Why: a size outside the scales makes screens drift apart by a pixel at a time. Use the spacing, type and radius tokens. Caught by `off-scale-spacing`, `off-scale-font-size`, `off-scale-radius`, `off-scale-utility` and `arbitrary-value`.

## Layout and emphasis

**Identical feature cards, especially three in a row.**
Why: a grid of same-shaped cards is a template, not a design for the content. Use a `list` for uniform items, or lay each item out by what it holds. Caught by `identical-card-grid`.

**Nested cards.**
Why: a box inside a box adds borders and takes away room without adding meaning. Use one container and separate what is inside with a heading or a divider. Caught by `nested-cards`.

**Every button primary.**
Why: emphasis works only when one thing has it. Keep one primary `button` in a view and give the rest secondary or quiet emphasis. Caught by `one-primary-action` and `repeated-item-primary`.

**Badge clutter.**
Why: a `badge` marks the one status a reader acts on, and ten of them mark nothing. Keep one per item and write other facts as plain text. Caught by `excess-badges`.

**Inline styles.**
Why: the apps' content security policies block them, and they step around the tokens. Use a component or a class. Caught by `inline-style`.

## Motion

**Bounce or elastic hover effects.**
Why: motion here confirms a change of state and nothing else. Use the duration tokens and the one easing token, on colour and opacity. A hover utility is caught by `unlisted-variant`, and a hand-written duration by `raw-duration`. A custom easing curve is caught in review.

## Content

**Emoji as icons.**
Why: they render differently on every platform and do not take the text colour. Use an icon from the icon sprite, or no icon. Caught by `emoji-as-icon`.

**Stock call-to-action copy, such as "Get started" or "Learn more".**
Why: it fits any product, so it says nothing about this one. Name what the control does in the words of the task. Three controls with the same stock phrase in one view are caught by `stock-phrase`. A single one is caught in review. See `content.md`.

**Information shown only on hover.**
Why: a touch screen has no hover, and a keyboard reader may never trigger it. Show what the reader needs in the view. A tooltip holds supplementary text only and also opens on tap and on focus. Caught in review.

# Procedures

One procedure per kind of work. Each names its inputs, steps, tools, outputs, validation and labelling rule. Procedures 1 and 2 come before any of the others. The upstream skill each step uses is pinned in [registry.md](registry.md); install it at that revision, read its SKILL.md, references and scripts, and run its tooling. Where its defaults differ from [motion.md](motion.md), the overrides in the registry apply.

## 1. Product discovery and the truth sheet

**Inputs.** The product repository at a stated commit: its README (status sections such as "What works today", "Where it is going", "Current availability"), its docs, tests and end-to-end suites, and the code paths they cite. The owner, for anything those do not settle.

**Steps.**
1. Run the product, or read its end-to-end tests, and list what a user can actually do. Use jezweb's product-showcase for discovery and capture only.
2. Write one row per claim a surface might make: the claim in plain words, its status, the evidence (file and line, test name, recording) and any caveat the product itself states.
3. Copy the product's own wording for every sentence a scene or card will show, with the file and line it comes from.
4. Ask the owner to confirm anything marked hypothesis or roadmap, and anything you are unsure of.

**Statuses.**

| Status | Means | May be shown |
|---|---|---|
| Implemented | In the code at this commit | Described; shown once verified |
| Verified | Implemented and seen working: a passing test, a run you watched | Demonstrated, as a recording, screenshot or scene |
| Recorded or replayed | A real recording, or a replay of a recorded session | Shown, with its source commit and label |
| Illustrative | An authored drawing of verified behaviour | Shown, labelled as an illustration, beside real media |
| Experimental | Behind a flag, early, or tested in narrow conditions | Described with its caveat ("Early"); not animated as routine |
| Roadmap | Planned, not built | Named as planned in words; never drawn or animated as working |
| Hypothesis | A belief about users or outcomes | Not shown; may guide what to test |

**Tools.** The product's own test runner and build; product-showcase for capture; a screenshot tool at the widths in [quality-gates.md](quality-gates.md).

**Outputs.** `truth-sheet.md` beside the surface's source (or in the pull request): the commit, the table of claims, and the verbatim product strings.

**Validation.** Every row has evidence a reviewer can open. Nothing above "Illustrative" rests on a document alone.

**Labelling rule.** The truth sheet is the source of every label on every later surface.

## 2. Product-marketing context

**Inputs.** The truth sheet; the owner's positioning lines and audience; any existing `.agents/product-marketing.md`.

**Steps.**
1. With marketingskills' `product-marketing`, write or update `.agents/product-marketing.md`: audience, the problem in their words, the moment of realization, the distinctive value stated truthfully, the owner's positioning lines kept as written, and the primary and secondary action.
2. For each surface, state its one purpose and its one primary action. Use `copywriting` for words and `cro` (formerly `page-cro`) and landing-page-guru for page structure and the call to action.
3. Strike any claim that is not on the truth sheet. Prefer "not demonstrated in the projects we reviewed" to a claim of uniqueness.

**Outputs.** `.agents/product-marketing.md`; a one-paragraph brief per surface.

**Validation.** The product-marketing reviewer can trace every claim on the brief to a truth-sheet row.

**Labelling rule.** No testimonials, user counts, speed or outcome numbers unless the truth sheet carries them as verified.

## 3. A Stageshow scene

A short authored animation on a web page, showing one shipped behaviour.

**Inputs.** The truth sheet's verified rows and verbatim strings; the brief; the site's vendored design system and theme.

**Steps.**
1. Pick one choreography pattern from [motion.md](motion.md#approved-choreography-patterns) and write the beats: cause, effect, payoff, three to five beats. Write the final frame first; it is the poster.
2. Build with the Stageshow kit at its pinned revision: benjitaylor's React kit inside a React build, or the stageshow-js port for a page with no framework (it exports one block of HTML, CSS and JS). Compile to static assets; no CDN at runtime. Keep the kit's licence and notice beside the copied code. Do not use upstream's app-icon artwork, which is not under the kit's licence.
3. Map the kit's look to the site's design-system tokens and theme. Do not use a kit theme or palette.
4. Apply the overrides: beats 240 to 450 ms on `--ds-ease`, no overshoot, transform and opacity only, no height or blur animation, visible Play/Pause and Replay.
5. Add the accessibility behaviour in [motion.md](motion.md#accessibility-requirements): start in view, pause offscreen and when hidden, reduced motion and no-JS show the poster with its caption.
6. Design a separate compact composition at 358 px.
7. Film it with the kit's own `scripts/film.mjs` (contact sheet and `--gate`) at the shown width and at 390, and look at every frame.

**Outputs.** The scene's source and built assets; the poster; the contact sheet; the kit's rehearsal note with what was not checked.

**Validation.** The kit's gate passes; the scene checklist in [quality-gates.md](quality-gates.md#scene); the site's own browser checks at every width.

**Labelling rule.** A visible caption where the scene is shown, for example: "Illustration. The words are the product's own, and each step is a shipped feature." Link it to the README's status section. Show only verified behaviour.

## 4. A ChanMeng README card

An animated SVG at the top of a README.

**Inputs.** The scene's story (or the truth sheet's verified rows); the product's approved mark and lockup paths, unchanged; the theme's colours for light and dark.

**Steps.**
1. Install the kit into the repository with the product-card skill's `scripts/init-kit.mjs` at the pinned revision, plus the development dependencies it prints (`opentype.js`, `playwright-core`). Keep its licence file beside the kit.
2. Compose the still first: the final frame, readable on both GitHub backgrounds, with a background plate.
3. Write the card with the kit's timeline and card helpers. Outline text with the kit's glyph outliner from an open font package, so the SVG needs nothing external: no script, external font, external image or `foreignObject`.
4. Build light and dark animated cards and a motionless still for each. Reduced-motion CSS in each card stops the animation. Keep the run short and finite or a brief loop; never hide essential text behind a timer.
5. Wrap in a `picture` with `prefers-color-scheme` sources and a narrow-width source for a compact version, and link the image to the page that has the full scene or recording with real controls.

**Tools.** The kit's `check-card.mjs` (static validator) and `capture-frames.mjs` (Chromium frame capture at chosen times).

**Outputs.** Four SVGs (light, dark, and a still of each), the compact version, the build script, captured frames.

**Validation.** `check-card` clean; `capture-frames` at one time inside each beat and at the end, every frame looked at against both backgrounds; the card checklist in [quality-gates.md](quality-gates.md#card).

**Labelling rule.** The README text beside the card says it is an authored illustration and links to the evidence. The `alt` text says what the card shows, not "animation".

## 5. A product film

A recorded or replayed walkthrough with title cards.

**Inputs.** Real recordings or recorded sessions to replay, at a stated commit; the truth sheet; the brief.

**Steps.**
1. Use product-film at its pinned revision and start from its walkthrough template. Each beat is an HTML page that draws any frame deterministically; Playwright captures the frames and FFmpeg encodes.
2. Override the template's rendering defaults to the disk budget: 30 fps and device scale 1 unless a frame needs 2.
3. Camera moves 600 to 900 ms on `--ds-ease`; holds long enough to read; no kinetic type or effects that fail the three questions.
4. Open with, or carry throughout, a caption that says which parts are recorded, which are replayed from recorded sessions and which are title cards.
5. Check each beat on a contact sheet (product-film's FFmpeg tile command) before rendering the next. Delete intermediate frames once the outputs exist.

**Outputs.** The web file, a review file, a poster, captions, the contact sheet, and the beat sources.

**Validation.** The film checklist in [quality-gates.md](quality-gates.md#film); every contact-sheet frame looked at.

**Labelling rule.** Recorded, replayed and title-card parts named in the film and where it is embedded. Footage is never retouched to change what happened.

## 6. A social preview

The image a link shows when shared.

**Inputs.** The product's name, mark, one line from the product-marketing context, and a real screen or the mark.

**Steps.**
1. Compose at 1200 by 630 with the site's theme tokens; check it at 600 px wide.
2. Render it from HTML with the site's own browser tooling (Playwright), so the type and colours are the system's.
3. Set `og:image`, `og:image:alt` and `twitter:card` on each page.

**Outputs.** One PNG per page or one for the site, with its HTML source.

**Validation.** The social preview checklist in [quality-gates.md](quality-gates.md#social-preview).

**Labelling rule.** A real screen is unmodified and listed in the provenance file; no invented interface.

# Quality gates and review

A storytelling surface is published when it has passed every gate below and an independent review has found nothing open at its level. The maker runs the gates and attaches the evidence; reviewers who did not make it judge it. The `storytelling-review` skill runs the review.

## Findings cite observable evidence

Every finding, pass or fail, names what the reviewer saw and where: a file and line, a screenshot at a stated width and mode, a frame of a contact sheet at a stated time, a sentence quoted from the page, a command and its output. "Feels generic" is not a finding; "the headline 'Ship faster with AI' names no feature of the product (index.html:42)" is. A reviewer who could not observe something says so and does not mark it passed.

Severity: **blocker** (untrue, inaccessible, or breaks the system's rules; never published), **major** (fails a gate below; fixed before publishing), **minor** (a judgment the maker may decline, with a reason).

## Gates for every surface

1. **Truth.** Every claim, screen and beat maps to a row of the truth sheet ([procedures.md](procedures.md#1-product-discovery-and-the-truth-sheet)) with its status. Nothing marked roadmap, hypothesis or experimental is shown as working. No number, user count, testimonial or comparison the sheet does not carry.
2. **Labels.** Every authored scene, card or illustration says so where it is shown; every film says what is recorded, what is replayed and what is a title card; every real recording and screenshot is unmodified and listed with the commit it came from.
3. **System rules.** The surface uses the system's tokens, theme and components, passes its contrast pairs in light and dark, and the checker reports nothing that is not a documented waiver. Any `ds-waive raw-duration` names [motion.md](motion.md).
4. **Motion.** Each moving thing answers the three questions in [motion.md](motion.md#principles), uses `--ds-ease`, stays within its row of the timing table, and moves transform and opacity only.
5. **Accessibility.** Every requirement in [motion.md](motion.md#accessibility-requirements): reduced motion shows the final frame, the scene pauses offscreen and when the tab is hidden, Play/Pause and Replay work from the keyboard, nothing breaks with JavaScript off, focus is visible and never moved by playback.
6. **Rendered review.** Screenshots at 1440, 1280, 768, 390 and 358 px in light and dark, one with reduced motion, and a keyboard pass. For anything that moves, timed frames on a contact sheet, every frame looked at.
7. **Performance.** No new runtime dependency from a CDN; bundled build output committed with its licence in `NOTICE`; images sized for their slot; a scene does not drop frames on a mid-range laptop (check the browser's performance panel once per scene) and does no work while paused.
8. **Licences.** Each upstream kit used is pinned to a revision in [registry.md](registry.md), its licence file sits beside the code that came from it, and no skill's text is copied into the surface.

## Checklists per surface

Each item is a yes or no with evidence. A "no" is a finding.

### Marketing page

- One page purpose and one primary action, named in the product-marketing context.
- The headline says what the product does for whom, in words only this product could use.
- The product's real screens are the main imagery, in a frame, readable at 1440 px.
- At most one scene; everything else still.
- Every claim traced to the truth sheet; caveats ("Early") shown where the claim is.
- None of the anti-patterns in [motion.md](motion.md#anti-patterns).
- Works at 358 px as a designed layout, light and dark.

### Docs page

- Answers one task; the first screen says what the reader will have at the end.
- Commands are exact and were run at the stated revision.
- No motion beyond interface feedback and routine state changes.
- Screenshots show the current product and are listed in the provenance file.

### Evidence page

- Each item is a real recording, screenshot, log or test result, with the commit and date it came from and how to reproduce it.
- Says what was not tested, as plainly as what was.
- No authored illustration presented as evidence; any illustration on the page is labelled and sits beside the real media it explains.

### README

- The first screen says what the product is, who it is for and how to start, in that order.
- A card, if present, is labelled, links to the page with the full scene or recording, has a still for each theme and a narrow version.
- Install steps were run from a clean checkout at the stated revision.
- Status and limits are stated in the README's own words ("What works today", "Where it is going" or the product's equivalent).

### Scene

- Uses one approved choreography pattern; each beat has a cause in the story.
- The product's own words, verbatim, with the source file and line recorded.
- Starts in view, pauses offscreen and when hidden, has Play/Pause and Replay, rests on a complete final frame.
- Reduced motion and no-JS show that final frame with its caption.
- A designed composition at 358 px.
- Contact sheet of timed frames attached.

### Card

- Built with the ChanMeng kit at the pinned revision; the kit's validator passes.
- Light and dark animated versions and a motionless still for each.
- No script, external font, external image or `foreignObject`; text outlined or system fallback.
- Runs once or loops briefly; essential text never hidden behind a timer; reduced-motion CSS stops it.
- Frames captured at stated times and looked at, against both GitHub backgrounds.

### Film

- Built as a deterministic HTML timeline captured with Playwright and encoded with FFmpeg, at 30 fps.
- A title card or caption says which parts are recorded, which are replayed from recorded sessions and which are title cards.
- Recorded footage is not retouched to change what happened.
- Captions for every spoken or essential word; no autoplay with sound.
- Camera moves within 600 to 900 ms, on `--ds-ease`; holds long enough to read.

### Social preview

- 1200 by 630, readable as a 600 px thumbnail.
- The product's name, one line of what it does, and either a real screen or the mark. No invented UI.
- Passes contrast in the theme it is drawn in.

## Independent review roles

Each role is a separate reviewer, a person or an agent with no part in making the surface and no sight of the other reviewers' findings until all have reported. The `storytelling-review` skill runs them one at a time in fresh contexts.

| Role | Reads | Asks |
|---|---|---|
| Creative director | Screenshots at every width and mode, the contact sheet | Is there one idea, told with the product as the hero? Is the hierarchy clear and the composition calm? Does anything look generated? Uses Impeccable's critique and Hallmark's floor as its lens |
| Product marketing | The copy, the truth sheet, the product-marketing context | Does the page say what this product does for this audience, in words only it could use? Is every claim on the truth sheet? Is the primary action the right one? Uses marketingskills and landing-page-guru as its lens |
| Motion | The scene's source, the contact sheet, a recording of playback | Does every motion answer the three questions? Are the values on the timing table and the easing the token? Any bounce, blur, height or idle motion? Uses better-motion, better-ui and Emil Kowalski's review as its lens |
| First-time user | The page as rendered, nothing else | Within ten seconds, what is the product, who is it for, what do I do next? What did the scene teach? What did I not believe? |
| Accessibility and performance | The rendered page with reduced motion, keyboard only, JavaScript off, a screen reader if available, the performance panel | Every requirement in motion.md, contrast in both modes, pointer targets, no work while paused, no CDN dependency |

The maker answers each finding with a fix, or for a minor one a reason to decline, and the reviewer who raised it closes it.

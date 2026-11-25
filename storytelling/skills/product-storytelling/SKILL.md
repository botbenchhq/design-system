---
name: product-storytelling
description: Makes a product's public-facing surface, a marketing or docs landing page, an evidence page, a README and its card, an animated product scene, a product film or a social preview, from a truth sheet of what the product really does, with motion that shows cause and effect and labels on everything authored. Use when asked to tell a product's story, make or redo a landing page, hero, README card, demo scene, launch film or social image. Not for screens inside the product, which follow the design system's rules alone, and not for judging finished work, which is storytelling-review.
---

# Product storytelling

This skill makes a candidate surface and its evidence. It never declares the surface good: `storytelling-review` does that, in a fresh context. It decides nothing that an upstream skill governs; it routes each concern to that skill and keeps the house standard where they differ.

The method lives in the design system's `storytelling/` folder. Read these from the same checkout this skill was copied from (or https://github.com/botbenchhq/design-system/tree/main/storytelling):

- `README.md`: scope, and how this relates to the system's `rules/`.
- `motion.md`: principles, the timing scale, accessibility requirements, choreography patterns, anti-patterns.
- `procedures.md`: one procedure per surface, with inputs, steps, tools, outputs, validation and labelling.
- `quality-gates.md`: the gates the candidate must pass before review.
- `registry.md`: which upstream skill governs what, pinned revisions, install commands, overrides.

## Before anything

1. Read the repository's own rules first: `AGENTS.md` or `CLAUDE.md`, `DESIGN.md`, a voice or README standard, a provenance file, and the vendored design system's `rules/core.md`. They outrank this skill.
2. Check `df -h /`. Follow the disk budget in `README.md`; stop and report under 5 GB free.
3. Confirm the surface is public-facing. If it is a screen of the product, stop: use the design system's rules, and its motion rule (state changes only) stands.

## The run

1. **Truth sheet first.** Follow procedure 1 in `procedures.md`. Nothing is drawn, written or animated before every claim it will make has a row and a status. Ask the owner about anything the code and docs do not settle; do not guess.
2. **Product-marketing context.** Procedure 2: the audience, the problem, the moment of realization, the one primary action. Reuse `.agents/product-marketing.md` if the repository has one.
3. **Pick the surface's procedure** (3 to 6 in `procedures.md`) and install only the upstream skills it names, at the revisions in `registry.md`. Read each one's SKILL.md, references and scripts, and use its tooling: citing a skill is not using it.
4. **Route each concern to its owner** in the table in `registry.md`. Copy, page purpose and the call to action follow marketingskills and landing-page-guru; motion values follow better-motion and better-ui; a web scene is built with the Stageshow kit; a README card with the ChanMeng kit; a film with product-film; an explanatory diagram with Living Canvas. Every other skill may only flag.
5. **Apply the overrides** in `registry.md` wherever an upstream default conflicts with `motion.md`: no overshoot or bounce, beats no longer than 450 ms, transform and opacity only, visible Play/Pause/Replay, no imported default theme or palette, no CDN at runtime.
6. **Use the system.** Tokens, theme and components of the vendored design system. Add no token or class. A beat longer than a duration token is written as a stated value with a comment naming `storytelling/motion.md`, and a `ds-waive raw-duration` with that reason if the site runs the checker. Never hide it in `calc()`.
7. **Label** as the procedure says, where the thing is shown.
8. **Run the gates** in `quality-gates.md` that the maker runs: the build and checks of the repository, the rendered screenshots at every width and mode, reduced motion, keyboard, no-JS, and the contact sheet of timed frames. Look at every frame.
9. **Hand over.** Stop with a candidate: the changed files, the truth sheet, the screenshots, the contact sheet, the commands run and their output, and a plain list of what was not checked. Then ask for `storytelling-review`. Do not merge or publish until its findings are closed.

## Never

- Show roadmap, hypothesis or experimental behaviour as working.
- Invent a number, a user, a testimonial, a customer logo or output the product never printed.
- Retouch a recording, or present a drawing as a screenshot.
- Add a second expressive moment to a page, or motion with no cause in the story.
- Copy an upstream skill's text into the repository; link it and keep its licence beside any code taken from its kit.

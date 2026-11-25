---
name: storytelling-review
description: Reviews a finished public-facing product surface, a marketing, docs or evidence page, a README or its card, a product scene, a film or a social preview, against the storytelling companion's gates, with five independent reviewer roles whose findings each cite observable evidence. Use after product-storytelling hands over a candidate, or when asked to review, critique or sign off a landing page, README card, demo scene or launch film. Reports findings only; it does not fix them.
---

# Storytelling review

This skill judges a candidate surface. It does not change it: a fix is the maker's, under `product-storytelling`. It does not set direction either; it applies the gates the companion already states.

Read from the design system's `storytelling/` folder, at the same checkout this skill was copied from (or https://github.com/botbenchhq/design-system/tree/main/storytelling):

- `quality-gates.md`: the gates, the checklist for each surface, the roles and the severity scale. This is the standard.
- `motion.md`: the timing table, accessibility requirements, choreography patterns and anti-patterns the motion and accessibility roles apply.
- `procedures.md`: the truth-sheet statuses and the labelling rule for each surface.
- `registry.md`: the upstream skill each role uses as its lens, at a pinned revision.

## Inputs

The candidate (branch or pull request), its truth sheet, its product-marketing context, and the maker's evidence: screenshots at 1440, 1280, 768, 390 and 358 px in light and dark, a reduced-motion capture, the contact sheet of timed frames, and the commands run with their output. If any is missing, the first finding says which, and the gates that depend on it are reported as not checked, never as passed.

## The run

1. **Observe for yourself.** Build and open the candidate. Take your own screenshots where the maker's are missing or stale, at the widths and modes above. Play every scene; try it with reduced motion, keyboard only and JavaScript off. Check `df -h /` before capturing.
2. **Run each role separately**, in a fresh context (a separate agent or subagent each), in this order: first-time user, product marketing, creative director, motion, accessibility and performance. Give each role only what `quality-gates.md` says it reads; the first-time user sees only the rendered page. No role sees another's findings until all have reported.
3. **Each role uses its lens** from `registry.md` as critique only: Impeccable (`critique`, `audit`, and its `detect` command where installed) and Hallmark for the creative director; marketingskills and landing-page-guru for product marketing; better-motion, better-ui and Emil Kowalski's animation review for motion. A lens may raise a finding; it may not overrule the companion or the repository's own rules, and its default aesthetic is not a standard here.
4. **Walk the gates and the surface's checklist** in `quality-gates.md`. Every item is a yes or no with evidence.
5. **Write findings that cite observable evidence**: a file and line, a screenshot with its width and mode, a frame with its time, a quoted sentence, a command and its output. Give each a severity (blocker, major, minor) and the gate or checklist item it fails. A suspicion without evidence goes in a separate "could not verify" list.
6. **Report**: findings grouped by role, then a table of every gate with passed, failed or not checked, then the "could not verify" list. Say plainly whether anything blocks publishing.

## Never

- Edit the candidate, or propose a rewrite in place of a finding.
- Mark a gate passed that you did not observe.
- Count a skill's default (its palette, font or motion style) as a requirement.
- Accept a duration hidden in token arithmetic, an unlabelled illustration, or a claim missing from the truth sheet, whatever else is good about the surface.

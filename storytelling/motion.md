# Motion for storytelling surfaces

Applies to marketing pages, docs and evidence pages, READMEs, scenes, cards and films. A product screen follows `rules/never.md` (Motion) alone, and nothing here loosens it.

## Principles

Motion confirms cause and effect. Before anything moves, answer three questions in the scene's source or its pull request:

1. What caused it? A step in the story: an agent starts, a warning arrives, a check finishes.
2. What does the viewer learn from it? One fact per beat.
3. Would removing it make the surface worse? If not, remove it.

From those follow the rest:

- **One expressive moment per page at most**, and that moment is the scene. Everything else on the page is still, apart from interface feedback.
- **Nothing moves for decoration.** No perpetual motion, idle loops, blinking cursors, floating shapes, animated gradients, parallax or scroll-jacking.
- **The product is the hero.** A scene shows the product's own words and screens. An illustration exists only to show what a still screenshot cannot: time, causality, two parties.
- **The last frame is the message.** A scene, card or film rests on a complete final frame that makes sense on its own, because many people will see only that frame.
- **Transform and opacity only** for anything that moves. No animated height, width, blur, filter, clip or colour smear.
- **No bounce, no overshoot, no springs that settle past their target.** An engineer's instrument does not wobble.

## Timing and easing

Every curve is the system's one easing token, `--ds-ease` (`cubic-bezier(0.2, 0, 0, 1)`), a strong ease-out. Nothing eases in, and nothing uses a curve of its own.

| Kind of motion | Where | Duration | Token |
|---|---|---|---|
| Interface feedback: hover, press, tab, focus | Every surface, product UI included | Instant to 150 ms, colour and opacity only | `--ds-duration-fast` (100 ms) |
| Theme switch | Every surface | None: switch with no transition | none |
| Routine state change: a disclosure, a tab panel, a toast | Every surface | 100, 160 or 240 ms | `--ds-duration-fast`, `--ds-duration-base`, `--ds-duration-slow` |
| Story beat: one step of a scene or card | Scenes and README cards only | 240 to 450 ms | `--ds-duration-slow` at 240 ms; above it a stated value, see below |
| Hold between beats | Scenes, cards, films | Long enough to read the beat's words once, checked on the contact sheet | none |
| Camera move: a pan or zoom between recorded screens | Films only | 600 to 900 ms | none |

A hover is gated by `@media (hover: hover) and (pointer: fine)`, so a touch never leaves a stuck hover state.

### The storytelling scale is stated, not disguised

Story beats over 240 ms and film camera moves have no token, on purpose: the token scale is for the product, and the product never needs them. On a storytelling surface, write the value plainly in one place in the scene's stylesheet or timeline, with a comment that names this file:

```css
/* Story beat, 360 ms: storytelling/motion.md, marketing surfaces only */
```

If the consuming site runs the design system's checker over that file, the `raw-duration` finding is answered with an inline waiver on the line, which the checker prints on every run:

```css
/* ds-waive raw-duration: story beat on a marketing scene, scale in design-system storytelling/motion.md */
```

Never express a beat as arithmetic on a token (`calc()` of a duration token) or move it into a variable to get past the rule. That hides a value from a gate a reviewer relies on.

## Accessibility requirements

Every scene, card and film meets all of these. A surface that cannot meet one does not animate.

- **Reduced motion.** Under `prefers-reduced-motion: reduce`, show the complete final frame and its caption with no movement, not a slower or shorter animation.
- **Start in view, stop out of view.** A scene starts once it is in view (an `IntersectionObserver`), pauses when it leaves the viewport and when the tab is hidden (`visibilitychange`), and never plays offscreen.
- **Controls.** A scene on a web page has visible Play/Pause and Replay buttons, real `<button>` elements with text labels, reachable by keyboard, with a visible focus ring from the system. An animation that runs longer than five seconds needs Pause to meet WCAG 2.2.2 (Pause, Stop, Hide). A README card cannot carry controls, so it runs once or loops briefly, never hides text behind a timer, and links to the page that has them.
- **Focus.** Playing never moves focus, never traps it and never makes a focused element disappear. Text inside a scene is real text, or the scene has a text alternative that says the same thing.
- **No JavaScript.** With scripts off, the scene's markup is its final frame: the story is readable, nothing is blank, and no control is shown that cannot work.
- **Narrow screens.** At 358 px the scene is a composition designed for that width, not the desktop one scaled down. A README card uses a `picture` source for a narrow version where GitHub supports it.
- **Contrast and theme.** The words in a scene meet the system's contrast pairs in light and dark, and a card has a background plate so it reads on either GitHub theme.
- **Flashing.** Nothing flashes more than three times a second.

## Approved choreography patterns

Each pattern is a sequence of beats, each beat caused by the one before it. A scene uses one pattern; a film may chain two.

**Causal beat.** One cause, one effect, one result. An agent edits a file; the product's warning appears beside the change; the reviewer's decision becomes available. The effect enters only after the cause has settled, never at the same time.

**Two-party exchange.** Two named parties, each on its own side of the frame, act in turn. One workbench claims an issue; the other starts the same issue and stops, with the product's sentence saying who started first. Turns never overlap, and the side that is not acting stays still.

**Evidence settles.** A result arrives as evidence, not as celebration. A check list fills in one row at a time, the outcome line appears last in the product's words ("Passed together:"), and nothing pulses, glows or bursts. The final frame is the evidence a person would judge.

**Before and after.** The same frame twice, with one change between. Show the state before, hold, show the state after, hold. The change is the only thing that moves. A wipe or crossfade is fine; a morph between unrelated layouts is not.

## Anti-patterns

Each is refused in review on any storytelling surface. Where the system's checker already catches one in product CSS, the reason is in `rules/never.md`.

- **Gradients and glows**: gradient backgrounds or text, glowing or coloured shadows, light leaks, neon edges.
- **Glassmorphism**: frosted panels, backdrop blur, translucent cards over imagery.
- **Card grids** of features with an icon, a bold title and a line of copy each, repeated in threes.
- **Floating shapes**: orbs, blobs, particles, abstract "AI" backgrounds, decorative 3D.
- **Badges** for decoration: "New", "AI-powered", a row of logo chips, star counts, user counts.
- **Generic copy**: a headline that would fit any product ("Supercharge your workflow"), stacked superlatives, invented urgency.
- **Motion without meaning**: anything that fails the three questions above, including scroll-triggered fade-ups on every section, typing effects on headlines, idle loops and counters that count up.
- **Fabricated evidence**: a drawn screen presented as a screenshot, invented numbers, testimonials, logos of customers, a mock terminal showing output the product never printed, a recording retouched to show behaviour that did not happen.

# Independent audit, 22 November 2026

An agent that built none of this system audited version 0.7.0 against the owner's brief (principal design engineer review: eight audits, ten scores, nine deliverables). It worked read-only in a scratch copy, ran the repository's checks, rendered the gallery at 320, 390, 768 and 1280 pixels in both themes and both modes, built six audit-only screens, and read the first consumer's React code at its 0.7.0 adoption. This file records its findings. Its screenshots and compositions were kept outside the repository and are not preserved here.

## Verdict

Approve with conditions. The defects are specific and fixable without a redesign. It is not best-in-class and not yet ready to carry a production React application.

- **What is good.** A disciplined, self-consistent vocabulary with real enforcement: a closed token set, a contrast gate for every theme in both modes, a status set held by tests, a 44px pointer-target test, and an accessibility scan on every gallery example.
- **How it feels.** It does not look like generic AI output: no gradients or card soup, a tight type scale (6 sizes, 3 weights, 3 radii, icons at 16px in 382 of 454 uses), plain specific copy. It reads as built to a rulebook, not art-directed, and the brand kit's identity is absent.
- **Biggest design weakness.** No layout for dense, wide views.
- **Biggest engineering weakness.** The contract with React is untyped and partly unchecked.
- **Preserve.** The status set; the closed tokens with the per-theme contrast gate; cascade layers; native-first dialog, details and popover; the agent-work components; the transcript-following behaviour; the copy standard.

## Scorecard

| Dimension | Score | Evidence |
|---|---|---|
| Visual craftsmanship | 6 | Tight scales. Fails at composition scale; approval actions weaker than Send; four near-amber hues in dark. |
| Brand distinctiveness | 4 | Plex plus amber on charcoal is generic; the kit's identity is not expressed. |
| Design consistency | 7 | Status set enforced by test. Stale status words in data-table examples; two "running" signals in the tool call; 12.2px paddings in 117 places. |
| React architecture | 3 | No React layer. Framework apps are told not to load the custom elements, and the consumer re-implements behaviour, sometimes wrongly. |
| Component API quality | 6 | Consistent block, part and modifier naming with ARIA and `data-state`. 650 classes; composition depends on bundle order; `data-state` unchecked. |
| Accessibility | 6 | Strong intent, scan clean. Menu keyboard model missing; calendar fails reflow; colour-scheme bug; no assistive-technology or cross-browser checks. |
| Component completeness | 6 | Broad and strong for agent activity. Thin diff; no review decision, presence, wide layout or log viewer; everything draft. |
| Theming and tokens | 7 | Excellent gate. `calc()` hides magic numbers; one unpaired 4.24:1 pair; focus equals accent in the Botbench theme. |
| Maintainability | 6 | Zero dependencies; 156 unit and 1,577 browser tests pass. 310 KB single stylesheet; no screenshot comparison; Chrome only. |
| Product readiness | 5 | Six stress screens got zero checker findings and zero scan violations, and two are visibly broken. |

## Top ten findings

1. **High, confirmed. The menu has no keyboard model.** Menu, context menu and split button use `role="menu"` and ship no keyboard behaviour. `components/menu/meta.json` promises arrow keys from a behaviours module that does not exist, and that Tab closes the menu. In Chrome, ArrowDown does nothing and the menu stays open after Tab.
2. **High, confirmed. The Botbench theme's default dark mode leaves `color-scheme: light`.** `base/reset.css` sets the scheme from `data-theme` only, and the theme's default-mode block sets dark tokens without it. Native controls draw for a light page: the date picker's icon is nearly invisible. The consumer ships this path, and no test checks the scheme.
3. **High, confirmed. No typed or checked contract, and drift is visible.** The checker accepts any `data-state` value. The consumer has 11 busy-button copies with 4 disabled behaviours and 3 shapes of field-error wiring. Its transcript forces scroll to the bottom on every row, so jump to latest never shows.
4. **High, confirmed. No dense or wide layout.** `ds-container` caps content at 720px. `overflow-wrap: anywhere` in `avatar.css` and `data-table.css` makes an eight-agent table wrap names letter by letter at 1280px while about 40% of the screen is empty.
5. **Medium, confirmed. The calendar fails reflow at 320px.** Its 308px minimum width pushes the page to 327px; the last column and the next-month button are cut off. The open split-button menu overflows by 30px.
6. **Medium, gap confirmed. Nothing has run outside Chrome.** The system is phone-first and depends on the Popover API, anchor positioning, invoker commands, interest invokers, `:has()` and `field-sizing`.
7. **Medium, confirmed. The visual tests do not compare.** The suite overwrites the committed screenshots on every run. A regression is caught only if a person looks.
8. **Medium, confirmed. Token arithmetic hides magic numbers.** About 200 `calc()` expressions across 73 component stylesheets, such as `size-touch * 6.5`. A 20px size is built from two spacing tokens in 8 places. The checker does not flag fractional multipliers.
9. **Medium, confirmed visually. One amber does too many jobs in the Botbench theme.** Focus, primary, selected tab, switch-on and the pending count share one colour; focus against accent is 1.00:1, so the ring merges with a selected tab's underline. The pending tray uses the accent as a status, against the theme's own note.
10. **Medium, confirmed. The code-review pieces are thin.** The diff is unified only, with no line numbers. There is no review-decision component, so the consumer built one. The data-table examples use pre-0.7 status words with no badges.

**Lower findings.** Everything is `draft`. The stylesheet is 310 KB (57 KB compressed) with no way to take part of it. Font sizes are in pixels. `muted` on `surface-sunken` is 4.24:1 in the default light theme and absent from the contrast pairs. The command palette's no-match message toggles `hidden` on a status element and may not be announced. A long command becomes the whole accessible name of a tool call's summary. Spinner keyframes are duplicated nine times.

## What the system's own checks cannot see

The menu keyboard failure; the colour-scheme bug (tests check background colour only); overflow at 320px (tests run at 390px and 1280px); broken real compositions (the structural rules are anti-slop heuristics, not layout checks); invalid `data-state` values; wrong ARIA on system classes, a missing `alt`, an empty button, a badge whose tone contradicts its word; `calc()` multipliers; visual regressions; anything outside Chrome; drift in a consumer's behaviour; contrast pairs that are used and not listed.

## The six stress screens

| Screen | Result | The system lacks |
|---|---|---|
| Dashboard for eight agents | Broken at 1280px | A compact agent tile and a wide layout |
| Code review | Diff clipped | A review decision |
| Execution log | 4,840px tall on a phone | A capped log viewer |
| Mobile approval | Works | A risk-led hierarchy |
| Settings | Works | Nested navigation |
| Two-developer collaboration | Works | Presence and ownership |

## Not verified

WebKit, Firefox and iOS behaviour; screen-reader output; 200% zoom as such (a 320px viewport stood in); the consumer's end-to-end suite; Linear's product, for the reference comparison. Radix Dialog, React Aria Menu and ComboBox, and the Primer primitives and Button pages were read.

## Findings in the consumer, passed to its own session

The transcript forces scroll on every row; busy buttons and field errors are wired several ways; one prop silently overrides another in the confirm component; stale list reads; two event streams per screen; focus lands on the page body after a confirm.

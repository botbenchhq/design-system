# Storytelling companion

A method for the public face of a product: marketing pages, READMEs, animated scenes, README cards, product films and social previews. It tells an agent how to find out what is true about a product, decide what one surface should say, show it with motion that explains cause and effect, label what is real and what is drawn, and check the result before anyone publishes it.

It is opt-in. Nothing in `rules/` points here, the build does not copy this folder into `dist/`, and an app that vendors the design system gets none of it. A product team that wants it installs the two agent skills in [`skills/`](skills/) and reads the files below.

## When to use it

Use it for anything a person meets before they use the product, or instead of using it:

- a marketing or landing page, a docs landing page, an evidence page;
- a repository README and the card at its top;
- a scene: a short authored animation on a web page that shows the product doing one thing;
- a product film: a recorded or replayed walkthrough with title cards;
- a social preview image.

Do not use it for the product's own interface. A screen inside the app follows `rules/` alone, and its motion rule stays as `rules/never.md` writes it: motion confirms a change of state and nothing else.

## How it relates to the system's rules

| Concern | Product UI | Surfaces this companion covers |
|---|---|---|
| Tokens, components, contrast, focus, pointer targets | `rules/` | `rules/`, unchanged. The companion adds no token, theme or class |
| Motion | Duration tokens and `--ds-ease`, colour and opacity, state changes only | The same for interface feedback; story beats in a scene may run 240 to 450 ms, and films may move a camera for 600 to 900 ms. See [motion.md](motion.md) |
| Copy | `rules/content.md` | `rules/content.md`, plus the truth sheet and labelling rule in [procedures.md](procedures.md) |
| Review | `rules/review-rubric.md` | The gates and per-surface checklists in [quality-gates.md](quality-gates.md) |

The looser timing is stated here openly and applies only on the surfaces above. It never applies inside a product screen, never to hover, press, tab or theme feedback, and never as a way past a checker. A consuming site that runs the design system's checker over a scene declares each longer duration with an inline `ds-waive raw-duration` comment that gives the reason and names this file, as `docs/consumer-guide.md` describes. No arithmetic on tokens to hide a number.

## Files

| File | Holds |
|---|---|
| [motion.md](motion.md) | Principles, the timing scale mapped to the tokens, accessibility requirements, approved choreography patterns and anti-patterns |
| [procedures.md](procedures.md) | Discovery and the truth sheet, product-marketing context, a Stageshow scene, a ChanMeng README card, a product film, a social preview: inputs, steps, tools, outputs, validation and the labelling rule for each |
| [quality-gates.md](quality-gates.md) | The gates every surface passes, a checklist per surface and the independent review roles |
| [registry.md](registry.md) | The upstream skills, pinned by revision, with install commands, licence, what each governs and what it must not, the overrides of their defaults, and the ones not adopted |
| [examples.md](examples.md) | Finished work that followed the method |
| [skills/product-storytelling/SKILL.md](skills/product-storytelling/SKILL.md) | The agent skill that runs the method from discovery to a finished surface |
| [skills/storytelling-review/SKILL.md](skills/storytelling-review/SKILL.md) | The agent skill that reviews a finished surface against the gates |

## The two skills

The two skills split one job so they never give competing instructions. `product-storytelling` makes things: it builds the truth sheet, picks the procedure, routes each concern to the one upstream skill that governs it, and stops at a candidate with its evidence. `storytelling-review` judges things: it reads the candidate, the truth sheet and the evidence, and reports findings that cite what it observed. The maker never certifies its own work, and the reviewer never fixes it.

Install them by copying, from a checkout of this repository at a tagged release or a commit:

```sh
git clone https://github.com/botbenchhq/design-system.git
git -C design-system checkout <tag or commit>
mkdir -p .claude/skills
cp -R design-system/storytelling/skills/product-storytelling design-system/storytelling/skills/storytelling-review .claude/skills/
```

Each skill reads the companion's other files from that checkout, so keep it at the same revision as the copied skills.

## Disk budget

Rendering and capture fill disks quickly. Check `df -h /` before an install, a render or a capture. Keep one agent's work under 4 GB, delete intermediate frames once the contact sheet and outputs exist, render films at 30 fps and device scale 1 unless one frame needs 2, and stop and report when free space falls under 5 GB. A clone of this repository need not check out the committed screenshots: `git sparse-checkout set --no-cone '/*' '!/test/visual/screenshots/'` leaves out about 230 MB.

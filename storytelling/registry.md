# Upstream skill registry

The skills this method uses, pinned to the revision that was read when it was written (25 November 2026). Upgrade a pin only after reading the new revision's SKILL.md, references and scripts, and update this file in the same change. Nothing from these repositories is copied into this one; each is linked and summarised.

## Pinned revisions

| Repository | Revision | Licence | Skills | Status |
|---|---|---|---|---|
| [benjitaylor/skills](https://github.com/benjitaylor/skills) | `299140fafd08df55a9c234e610c3f64af3f45531` | MIT (`stageshow/LICENSE`); upstream app-icon artwork excluded | `stageshow` | Adopted |
| [rizaardiyanto1412/stageshow-js](https://github.com/rizaardiyanto1412/stageshow-js) | `462eae8bcec7d4e039ccb325a842fe594a7cb725` | MIT | `stageshow-js` | Adopted, for pages with no framework |
| [ChanMeng666/chanmeng-svg-animation-studio](https://github.com/ChanMeng666/chanmeng-svg-animation-studio) | `539208618e6ca68963474f77921f62e39713bb0e` | MIT | `chanmeng-svg-product-card` | Adopted |
| [display-dev/product-film](https://github.com/display-dev/product-film) | `fd9db88a76945bbd1d678739cad411c1a61bce1e` | MIT | `product-film` | Adopted |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `672ae44ace6aaed65b86cbb1e2fd6fbea0e79578` | MIT | `better-motion`, `better-ui` | Adopted |
| [emilkowalski/skill](https://github.com/emilkowalski/skill) | `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` | MIT | `review-animations`, `emil-design-eng` | Adopted, second reader |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `9e460a87ef338ee9d12c7beed8fedc597a5af5f7` | Apache 2.0 | `impeccable` (critique, audit, detect) | Adopted, critique |
| [nutlope/hallmark](https://github.com/nutlope/hallmark) | `04977e15f3dfd6ee4b74c887dac3eb52665d6c92` | MIT | `hallmark` | Adopted, quality floor |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `d1a2bb41d927083ac7118f60cfc9cdf711810ea0` | MIT | `taste-skill` | Critique only, not installed |
| [anthropics/skills](https://github.com/anthropics/skills) | `e4bb5d960d87126ff3b3a8af1a104b7db67560ba` | Apache 2.0 | `frontend-design` | Critique only, not installed |
| [shouvik12/living-canvas](https://github.com/shouvik12/living-canvas) | `14a4a4f160d951d9745090a8c7f4822edd32bb18` | MIT | `living-canvas` | Adopted, explanatory diagrams |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `8fd2fcade2fd6629026e9dfe6d133b55b36968b9` | MIT | `product-marketing`, `copywriting`, `cro` | Adopted |
| [Pageree/landing-page-guru-skill](https://github.com/Pageree/landing-page-guru-skill) | `32ddf8bdf2e86f432a79c092987154204b236145` | MIT | `landing-page-guru-skill` | Adopted |
| [jezweb/claude-skills](https://github.com/jezweb/claude-skills) | `1260fa7439b36b18dbf16648ccc7fb44783f6c23` | MIT | `product-showcase` (frontend plugin) | Adopted, discovery and capture only |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT | GSAP skills | Not adopted |
| [latent-spaces/brag](https://github.com/latent-spaces/brag) | `06379432a9243c951dfcc051153be18d2d261044` | MIT | `brag`, `brag-slim` | Not adopted |
| [rossark0/rossark-motion-skill](https://github.com/rossark0/rossark-motion-skill) | `9b20964e32f07f8ac7e2948cd175746fa4a7712f` | MIT | rossark-motion | Not adopted |
| [Anshgrover23/product-demo-playbook](https://github.com/Anshgrover23/product-demo-playbook) | `3a0810b57b9f48aba5fe3a2c169a90e71021bd01` | None published | `product-demo` | Read for method only |

## Who governs what

One owner per concern, so skills never give competing instructions. Every skill not named as owner may only raise a finding about that concern.

| Concern | Governs | Must not govern |
|---|---|---|
| Positioning, messaging, page purpose, call to action | marketingskills (`product-marketing`, `copywriting`, `cro`), landing-page-guru | Visual style, motion, what is true about the product |
| Product discovery and capture | product-showcase | Final visuals (it uses a Tailwind CDN and does not label mockups), claims beyond the truth sheet |
| Visual direction critique | Impeccable (critique, audit, detect), Hallmark's quality floor, Taste, frontend-design | Tokens, theme, fonts or palette: each brings its own, and none is adopted |
| Motion values and interaction rules | better-motion and better-ui; Emil Kowalski as second reader | The timing scale in [motion.md](motion.md), the product UI's motion rule |
| Web product scenes | Stageshow (the kit, pinned) | The look: a scene takes the site's tokens and theme |
| README cards | ChanMeng product-card kit (its kit, validator and frame capture) | Colours and marks: the product's approved ones, unchanged |
| Films | product-film (deterministic HTML timeline, Playwright, FFmpeg) | Frame rate and scale over the disk budget; labelling, which follows [procedures.md](procedures.md) |
| Explanatory illustration | Living Canvas, only where a diagram explains better than a screen | Anything a real screen can show |
| Tokens, components, accessibility floor | The design system's `rules/` | Nothing here overrides them |

## Install

Install only what the procedure in hand needs, into the project that makes the surface, never into this repository. Where the upstream README gives an `npx skills` command, use it with the pinned revision checked afterwards; where it gives a plugin or a clone, use that. For a reproducible install of any of them, clone and check out the pin, then copy the skill folder into `.claude/skills/`:

```sh
git clone https://github.com/<owner>/<repo>.git /tmp/<repo>
git -C /tmp/<repo> checkout <revision>
cp -R /tmp/<repo>/<path to skill> .claude/skills/
```

| Skill | Upstream instruction | Path at the pin |
|---|---|---|
| Stageshow | `npx skills add benjitaylor/skills --skill stageshow` | `stageshow/` |
| stageshow-js | `npx skills add rizaardiyanto1412/stageshow-js --skill stageshow-js` | repository root |
| ChanMeng product card | `npx skills add ChanMeng666/chanmeng-svg-animation-studio` | `skills/chanmeng-svg-product-card/` |
| product-film | `npx skills add display-dev/product-film --skill product-film` | `skills/product-film/` |
| better-motion, better-ui | `npx skills add jakubkrehel/skills` | `skills/better-motion/`, `skills/better-ui/` |
| Emil Kowalski | `npx skills@latest add emilkowalski/skills` | `skills/review-animations/`, `skills/emil-design-eng/` |
| Impeccable | `npx impeccable install`; detector `npx impeccable detect <dir or URL>` | `.claude/skills/impeccable/` |
| Hallmark | `npx skills add nutlope/hallmark -g --agent claude-code` | `skills/hallmark/` |
| Living Canvas | `git clone https://github.com/shouvik12/living-canvas ~/.claude/skills/living-canvas` | repository root |
| marketingskills | `npx skills add coreyhaines31/marketingskills --skill product-marketing copywriting cro` | `skills/<name>/` |
| landing-page-guru | `npx skills add Pageree/landing-page-guru-skill` | `skills/landing-page-guru-skill/` |
| product-showcase | `/plugin marketplace add jezweb/claude-skills`, then install the frontend plugin | `plugins/frontend/skills/product-showcase/` |
| Taste, frontend-design | Read at the pin; not installed | `skills/taste-skill/`, `skills/frontend-design/` |

## Overrides of upstream defaults

Where a skill's default conflicts with this standard, this standard wins:

- **Stageshow** allows a small overshoot, curves of 0.8 to 2.7 s, height and blur animation, and has no visible Play/Pause. Here: no overshoot, story beats no longer than 450 ms, transform and opacity only, visible Play/Pause and Replay.
- **better-motion**'s blur on enter and exit is not used. **Emil Kowalski**'s bounce springs are not used.
- **Taste** and **frontend-design** are critique only and not installed: they bring their own palettes and hooks.
- **product-showcase** is for discovery and capture only: it loads Tailwind from a CDN and does not label mockups.
- **marketingskills**: `page-cro` is now `cro`, and the shared context file is `.agents/product-marketing.md`.
- **product-film** renders at 60 fps and device scale 2 in some routes; here 30 fps and scale 1 unless a frame needs 2.
- **No checker is routed around.** A longer duration is stated openly and waived with a reason, never disguised as `calc()` to pass `raw-duration`.

## Evaluated and not adopted

- **GSAP** (gsap-skills): adds a runtime animation library; CSS and Stageshow's own motion parts cover the need.
- **brag** and **rossark-motion**: overlap Stageshow and product-film, and would give a second owner to scenes and films.
- **product-demo-playbook**: no licence is published, so it is read for method only and nothing from it is used.

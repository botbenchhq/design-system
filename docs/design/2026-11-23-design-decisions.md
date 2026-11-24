# Design decisions on the Botbench redesign, 23 November 2026

A record of what was decided, by whom and when. The owner of Botbench and of this design system decided everything below on 23 November 2026, in two rounds: the first after the second iteration of the redesign had been put on the design canvas in three colour directions, the second after the refinement pass that followed. Nothing here was decided by a designer or an agent.

**What is and is not approved.** The direction is approved. The final boards were sent to the owner as a PDF and are not yet visually approved. Full visual review and approval of production behaviour are pending.

The [visual specification](2026-11-23-graphite-glacier-visual-specification.md) of the same date is built on these decisions and lists the questions they leave open.

## First round

### The direction

- Direction A, Graphite + Glacier, is approved. No more colour identities are explored.
- The information architecture of iteration 2 stays. The work is not restarted.
- One final refinement pass follows, then the final visual specification.

### Refinements the owner asked for

1. Use the real Botbench brand mark (the two-part logo), not a coloured rounded square.
2. Review: simplify the evidence panel. The order is the verification result, then changed files, then limitations, then supporting activity. An automated check stays visibly distinct from a model's review, an agent's statement, and an unverified change.
3. Decision panels become a little lighter. A routine review is neutral. Risky execution earns stronger attention. A destructive operation looks genuinely different.
4. Home is a true work queue. The headline stays ("3 things need you, 2 are in progress"). What the sidebar repeats is removed. It must stay understandable at twenty and at fifty concurrent items.
5. No "Planned" labels inside the application frame: they read as a task's state. Speculative items are named in the note beside the board instead.
6. Truncated titles: the full name is available on hover and focus (a `title` attribute) and in the selected item.
7. A is to gain a little warmth and personality through typography, surface treatment and the real brand, not through more colour.

### Product decisions

- **Stale evidence blocks the normal Accept.** Evidence is called current only when it is tied to the exact commit under review. A newer commit, uncommitted changes or an invalidated result remove the normal Accept. The recovery is "Run checks again" or "Inspect changes", by cause.
- **Checks that were never set up are a different, honest state** ("No checks are set up"). Accepting is still possible there, subject to policy, and is never called verified.
- **An explicit unverified-accept override**, if ever built, is clearly different, intentional and logged. It is not drawn now.
- **Names.** Home is the summary and triage view. Work is the complete searchable inventory of tasks, runs and chats. Home's groups are Needs you, In progress, Blocked, Completed. (The second round renames Blocked to Waiting.)

### To build

- Blocked as its own group. (Named Waiting by the second round.)
- Attention ordered by simple, stated rules: an approval blocking an agent and an urgent failure come before a routine review. No opaque ranking.
- The intent picker beside the composer.
- A note sent with Resume.
- Stop on a single task.
- Layouts at 768px and 1280px, in addition to today's switch. (The second round confirms that the 1024px switch stays.)

### Deferred, and not drawn

- "Pick up where you left off".
- The agreement summary across agents.
- A default model per agent.

### Dropped

- Single-key Accept and Reject. No single keypress may accept, reject, allow, or confirm a destructive or elevated-risk action. Shortcuts are for navigation. The A, R, D and C key hints are removed from decision buttons.

## Second round, after the refinement pass

Direction A stays approved. There is no further broad redesign: these corrections are finished, the tokens are reconciled with the design system, and the work goes to a pull request with screenshots, tests and an explicit list of what needs product or backend work.

1. **Failures.** A failure that can be recovered is under Needs you. Completed means successful outcomes only. A terminal failure stays discoverable in Work with its real Failed state. Failures are never hidden.
2. **Files left behind by checks.** They block selectively. A changed tracked source or configuration file, or an untracked file that could affect the reviewed result, the checks or the deliverable, removes acceptance readiness. Ignored, harmless artifacts such as coverage output do not block Accept by themselves: they are disclosed and cleaned up. Verification must correspond to the exact artifact accepted.
3. **Accepting without checks.** An outlined, secondary button labelled "Accept without verification", with the explanation that no checks ran. Never a green success treatment. Never offered as a way round failed or stale checks.
4. **Terminology.** The voice guide stays: the word "Blocked" is not shown. The group is "Waiting", and each item has a concrete cause: "Waiting on usage limit", "Waiting on dependency" (another task), "Waiting on teammate" (a paired workbench). "Needs you" is for what requires the owner.
5. **Breakpoints.** Today's 1024px transition stays, with adaptations at 768px and 1280px: three panes on a wide desktop, two in between, one pane with a sheet-based inspector on smaller screens. The content width actually available is validated, not only the breakpoint numbers.
6. **Tokens.** A fourth surface token only for a distinct semantic role. A borderless variant for decorative panels is fine, but pane boundaries in dark must not be invisible everywhere: panes (navigation, inspector) and interactive controls keep clear separation.

### Further corrections

- A refused command keeps "See the rule" and "Send a note". The product can make an active run's mode stricter: "Make the mode stricter" is in the run's own control menu, never offered as a way to make a refused command permissible.
- "Always allow" has no hover-only explanation. A focusable disclosure that works on touch and keyboard states exactly what is authorised, its scope, and whether the grant persists.
- The Settings boards for execution environments and workbench identity, and the 768px layout, are finished before the specification is called complete.
- Three things stay separate in the plan and in the specification: changes that can ship as styling; interactions that can ship on existing backend capabilities; and new correctness guarantees that need engineering, above all verification freshness and safe acceptance. The biggest risk is a polished interface that promises behaviour the system does not guarantee.

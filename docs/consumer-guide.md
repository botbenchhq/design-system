# Using the design system in an app

An app takes the system as a copy inside its own repo. The copy holds the stylesheet, the fonts, the icons, the component index, the rules for agents and the checker. Nothing loads from another host, and the app gains no dependency.

The examples use `vendor/design-system/` for the copy and `app` for the app's class prefix. Use your own names.

## 1. Sync the copy

From the app's repo, with the design system's repo checked out beside it:

```sh
node ../design-system/scripts/sync.mjs --to vendor/design-system
```

This copies `dist/` and writes `hashes.json`, the SHA-256 of every file. Commit the whole directory. The copy carries the system's `LICENSE` and `NOTICE` with it.

The copy is read-only. The checker verifies the hashes first on every run and stops with `vendored-file-changed` when a file differs. To change the system, change it in the design system's repo and sync again.

## 2. Load the stylesheet

`design-system.css` is the whole system: tokens, reset, base styles, font faces and components. It loads the fonts by relative URL, so serve `fonts/` beside it. The icon sprite is `icons.svg` in the same directory. To use a theme, such as Botbench, link its stylesheet after this one, as step 12 describes.

### Plain HTML

Serve `vendor/design-system/` as static files and link the stylesheet.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tasks</title>
    <link rel="stylesheet" href="/vendor/design-system/design-system.css">
    <link rel="stylesheet" href="/src/components/run-ledger.css">
  </head>
  <body>
    <main class="ds-container ds-stack">
      <h1>Tasks</h1>
      <button type="button" class="ds-button ds-button--primary">New task</button>
      <section class="app-run-ledger" aria-label="Cost of the last run">
        <p>Tokens in: 18,204</p>
        <p>Tokens out: 2,310</p>
      </section>
    </main>
  </body>
</html>
```

### Behaviours, for an app without a framework

The components are CSS, and nearly all of them work from native elements alone. A few need script: tabs, the combobox and the command palette move ARIA attributes as the reader acts, a time that counts up is written again each second, and a transcript that grows follows its newest row. `behaviors/` holds five optional ES modules with no dependencies, each defining one element. Load the ones the app uses, once each, and wrap the component's markup from `components.json` in the module's element.

| Module | Element | What it does |
|---|---|---|
| `behaviors/tabs.js` | `<ds-tabs>` | For the tabs component: sets `aria-selected`, `tabindex` and `hidden`, and handles click, Left, Right, Home and End. |
| `behaviors/combobox.js` | `<ds-combobox>` | For the combobox component: as the reader types it sets `hidden` on the options that do not match, `aria-expanded` and `aria-activedescendant` on the input and `aria-selected` on the active option, and writes the count into the `role="status"` line. It handles Down, Up, Home, End, Enter, Escape and a press on an option. |
| `behaviors/command-palette.js` | `<ds-command-palette>` | For the command palette component: filters the commands as the reader types, hides a group left with no match, sets `aria-selected` and `aria-activedescendant` as Down and Up move the selection, presses the selected command on Enter and closes the dialog. With `shortcut="k"` it opens the dialog on Ctrl+K and Cmd+K. |
| `behaviors/elapsed.js` | `<ds-elapsed>` | A time that counts up, for a tool call, a step group, the now-doing line and the run timeline: it shows the time since its `datetime` attribute and writes it again once a second, stops when its `data-state` is anything but `running`, and shows a fixed length when it has a `duration` attribute. It carries `aria-live="off"`, so no tick is announced. |
| `behaviors/transcript.js` | `<ds-transcript>` | For a transcript that grows: it keeps the newest row in view while the reader is within 60px of the bottom, stops when they scroll up, counts the rows added since and shows the jump-to-latest control, and follows again when they press it or reach the bottom. It sets `hidden` and the count, and never moves focus. |

```html
<script type="module" src="/vendor/design-system/behaviors/tabs.js"></script>
<script type="module" src="/vendor/design-system/behaviors/combobox.js"></script>
<script type="module" src="/vendor/design-system/behaviors/command-palette.js"></script>
<script type="module" src="/vendor/design-system/behaviors/elapsed.js"></script>
<script type="module" src="/vendor/design-system/behaviors/transcript.js"></script>
```

Each is an external script from the app's own host, so a content security policy that allows no inline script lets it run. Each sets attributes only, never a class or an inline style. An app that renders with a framework loads none of them: its own components set the same ARIA attributes and handle the same keys, and the stylesheet draws the same result.

### Agent activity, from a framework

The components that show an agent working take their state from one attribute, `data-state`, which the app's own components set on the element named below as the run moves on. The stylesheet draws each state's icon and colour from that attribute. Nothing toggles a class, and every word on the screen is the app's own text. Start from the `agent-run` pattern in `components.json`, which shows them together.

| Component | Element that carries `data-state` | Values | What else the app sets |
|---|---|---|---|
| `tool-call` | The root, `ds-tool-call` | `requested`, `awaiting-approval`, `running`, then one final value: `succeeded`, `failed`, `declined`, `timed-out` or `cancelled` | `open` on its details element while it awaits approval and when it has failed. The actions part, with Allow and Decline, only while it awaits approval. A retry is a new row. |
| `message`, the agent's text | The row, `ds-message` | `streaming`, `stopped`, `interrupted`, `reconnecting`, `done` | `aria-busy="true"` and the caret element while streaming. A `ds-message__state` line for stopped, interrupted and reconnecting, and a Retry button for interrupted. |
| `step-group` | Each callout in the summary, `ds-step-group__callout` | `running`, `awaiting-approval`, `failed` | `open` on the group: set while a step in it is running or awaits approval and when one has failed, removed when all have ended well, unless the reader has toggled the group. The summary sentence, counted from the steps. |
| `now-doing` | The root, `ds-now-doing` | `running`, `waiting` | `hidden` when nothing runs and nothing waits. The link to the request, in the waiting form. |
| `run-timeline` | Each station, `ds-run-timeline__station` | `done`, `running`, `waiting`, `failed`, `not-started` | `aria-current="step"` on the station the run is at. |
| `jump-to-latest` | None | | `hidden` on the block while the reader is at the bottom, and the count as text. |
| `activity-announcer` | None | | One sentence of text, when the run starts, needs approval, finishes, stops or fails. |

What the two modules do, a framework app does in its own components:

- **Following the transcript.** Keep the newest row in view only while the reader is within about 60px of the bottom. Stop when they scroll up, count the rows added since, and show `jump-to-latest` with that count. Follow again when they press it or reach the bottom. Never move focus.
- **Times that count up.** Render the time as text in a span with `aria-live="off"`, update it once a second, and stop at the total when the step ends.
- **Opening groups.** No module does this. Set `open` by the rule in the table, and listen for the `toggle` event so a group the reader opened or closed is left alone.
- **Announcing.** The transcript is an element with `role="log"`, `aria-live="off"` and a name. The only thing that speaks is the one `activity-announcer` region, at the five moments in the table. Never put `aria-live` on text that is arriving.

### Tailwind 3

Import the stylesheet from the app's entry script, or from its CSS entry, so the bundler copies the fonts.

```js
import "../vendor/design-system/design-system.css";
import "./index.css";
```

Use the preset in `tailwind.config.js`:

```js
import preset from "./vendor/design-system/tailwind-preset.js";

export default {
  presets: [preset],
  corePlugins: { preflight: false },
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

Two conditions are the app's job:

- **Turn preflight off**, as above. The system's reset already sets what utilities assume.
- **Write no rules in Tailwind's base layer.** Delete any `@layer base { … }` block from the app's CSS.

The reason is the same for both. Tailwind emits preflight and base-layer rules unlayered, and unlayered CSS beats every layered rule. Either would override component styles on the same property.

The app's CSS entry is then only this:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

The preset replaces every Tailwind scale with token names. In screen markup, utilities are for layout, spacing and sizing only: `flex`, `gap-md`, `p-lg`, `w-full`, `md:grid-cols-2`. A colour, border, radius, shadow or type utility is a finding. `md:` is the only variant, at 768px.

## 3. Add the config file and the gaps file

`design-system.config.json`, at the root of the app:

```json
{
  "paths": ["src"],
  "appPrefix": "app",
  "gaps": "design-gaps.json",
  "vendorDir": "vendor/design-system"
}
```

| Key | Holds |
|---|---|
| `paths` | The directories and files to scan, relative to the config file. |
| `appPrefix` | The prefix of the app's own classes, without the hyphen. |
| `gaps` | The path of the gaps file. |
| `vendorDir` | The vendored copy. The checker verifies it and does not scan it. |

These four keys are the whole file. There is no key that switches a rule off.

`design-gaps.json` lists every app-local component:

```json
{
  "gaps": [
    {
      "name": "Run ledger",
      "reason": "No catalogue component shows a run's cost lines.",
      "classes": ["app-run-ledger"],
      "files": ["src/components/run-ledger.css"]
    }
  ]
}
```

| Key | Holds |
|---|---|
| `name` | What the component is. |
| `reason` | Why no catalogue component fits. |
| `classes` | Every class the component defines. Each starts with the app's prefix. |
| `files` | The files that implement it, relative to the gaps file. A script file listed here may style the component with visual utilities. |

Start with `"gaps": []`.

## 4. When no component fits

1. Read `vendor/design-system/rules/choosing-components.md`, search `components-index.json` by purpose, and read the "when not to use" entries in `components.json`.
2. Compose catalogue components with the layout classes.
3. If the need is still unmet, build an app-local component: classes under the app's prefix, values from tokens only, and an entry in the gaps file.

```css
.app-run-ledger {
  display: grid;
  gap: var(--ds-space-sm);
  padding: var(--ds-space-md);
  border: var(--ds-border-width) solid var(--ds-color-border);
  border-radius: var(--ds-radius-md);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-mono);
}
```

Every run prints the declared gaps, so each one is seen in review. A gap that several apps share belongs in the catalogue: raise it in the design system's repo.

## 5. Run the static scan in the test command

```sh
node vendor/design-system/checker/check.mjs --config design-system.config.json
```

It exits 0 when clean, 1 on findings and 2 when it could not run. Put it in the app's ordinary test command, so it gates work from any agent or tool:

```json
{
  "scripts": {
    "test": "node vendor/design-system/checker/check.mjs --config design-system.config.json && node --test"
  }
}
```

The scan reads CSS, HTML, JSX, TSX and class names in script. A finding names the file, the line, the rule and the fix. `vendor/design-system/rules/checker-rules.md` explains every rule.

The one exception to a rule is an inline waiver, a comment on the line of the finding or the line before it:

```css
/* ds-waive off-scale-spacing: the canvas library needs a 3px offset to line up with its grid */
```

A waiver without a reason is itself a finding, and so is one that matches nothing.

## 6. Run the rendered check in the end-to-end tests

The rules about structure need the rendered page: one primary action per view, the disclosure limits, nested and identical cards, badge clutter, emoji, stock phrases, and a view whose controls use no system component at all. `check-dom.js` holds them as one script that defines `dsCheckDom()`. It returns a list of `{ rule, message, fix, snippet }`.

With Playwright:

```js
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const checkDom = readFileSync("vendor/design-system/check-dom.js", "utf8");

async function expectNoDesignFindings(page) {
  await page.evaluate(checkDom);
  expect(await page.evaluate(() => dsCheckDom(document.documentElement, { appPrefix: "app" }))).toEqual([]);
}

test("the task list follows the design rules", async ({ page }) => {
  await page.goto("/tasks");
  await expectNoDesignFindings(page);

  await page.getByRole("button", { name: "New task" }).click();
  await expectNoDesignFindings(page);
});
```

Evaluate the file's text, as above. Injecting it as a script tag fails under a content security policy that allows no inline script.

Call it once on each screen, and once more with each overlay open: every dialog, sheet, menu and popover. An open overlay is a view of its own, with its own primary action. Call it after the screen has its data, so lists and badges are counted.

`dsCheckDom()` takes two optional arguments: the element to check, which is the whole document when left out, and an object of options. The one option is `appPrefix`, the same prefix as in `design-system.config.json`. The rendered page cannot tell the app's prefix, and the rule `unstyled-controls` needs it: a view with buttons or form controls fails when none of them carries or sits inside an element with a `ds-` class or a class with the app's prefix. Without the option, a view built only from app-local components is reported. `dsCheckDom()` and `dsCheckDom(element)` work as before.

That rule is the only check that a screen uses the system at all. The rendered check does not read computed styles, so it does not tell whether the fonts loaded or whether every colour, radius and shadow on the page is a token value. The static scan covers what the app's own files write. An app that wants the computed check as well may add its own assertions to the same tests, reading the allowed values from `tokens.json`.

### Optional: an accessibility scan

The system ships no accessibility scanner. Its own gallery is tested with axe, which says nothing about a screen an app composes. To scan the app's screens, add `@axe-core/playwright` to the app's development dependencies and run it beside the rendered check:

```sh
npm install --save-dev @axe-core/playwright
```

```js
import AxeBuilder from "@axe-core/playwright";

async function expectNoAccessibilityViolations(page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target.join(" ")) }))).toEqual([]);
}
```

Call it where `expectNoDesignFindings` is called: on each screen, and again with each overlay open. Run it in light and in dark, because contrast differs between the two.

## 7. Put the summary line in each pull request

The scan ends with one line:

```
0 findings, 0 waivers, 1 declared gap, 14 files scanned, 41 rules
```

The last figure is how many rules this copy of the checker holds. It rises when a sync brings new rules.

Paste it into the description of every pull request that touches the interface, with the list of waivers and declared gaps printed above it when there are any. A reviewer reads new waivers and new gaps first.

## 8. Tell agents where the rules are

In the app's agent instructions (`AGENTS.md`, `CLAUDE.md` or the like), say:

- Read `vendor/design-system/rules/core.md` before any interface work. It is short, and it says when to open the longer files beside it.
- Choose a component or a page pattern from `vendor/design-system/components-index.json`, which lists each one's name, kind, title, purpose, status and classes. Then open that one entry in `vendor/design-system/components.json` for its guidance and markup. The full file is large, so search it for the entry's name and do not read it whole.
- Never edit `vendor/design-system/`.

## 9. Optional: a Claude Code hook

The test and end-to-end commands are the gate. A hook gives Claude Code the same findings sooner. `vendor/design-system/hooks/claude-settings.example.json` is a fragment to merge into the app's `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/vendor/design-system/hooks/claude-hook.mjs", "${CLAUDE_PROJECT_DIR}/design-system.config.json"]
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["${CLAUDE_PROJECT_DIR}/vendor/design-system/hooks/claude-hook.mjs", "${CLAUDE_PROJECT_DIR}/design-system.config.json"]
          }
        ]
      }
    ]
  }
}
```

Before an edit, the hook denies a change to a file inside `vendorDir`. After an edit, it runs the static scan on the edited file when that file is CSS, HTML, JSX, TSX, JavaScript or TypeScript under the config file's `paths`, and shows any findings to the agent. Change the two paths in the fragment if the copy or the config file lives elsewhere.

Other tools do not run this hook, which is why the test command stays the gate.

## 10. Update

Run the sync command from step 1 again. Before writing anything it prints what changed:

```
The design system 0.1.0 -> 0.2.0 in vendor/design-system
Components added: dialog, toast
Components changed: button
Components removed: none
Patterns added: app-shell
Patterns changed: sign-in
Patterns removed: none
Rules added: placeholder-as-label
Rules removed: none
Wrote 131 files and hashes.json
```

Read those lines. A new rule may produce findings in screens that passed before, and a changed component or pattern may need its markup updated: look it up in `components.json`. `CHANGELOG.md` in the design system's repo says what each version changed. Then run the test and end-to-end commands and commit the copy with the fixes.

Sync stops without writing when a file in the copy was edited by hand, and names the files. Restore them from version control and sync again.

To learn whether a newer version exists without changing anything:

```sh
node ../design-system/scripts/sync.mjs --check --to vendor/design-system
```

It prints one line when the design system's checkout holds a newer version than the copy, and nothing otherwise. It always exits 0, also when the checkout is not there, so it is safe in a script that runs where only the app is checked out.

## 11. Upgrading from 0.5

Version 0.6.0 renames the system and changes its prefix from `gw` to `ds`. Nothing else changes: every component looks and behaves as it did. The copy now lives in `vendor/design-system/`, the stylesheet is `design-system.css`, the tabs module is `behaviors/tabs.js` and the config file is `design-system.config.json`. `CHANGELOG.md` lists every old and new name.

1. Sync 0.6.0 into a new folder, `vendor/design-system`, with the sync command from step 1. Sync would also update the old folder in place, since it stops only when a file in the copy was edited, but the new name is what the codemod and the rules expect. Once the new copy is in, delete the old one with `git rm -r vendor/groundwork`.
2. Rename the config file with `git mv groundwork.config.json design-system.config.json`.
3. Run the codemod over the app. It ships in the copy. It rewrites every class, element, data attribute, custom property, cascade layer, icon id, waiver and file name of 0.5 in the CSS, HTML, JavaScript, TypeScript, JSON and Markdown files under the paths it is given. It skips `node_modules`, every directory whose name starts with a dot and every synced copy, prints each file it changed and a total, and changes nothing when run a second time. Look at what it would change first, then run it. Name `.claude/settings.json` as well if the app uses the hook from step 9, since the walk skips dot-directories:

```sh
node vendor/design-system/migrate-prefix.mjs --dry-run .
node vendor/design-system/migrate-prefix.mjs .
```

4. Keep the app's own prefix. `appPrefix` in the config file and the option passed to `dsCheckDom()` stay as they were.
5. Run the static scan from step 5 and the end-to-end tests again. A name the codemod could not see, such as one built from pieces at run time, is reported by `old-prefix` with its new form. A `ds-` class that the catalogue does not have is reported by `unknown-class`, which suggests the nearest one. Commit the copy, the deleted old copy and the rewritten source together.

## 12. Themes

A theme changes the values of the system's tokens and nothing else: colours, radii, any token. It cannot add a token name, so every component, utility and check works the same under it. The copy holds each theme in `themes/`. The system ships one, `botbench`.

| File | Holds |
|---|---|
| `themes/<name>.css` | The theme's values for light and dark. Link it after `design-system.css`. |
| `themes/<name>.json` | The theme's name, its default mode and the page background of each mode, for the `theme-color` meta tags. |
| `themes/<name>.design-tokens.md` | The token block for the front matter of the app's `DESIGN.md`, with the theme's values. Use it in place of `design-tokens.md`. |
| `themes/<name>.tokens.json` | The tokens as data with the theme's values, in the same format as `tokens.json`. |

### Load a theme

Link the theme's stylesheet after the system's:

```html
<link rel="stylesheet" href="/vendor/design-system/design-system.css">
<link rel="stylesheet" href="/vendor/design-system/themes/botbench.css">
```

From a bundler, import it after `design-system.css`:

```js
import "../vendor/design-system/design-system.css";
import "../vendor/design-system/themes/botbench.css";
```

The theme's rules sit in the `ds.theme` cascade layer, which the layer order puts after `ds.tokens`, so the theme's values win over the default ones. The theme file declares the same layer order, so the result is the same if it happens to load first. App CSS stays unlayered and still wins over both.

The Tailwind preset needs no change: its values are references to the custom properties, so `bg-surface` takes the theme's surface when the theme is loaded.

### Light, dark and the default mode

A theme declares a default mode, light or dark. With no `data-theme` attribute on the root element the page shows that mode. Botbench's default mode is dark.

| `data-theme` | Without a theme | Under a theme |
|---|---|---|
| not set | Light | The theme's default mode, whatever the system setting |
| `light` | Light | Light |
| `dark` | Dark | Dark |
| `auto` | Follows the system setting | Follows the system setting |

So a page that should follow the system sets `data-theme="auto"`, and a reader's own choice of light or dark is `data-theme="light"` or `data-theme="dark"`.

Take the browser's `theme-color` from `themes/<name>.json`, where `themeColor.light` and `themeColor.dark` are the theme's page backgrounds. For Botbench:

```html
<meta name="theme-color" content="#121417" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#FAF8F4" media="(prefers-color-scheme: light)">
```

Run the accessibility scan from step 6 in both modes under the theme, as without one.

### Write a theme

A theme is written in the design system's repo, never in an app. Add `themes/<name>.css`, with a lower-case name, and run `npm run build`. The file has the shape of `tokens/tokens.css`: a `:root` block of light values, a `[data-theme="dark"]` block of dark values, and the same dark values again in `[data-theme="auto"]` inside `@media (prefers-color-scheme: dark)`, all inside `@layer ds.theme { … }`. A line `Default mode: dark` in the file's first comment makes dark the default mode. Without it the default mode is light. A token the theme does not set keeps the default theme's value in that mode.

The build stops, naming the theme, when:

- it sets a name that is not a token;
- it has no light values or no dark values, or its dark and auto blocks differ;
- it sets a colour for light alone that the default theme sets for both modes, since that value would then apply in dark as well;
- a colour is not six-digit hex, or the default mode is not light or dark;
- a pair in `tokens/pairs.json` falls below its minimum in either mode, with the theme's values where it sets them and the default values where it does not. The message names the theme, the pair, the mode and the ratio.

The build then writes the four files above for the theme into `dist/themes/`. Sync copies them into the app and records their hashes in `hashes.json`, like every other file.

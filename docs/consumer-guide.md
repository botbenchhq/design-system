# Using Groundwork in an app

An app takes the system as a copy inside its own repo. The copy holds the stylesheet, the fonts, the icons, the component index, the rules for agents and the checker. Nothing loads from another host, and the app gains no dependency.

The examples use `vendor/groundwork/` for the copy and `app` for the app's class prefix. Use your own names.

## 1. Sync the copy

From the app's repo, with the Groundwork repo checked out beside it:

```sh
node ../groundwork/scripts/sync.mjs --to vendor/groundwork
```

This copies `dist/` and writes `hashes.json`, the SHA-256 of every file. Commit the whole directory. The copy carries the system's `LICENSE` and `NOTICE` with it.

The copy is read-only. The checker verifies the hashes first on every run and stops with `vendored-file-changed` when a file differs. To change the system, change it in the Groundwork repo and sync again.

## 2. Load the stylesheet

`groundwork.css` is the whole system: tokens, reset, base styles, font faces and components. It loads the fonts by relative URL, so serve `fonts/` beside it. The icon sprite is `icons.svg` in the same directory.

### Plain HTML

Serve `vendor/groundwork/` as static files and link the stylesheet.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tasks</title>
    <link rel="stylesheet" href="/vendor/groundwork/groundwork.css">
    <link rel="stylesheet" href="/src/components/run-ledger.css">
  </head>
  <body>
    <main class="gw-container gw-stack">
      <h1>Tasks</h1>
      <button type="button" class="gw-button gw-button--primary">New task</button>
      <section class="app-run-ledger" aria-label="Cost of the last run">
        <p>Tokens in: 18,204</p>
        <p>Tokens out: 2,310</p>
      </section>
    </main>
  </body>
</html>
```

### Behaviours, for an app without a framework

The components are CSS, and nearly all of them work from native elements alone. Three need script to move ARIA attributes as the reader acts: tabs, the combobox and the command palette. `behaviors/` holds three optional ES modules with no dependencies, each defining one element. Load the ones the app uses, once each, and wrap the component's markup from `components.json` in the module's element.

| Module | Element | What it does |
|---|---|---|
| `behaviors/groundwork.js` | `<gw-tabs>` | For the tabs component: sets `aria-selected`, `tabindex` and `hidden`, and handles click, Left, Right, Home and End. |
| `behaviors/combobox.js` | `<gw-combobox>` | For the combobox component: as the reader types it sets `hidden` on the options that do not match, `aria-expanded` and `aria-activedescendant` on the input and `aria-selected` on the active option, and writes the count into the `role="status"` line. It handles Down, Up, Home, End, Enter, Escape and a press on an option. |
| `behaviors/command-palette.js` | `<gw-command-palette>` | For the command palette component: filters the commands as the reader types, hides a group left with no match, sets `aria-selected` and `aria-activedescendant` as Down and Up move the selection, presses the selected command on Enter and closes the dialog. With `shortcut="k"` it opens the dialog on Ctrl+K and Cmd+K. |

```html
<script type="module" src="/vendor/groundwork/behaviors/groundwork.js"></script>
<script type="module" src="/vendor/groundwork/behaviors/combobox.js"></script>
<script type="module" src="/vendor/groundwork/behaviors/command-palette.js"></script>
```

Each is an external script from the app's own host, so a content security policy that allows no inline script lets it run. Each sets attributes only, never a class or an inline style. An app that renders with a framework loads none of them: its own components set the same ARIA attributes and handle the same keys, and the stylesheet draws the same result.

### Tailwind 3

Import the stylesheet from the app's entry script, or from its CSS entry, so the bundler copies the fonts.

```js
import "../vendor/groundwork/groundwork.css";
import "./index.css";
```

Use the preset in `tailwind.config.js`:

```js
import preset from "./vendor/groundwork/tailwind-preset.js";

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

`groundwork.config.json`, at the root of the app:

```json
{
  "paths": ["src"],
  "appPrefix": "app",
  "gaps": "design-gaps.json",
  "vendorDir": "vendor/groundwork"
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

1. Read `vendor/groundwork/rules/choosing-components.md`, search `components-index.json` by purpose, and read the "when not to use" entries in `components.json`.
2. Compose catalogue components with the layout classes.
3. If the need is still unmet, build an app-local component: classes under the app's prefix, values from tokens only, and an entry in the gaps file.

```css
.app-run-ledger {
  display: grid;
  gap: var(--gw-space-sm);
  padding: var(--gw-space-md);
  border: var(--gw-border-width) solid var(--gw-color-border);
  border-radius: var(--gw-radius-md);
  font-family: var(--gw-font-mono);
  font-size: var(--gw-text-mono);
}
```

Every run prints the declared gaps, so each one is seen in review. A gap that several apps share belongs in the catalogue: raise it in the Groundwork repo.

## 5. Run the static scan in the test command

```sh
node vendor/groundwork/checker/check.mjs --config groundwork.config.json
```

It exits 0 when clean, 1 on findings and 2 when it could not run. Put it in the app's ordinary test command, so it gates work from any agent or tool:

```json
{
  "scripts": {
    "test": "node vendor/groundwork/checker/check.mjs --config groundwork.config.json && node --test"
  }
}
```

The scan reads CSS, HTML, JSX, TSX and class names in script. A finding names the file, the line, the rule and the fix. `vendor/groundwork/rules/checker-rules.md` explains every rule.

The one exception to a rule is an inline waiver, a comment on the line of the finding or the line before it:

```css
/* gw-waive off-scale-spacing: the canvas library needs a 3px offset to line up with its grid */
```

A waiver without a reason is itself a finding, and so is one that matches nothing.

## 6. Run the rendered check in the end-to-end tests

The rules about structure need the rendered page: one primary action per view, the disclosure limits, nested and identical cards, badge clutter, emoji, stock phrases, and a view whose controls use no system component at all. `check-dom.js` holds them as one script that defines `gwCheckDom()`. It returns a list of `{ rule, message, fix, snippet }`.

With Playwright:

```js
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const checkDom = readFileSync("vendor/groundwork/check-dom.js", "utf8");

async function expectNoDesignFindings(page) {
  await page.evaluate(checkDom);
  expect(await page.evaluate(() => gwCheckDom(document.documentElement, { appPrefix: "app" }))).toEqual([]);
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

`gwCheckDom()` takes two optional arguments: the element to check, which is the whole document when left out, and an object of options. The one option is `appPrefix`, the same prefix as in `groundwork.config.json`. The rendered page cannot tell the app's prefix, and the rule `unstyled-controls` needs it: a view with buttons or form controls fails when none of them carries or sits inside an element with a `gw-` class or a class with the app's prefix. Without the option, a view built only from app-local components is reported. `gwCheckDom()` and `gwCheckDom(element)` work as before.

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
0 findings, 0 waivers, 1 declared gap, 14 files scanned, 40 rules
```

The last figure is how many rules this copy of the checker holds. It rises when a sync brings new rules.

Paste it into the description of every pull request that touches the interface, with the list of waivers and declared gaps printed above it when there are any. A reviewer reads new waivers and new gaps first.

## 8. Tell agents where the rules are

In the app's agent instructions (`AGENTS.md`, `CLAUDE.md` or the like), say:

- Read `vendor/groundwork/rules/core.md` before any interface work. It is short, and it says when to open the longer files beside it.
- Choose a component or a page pattern from `vendor/groundwork/components-index.json`, which lists each one's name, kind, title, purpose, status and classes. Then open that one entry in `vendor/groundwork/components.json` for its guidance and markup. The full file is large, so search it for the entry's name and do not read it whole.
- Never edit `vendor/groundwork/`.

## 9. Optional: a Claude Code hook

The test and end-to-end commands are the gate. A hook gives Claude Code the same findings sooner. `vendor/groundwork/hooks/claude-settings.example.json` is a fragment to merge into the app's `.claude/settings.json`:

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
            "args": ["${CLAUDE_PROJECT_DIR}/vendor/groundwork/hooks/claude-hook.mjs", "${CLAUDE_PROJECT_DIR}/groundwork.config.json"]
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
            "args": ["${CLAUDE_PROJECT_DIR}/vendor/groundwork/hooks/claude-hook.mjs", "${CLAUDE_PROJECT_DIR}/groundwork.config.json"]
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
Groundwork 0.1.0 -> 0.2.0 in vendor/groundwork
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

Read those lines. A new rule may produce findings in screens that passed before, and a changed component or pattern may need its markup updated: look it up in `components.json`. `CHANGELOG.md` in the Groundwork repo says what each version changed. Then run the test and end-to-end commands and commit the copy with the fixes.

Sync stops without writing when a file in the copy was edited by hand, and names the files. Restore them from version control and sync again.

To learn whether a newer version exists without changing anything:

```sh
node ../groundwork/scripts/sync.mjs --check --to vendor/groundwork
```

It prints one line when the Groundwork checkout holds a newer version than the copy, and nothing otherwise. It always exits 0, also when the checkout is not there, so it is safe in a script that runs where only the app is checked out.

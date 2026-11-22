# Using Groundwork in an app

An app takes the system as a copy inside its own repo. The copy holds the stylesheet, the fonts, the icons, the component index, the rules for agents and the checker. Nothing loads from another host, and the app gains no dependency.

The examples use `vendor/groundwork/` for the copy and `app` for the app's class prefix. Use your own names.

## 1. Sync the copy

From the app's repo, with the Groundwork repo checked out beside it:

```sh
node ../groundwork/scripts/sync.mjs --to vendor/groundwork
```

This copies `dist/` and writes `hashes.json`, the SHA-256 of every file. Commit the whole directory.

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

The components are CSS, and nearly all of them work from native elements alone. The tabs component needs script to move `aria-selected`, `tabindex` and `hidden` when a tab is chosen. `behaviors/groundwork.js` is one optional ES module with no dependencies that defines the `<gw-tabs>` element, which does that and handles click, Left, Right, Home and End. Load it once, and wrap the tabs markup from `components.json` in `<gw-tabs>`.

```html
<script type="module" src="/vendor/groundwork/behaviors/groundwork.js"></script>
```

It is an external script from the app's own host, so a content security policy that allows no inline script lets it run. An app that renders with a framework does not load it: its tabs component sets the same three attributes and handles the same keys.

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

1. Read `vendor/groundwork/rules/choosing-components.md` and the "when not to use" entries in `components.json`.
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

The rules about structure need the rendered page: one primary action per view, the disclosure limits, nested and identical cards, badge clutter, emoji and stock phrases. `check-dom.js` holds them as one script that defines `gwCheckDom()`. It returns a list of `{ rule, message, fix, snippet }`.

With Playwright:

```js
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const checkDom = readFileSync("vendor/groundwork/check-dom.js", "utf8");

async function expectNoDesignFindings(page) {
  await page.evaluate(checkDom);
  expect(await page.evaluate(() => gwCheckDom())).toEqual([]);
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

## 7. Put the summary line in each pull request

The scan ends with one line:

```
0 findings, 0 waivers, 1 declared gap, 14 files scanned
```

Paste it into the description of every pull request that touches the interface, with the list of waivers and declared gaps printed above it when there are any. A reviewer reads new waivers and new gaps first.

## 8. Tell agents where the rules are

In the app's agent instructions (`AGENTS.md`, `CLAUDE.md` or the like), say:

- Read `vendor/groundwork/rules/core.md` before any interface work. It is short, and it says when to open the longer files beside it.
- Look components up in `vendor/groundwork/components.json` before writing markup.
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
Rules added: placeholder-as-label
Rules removed: none
Wrote 131 files and hashes.json
```

Read those lines. A new rule may produce findings in screens that passed before, and a changed component may need its markup updated: look it up in `components.json`. `CHANGELOG.md` in the Groundwork repo says what each version changed. Then run the test and end-to-end commands and commit the copy with the fixes.

Sync stops without writing when a file in the copy was edited by hand, and names the files. Restore them from version control and sync again.

To learn whether a newer version exists without changing anything:

```sh
node ../groundwork/scripts/sync.mjs --check --to vendor/groundwork
```

It prints one line when the Groundwork checkout holds a newer version than the copy, and nothing otherwise. It always exits 0, also when the checkout is not there, so it is safe in a script that runs where only the app is checked out.

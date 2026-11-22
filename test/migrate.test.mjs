import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { verifyVendored } from "../checker/vendor.mjs";
import { migrate } from "../scripts/migrate-prefix.mjs";
import { listFiles } from "../scripts/build.mjs";
import { repoRoot, tempDir } from "./helpers.mjs";

const fixtures = join(repoRoot, "test", "fixtures", "migrate");
const shipped = join(repoRoot, "dist", "migrate-prefix.mjs");

function run(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// A copy of the app from before the move, with a dependency and a dot-directory that hold the old names too.
function oldApp() {
  const app = tempDir();
  cpSync(join(fixtures, "before"), app, { recursive: true });
  mkdirSync(join(app, "node_modules", "widget"), { recursive: true });
  writeFileSync(join(app, "node_modules", "widget", "index.js"), 'export const name = "gw-button";\n');
  mkdirSync(join(app, ".cache"));
  writeFileSync(join(app, ".cache", "old.css"), ".gw-button {}\n");
  return app;
}

const read = (dir, name) => readFileSync(join(dir, name), "utf8");
const LEFT_ALONE = ["node_modules/widget/index.js", ".cache/old.css", "vendor/groundwork/groundwork.css", "src/notes.txt"];

test("the build ships the codemod in dist/, unchanged", () => {
  assert.equal(readFileSync(shipped, "utf8"), read(repoRoot, "scripts/migrate-prefix.mjs"));
});

test("the codemod rewrites every old form in an app's source, prints each file and a total, and leaves the rest alone", () => {
  const app = oldApp();
  const before = Object.fromEntries(LEFT_ALONE.map((name) => [name, read(app, name)]));
  const { status, stdout, stderr } = run(shipped, ["."], app);
  assert.equal(stderr, "");
  assert.equal(status, 0);
  assert.deepEqual(stdout.trim().split("\n"), [
    "notes.md: 1",
    "package.json: 2",
    "src/app.css: 11",
    "src/index.html: 10",
    "src/screen.tsx: 19",
    "Changed 5 files, 43 names.",
  ]);
  for (const name of listFiles(join(fixtures, "after"))) assert.equal(read(app, name), read(join(fixtures, "after"), name), name);
  for (const [name, text] of Object.entries(before)) assert.equal(read(app, name), text, name);
});

test("a second run of the codemod changes nothing", () => {
  const app = oldApp();
  run(shipped, ["."], app);
  const once = Object.fromEntries(listFiles(app).map((name) => [name, read(app, name)]));
  const again = run(shipped, ["src", "package.json", "notes.md"], app);
  assert.deepEqual([again.status, again.stdout], [0, "Changed 0 files, 0 names.\n"]);
  for (const [name, text] of Object.entries(once)) assert.equal(read(app, name), text, name);
});

test("with --dry-run the codemod prints what it would change and writes nothing", () => {
  const app = oldApp();
  const { status, stdout } = run(shipped, ["--dry-run", "src/screen.tsx"], app);
  assert.deepEqual([status, stdout], [0, "src/screen.tsx: 19\nWould change 1 file, 19 names.\n"]);
  assert.equal(read(app, "src/screen.tsx"), read(join(fixtures, "before"), "src/screen.tsx"));
});

test("run from a synced copy, the codemod leaves that copy as it was synced", () => {
  const app = oldApp();
  spawnSync(process.execPath, [join(repoRoot, "scripts", "sync.mjs"), "--to", "vendor/design-system"], { cwd: app });
  const { status, stdout } = run(join("vendor", "design-system", "migrate-prefix.mjs"), ["."], app);
  assert.equal(status, 0);
  assert.doesNotMatch(stdout, /^vendor\//m);
  assert.deepEqual(verifyVendored(join(app, "vendor", "design-system")), []);
});

test("the codemod rewrites each form, and nothing where the letters gw are not the prefix", () => {
  const cases = [
    ['<div class="gw-card__title gw-card--sunken">', '<div class="ds-card__title ds-card--sunken">'],
    ["padding: var(--gw-space-md);", "padding: var(--ds-space-md);"],
    ["@layer gw.reset, gw.tokens, gw.base, gw.components;", "@layer ds.reset, ds.tokens, ds.base, ds.components;"],
    ['<button data-gw-critical data-gw-content="">', '<button data-ds-critical data-ds-content="">'],
    ["<gw-command-palette></gw-command-palette>", "<ds-command-palette></ds-command-palette>"],
    ["globalThis.gwCheckDom(document.body)", "globalThis.dsCheckDom(document.body)"],
    ["/* gw-waive raw-color: fixed by contract */", "/* ds-waive raw-color: fixed by contract */"],
    ['href="icons.svg#gw-icon-check"', 'href="icons.svg#ds-icon-check"'],
    ['run("--config", "groundwork.config.json")', 'run("--config", "design-system.config.json")'],
    ["count.dataset.gwCountOne", "count.dataset.dsCountOne"],
    ["class Tabs extends GwTabs {}", "class Tabs extends DsTabs {}"],
    ["@keyframes gw-streaming-turn {", "@keyframes ds-streaming-turn {"],
  ];
  for (const [from, to] of cases) assert.equal(migrate(from).text, to, from);
  for (const text of [
    "const logwriter = createLogwriter();",
    "fetch('https://example.com/gwen/logs')",
    "fetch('https://example.com/api/gw-reports')",
    "padding: var(--gwx-gap);",
    "my-gw-thing",
    "gwFoo.gw",
  ]) {
    assert.deepEqual(migrate(text), { text, count: 0 }, text);
  }
});

test("the codemod with no paths, or a path that is not there, exits 2 and says how to run it", () => {
  const app = tempDir();
  assert.deepEqual(run(shipped, [], app), { status: 2, stdout: "", stderr: "Usage: node migrate-prefix.mjs [--dry-run] <paths…>\n" });
  const missing = run(shipped, ["src"], app);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /^Not found: .*src\n$/);
});

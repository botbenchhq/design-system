import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { verifyVendored } from "../checker/vendor.mjs";
import { listFiles } from "../scripts/build.mjs";
import { repoRoot, tempDir } from "./helpers.mjs";

const dist = join(repoRoot, "dist");
const script = join(repoRoot, "scripts", "sync.mjs");
const guide = readFileSync(join(repoRoot, "docs", "consumer-guide.md"), "utf8");
const version = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;

function sync(args, cwd = repoRoot) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const edit = (file, change) => writeFileSync(file, change(readFileSync(file, "utf8")));
const editJson = (file, change) => edit(file, (json) => JSON.stringify(change(JSON.parse(json)), null, 2));

// A copy of dist/ as a later release: a new version, one rule more and one fewer, and components and patterns added, changed and removed.
function laterRelease() {
  const dir = tempDir();
  cpSync(dist, dir, { recursive: true });
  writeFileSync(join(dir, "VERSION"), "0.8.0\n");
  editJson(join(dir, "manifest.json"), (manifest) => ({
    ...manifest,
    rules: [...manifest.rules.filter((id) => id !== "stock-phrase"), "placeholder-as-label"],
  }));
  editJson(join(dir, "components.json"), ({ components, patterns }) => ({
    components: [
      ...components
        .filter(({ name }) => name !== "spinner")
        .map((component) => (component.name === "button" ? { ...component, purpose: "An action." } : component)),
      { ...components[0], name: "chart" },
    ],
    patterns: [
      ...patterns
        .filter(({ name }) => name !== "not-found")
        .map((pattern) => (pattern.name === "sign-in" ? { ...pattern, purpose: "A way in." } : pattern)),
      { ...patterns[0], name: "dashboard" },
    ],
  }));
  return dir;
}

// The fenced block of a language in the consumer guide that holds a marker.
function guideBlock(language, marker) {
  const blocks = [...guide.matchAll(/^```(\w*)\n([\s\S]*?)^```$/gm)].filter(([, lang, body]) => lang === language && body.includes(marker));
  assert.equal(blocks.length, 1, `the guide needs one ${language} block holding ${marker}`);
  return blocks[0][2];
}

test("the build writes the package version to dist/VERSION", () => {
  assert.equal(version, "0.7.0");
  assert.equal(readFileSync(join(dist, "VERSION"), "utf8"), "0.7.0\n");
});

test("syncing into an empty directory produces a copy whose hashes verify", () => {
  const target = join(tempDir(), "vendor", "design-system");
  const { status, stdout } = sync(["--to", target]);
  assert.equal(status, 0);
  assert.match(stdout, /^The design system 0\.7\.0, first sync into /);

  const { files } = JSON.parse(readFileSync(join(target, "hashes.json"), "utf8"));
  assert.deepEqual(Object.keys(files), listFiles(dist));
  assert.ok("checker/rules/index.mjs" in files && "rules/core.md" in files && "hooks/claude-settings.example.json" in files);
  for (const [name, hash] of Object.entries(files)) {
    assert.equal(createHash("sha256").update(readFileSync(join(target, name))).digest("hex"), hash, name);
    assert.ok(readFileSync(join(target, name)).equals(readFileSync(join(dist, name))), name);
  }
  assert.deepEqual(verifyVendored(target), []);
});

test("syncing a newer version over an older one prints the component, pattern and rule changes before writing", () => {
  const target = tempDir();
  sync(["--to", target]);
  const { status, stdout } = sync(["--to", target, "--from", laterRelease()]);
  assert.equal(status, 0);
  const lines = stdout.trim().split("\n");
  assert.match(lines[0], /^The design system 0\.7\.0 -> 0\.8\.0 in /);
  assert.deepEqual(lines.slice(1, 9), [
    "Components added: chart",
    "Components changed: button",
    "Components removed: spinner",
    "Patterns added: dashboard",
    "Patterns changed: sign-in",
    "Patterns removed: not-found",
    "Rules added: placeholder-as-label",
    "Rules removed: stock-phrase",
  ]);
  assert.match(lines[9], /^Wrote \d+ files/);
  assert.equal(readFileSync(join(target, "VERSION"), "utf8"), "0.8.0\n");
  // The sample output in the guide has the same lines, in the same order.
  const sample = guide.match(/^The design system 0\.1\.0 -> 0\.2\.0 in [\s\S]*?^```$/m)[0].split("\n");
  assert.deepEqual(sample.slice(1, 9).map((line) => line.split(":")[0]), lines.slice(1, 9).map((line) => line.split(":")[0]));
  assert.deepEqual(verifyVendored(target), []);
});

test("a file the newer version no longer has is removed from the copy", () => {
  const target = tempDir();
  sync(["--to", target]);
  const later = laterRelease();
  const gone = "gallery/spinner.html";
  assert.ok(existsSync(join(target, gone)));
  const without = tempDir();
  cpSync(later, without, { recursive: true, filter: (source) => !source.endsWith(gone) });
  assert.equal(sync(["--to", target, "--from", without]).status, 0);
  assert.ok(!existsSync(join(target, gone)));
  assert.deepEqual(verifyVendored(target), []);
});

test("syncing into a directory with locally modified files stops and names them", () => {
  const target = tempDir();
  sync(["--to", target]);
  edit(join(target, "design-system.css"), (css) => css.replace("4px", "5px"));
  edit(join(target, "checker", "rules", "tells.mjs"), (source) => source.replace("const BADGE_LIMIT = 8", "const BADGE_LIMIT = 80"));
  const edited = readFileSync(join(target, "design-system.css"), "utf8");

  const { status, stdout, stderr } = sync(["--to", target, "--from", laterRelease()]);
  assert.equal(status, 1);
  assert.match(stderr, /^  design-system\.css$/m);
  assert.match(stderr, /^  checker\/rules\/tells\.mjs$/m);
  assert.equal(stdout, "");
  assert.equal(readFileSync(join(target, "design-system.css"), "utf8"), edited);
  assert.equal(readFileSync(join(target, "VERSION"), "utf8"), "0.7.0\n");
});

test("syncing into a directory that holds files and is not a synced copy stops", () => {
  const target = tempDir();
  writeFileSync(join(target, "tokens.css"), ":root {}\n");
  const { status, stderr } = sync(["--to", target]);
  assert.equal(status, 1);
  assert.match(stderr, /not a synced copy/);
  assert.equal(readFileSync(join(target, "tokens.css"), "utf8"), ":root {}\n");
});

test("syncing the same version twice changes nothing", () => {
  const target = tempDir();
  sync(["--to", target]);
  const before = Object.fromEntries(["hashes.json", ...listFiles(dist)].map((name) => [name, statSync(join(target, name)).mtimeMs]));
  const { status, stdout } = sync(["--to", target]);
  assert.equal(status, 0);
  assert.match(stdout, /is already at 0\.7\.0\. Nothing to change\.\n$/);
  assert.deepEqual(listFiles(target), ["hashes.json", ...listFiles(dist)].sort());
  for (const [name, time] of Object.entries(before)) assert.equal(statSync(join(target, name)).mtimeMs, time, name);
});

test("the freshness check says so when the source is newer, and is silent when it is not", () => {
  const target = tempDir();
  sync(["--to", target]);
  const newer = sync(["--check", "--to", target, "--from", laterRelease()]);
  assert.equal(newer.status, 0);
  assert.match(newer.stdout, /^The design system 0\.8\.0 is available\. .* holds 0\.7\.0\./);

  const same = sync(["--check", "--to", target]);
  assert.deepEqual([same.status, same.stdout], [0, ""]);
});

test("the freshness check passes without a message when the source cannot be read", () => {
  const target = tempDir();
  sync(["--to", target]);
  const { status, stdout, stderr } = sync(["--check", "--to", target, "--from", join(tempDir(), "missing")]);
  assert.deepEqual([status, stdout, stderr], [0, "", ""]);
});

test("the vendored check reads files in subdirectories", () => {
  const target = tempDir();
  sync(["--to", target]);
  edit(join(target, "rules", "core.md"), (text) => `${text}\nOne more rule.\n`);
  assert.deepEqual(
    verifyVendored(target).map((finding) => [finding.file, finding.rule]),
    [[join(target, "rules", "core.md"), "vendored-file-changed"]],
  );
});

test("a consumer set up as the guide says passes the checker, and fails it after a vendored file is edited", () => {
  const app = tempDir();
  const command = guideBlock("sh", "sync.mjs --to").trim().split("\n")[0];
  assert.equal(command, "node ../design-system/scripts/sync.mjs --to vendor/design-system");
  assert.equal(sync(["--to", "vendor/design-system"], app).status, 0);

  writeFileSync(join(app, "design-system.config.json"), guideBlock("json", '"vendorDir"'));
  writeFileSync(join(app, "design-gaps.json"), guideBlock("json", '"gaps": ['));
  const config = JSON.parse(readFileSync(join(app, "design-system.config.json"), "utf8"));
  const [gap] = JSON.parse(readFileSync(join(app, "design-gaps.json"), "utf8")).gaps;
  mkdirSync(join(app, config.paths[0], "components"), { recursive: true });
  writeFileSync(join(app, config.paths[0], "index.html"), guideBlock("html", "<!doctype html>"));
  writeFileSync(join(app, gap.files[0]), guideBlock("css", `.${gap.classes[0]}`));

  const check = guideBlock("sh", "check.mjs --config").trim();
  assert.equal(check, "node vendor/design-system/checker/check.mjs --config design-system.config.json");
  const run = () => spawnSync(process.execPath, check.split(" ").slice(1), { cwd: app, encoding: "utf8" });

  const clean = run();
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  assert.match(clean.stdout, /^0 findings, 0 waivers, 1 declared gap, 2 files scanned, 41 rules$/m);
  // The summary line the guide quotes has the same shape and the same rule count.
  assert.match(guideBlock("", "files scanned"), /^0 findings, 0 waivers, 1 declared gap, \d+ files scanned, 41 rules\n$/);
  assert.ok(existsSync(join(app, "vendor", "design-system", "LICENSE")) && existsSync(join(app, "vendor", "design-system", "NOTICE")));

  edit(join(app, "vendor", "design-system", "design-system.css"), (css) => css.replace("4px", "5px"));
  const changed = run();
  assert.equal(changed.status, 1);
  assert.match(changed.stdout, /^vendor\/design-system\/design-system\.css:1  vendored-file-changed/);
});

// The hook reads a Claude Code hook event on standard input.
function hook(app, event) {
  const args = [join(app, "vendor", "design-system", "hooks", "claude-hook.mjs"), join(app, "design-system.config.json")];
  const result = spawnSync(process.execPath, args, { cwd: app, encoding: "utf8", input: JSON.stringify(event) });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function hookedApp() {
  // The real path, as Claude Code gives it: the checker shows a file relative to the directory it runs in.
  const app = realpathSync(tempDir());
  sync(["--to", "vendor/design-system"], app);
  writeFileSync(join(app, "design-system.config.json"), JSON.stringify({ paths: ["src"], vendorDir: "vendor/design-system" }));
  mkdirSync(join(app, "src"));
  return app;
}

test("the example settings name the hook script the copy ships, for edits and writes", () => {
  const settings = JSON.parse(readFileSync(join(dist, "hooks", "claude-settings.example.json"), "utf8"));
  assert.deepEqual(Object.keys(settings.hooks), ["PreToolUse", "PostToolUse"]);
  for (const [group] of Object.values(settings.hooks)) {
    assert.equal(group.matcher, "Edit|Write");
    assert.deepEqual(group.hooks.map(({ type, command }) => [type, command]), [["command", "node"]]);
    assert.ok(existsSync(join(dist, group.hooks[0].args[0].replace("${CLAUDE_PROJECT_DIR}/vendor/design-system/", ""))));
  }
});

test("the hook denies an edit inside the vendored copy and allows one outside it", () => {
  const app = hookedApp();
  const event = (file) => ({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path: join(app, file) } });

  const inside = hook(app, event("vendor/design-system/design-system.css"));
  assert.equal(inside.status, 0);
  const { hookSpecificOutput } = JSON.parse(inside.stdout);
  assert.equal(hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(hookSpecificOutput.permissionDecision, "deny");
  assert.match(hookSpecificOutput.permissionDecisionReason, /read-only copy/);

  assert.deepEqual(hook(app, event("src/app.css")), { status: 0, stdout: "", stderr: "" });
});

test("after an edit the hook reports the findings of a UI file under the configured paths, and nothing else", () => {
  const app = hookedApp();
  const event = (file) => ({ hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: join(app, file) } });
  writeFileSync(join(app, "src", "app.css"), ".panel {\n  color: #6366f1;\n}\n");
  writeFileSync(join(app, "src", "clean.css"), ".panel {\n  color: var(--ds-color-muted);\n}\n");
  writeFileSync(join(app, "src", "notes.md"), "color: #6366f1\n");
  writeFileSync(join(app, "build.css"), ".panel {\n  color: #6366f1;\n}\n");

  const found = hook(app, event("src/app.css"));
  assert.equal(found.status, 2);
  assert.match(found.stderr, /^src\/app\.css:2  raw-color/);

  for (const file of ["src/clean.css", "src/notes.md", "build.css"]) {
    assert.deepEqual(hook(app, event(file)), { status: 0, stdout: "", stderr: "" }, file);
  }
});

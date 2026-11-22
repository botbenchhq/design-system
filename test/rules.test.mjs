import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { RULES } from "../checker/rules/index.mjs";
import { CORE_RULES_LIMIT, build } from "../scripts/build.mjs";
import { FIXTURE_CLASSES, copySources, manifestWithClasses, repoRoot, tempDir } from "./helpers.mjs";

const dist = join(repoRoot, "dist");
const rulesDir = join(repoRoot, "rules");
const files = readdirSync(rulesDir).filter((name) => name.endsWith(".md")).sort();
const text = Object.fromEntries(files.map((name) => [name, readFileSync(join(rulesDir, name), "utf8")]));

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
const patterns = index.patterns.map(({ name }) => name);
// A code span may name a component or a page pattern.
const components = [...index.components.map(({ name }) => name), ...patterns];

// In a rules file, a code span holding one lower-case hyphenated word is a component name, a checker rule ID,
// a system class or a data- or aria- attribute. Anything else in a code span carries a dot, a space or punctuation.
const WORD_SPAN = /`([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`/g;
// A system class anywhere in the text. A custom property (--gw-…) and an attribute (data-gw-…) are not classes.
const SYSTEM_CLASS = /(?<![\w-])gw-[a-z0-9]+(?:(?:__|--|-)[a-z0-9]+)*/g;
// The keyword of an inline waiver.
const NOT_A_CLASS = ["gw-waive"];

test("the rules are copied into dist/rules/ unchanged", () => {
  for (const name of files) assert.equal(readFileSync(join(dist, "rules", name), "utf8"), text[name], name);
  assert.deepEqual(readdirSync(join(dist, "rules")).sort(), files);
});

test("core.md stays within its character limit", () => {
  assert.equal(CORE_RULES_LIMIT, 2400);
  assert.ok(text["core.md"].length <= CORE_RULES_LIMIT, `core.md is ${text["core.md"].length} characters`);
});

test("a core.md over the limit fails the build", () => {
  const root = copySources();
  const core = join(root, "rules", "core.md");
  writeFileSync(core, text["core.md"] + "x".repeat(CORE_RULES_LIMIT - text["core.md"].length + 1));
  assert.throws(() => build({ root, outDir: tempDir() }), /rules\/core\.md is 2401 characters\. The limit is 2400/);
});

test("every component named in a rules file is in the component index", () => {
  for (const name of files) {
    for (const [, word] of text[name].matchAll(WORD_SPAN)) {
      const known = components.includes(word) || manifest.rules.includes(word) || manifest.classes.includes(word) || /^(?:data|aria)-/.test(word);
      assert.ok(known, `${name} names \`${word}\`, which is not a component, a checker rule, a system class or an attribute`);
    }
  }
});

test("every system class named in a rules file is in the manifest", () => {
  for (const name of files) {
    for (const [word] of text[name].matchAll(SYSTEM_CLASS)) {
      if (NOT_A_CLASS.includes(word)) continue;
      assert.ok(manifest.classes.includes(word), `${name} names ${word}, which is not a class of the system`);
    }
  }
});

test("choosing-components.md mentions every component and every pattern in the index", () => {
  const mentioned = new Set([...text["choosing-components.md"].matchAll(WORD_SPAN)].map(([, word]) => word));
  assert.ok(patterns.length > 0);
  assert.deepEqual(components.filter((name) => !mentioned.has(name)), []);
});

test("the manifest lists every rule ID the checker can emit", () => {
  for (const { id } of RULES) assert.ok(manifest.rules.includes(id), `the manifest leaves out the structural rule ${id}`);

  // Every rule the checker reports on the fixture pages and files, which between them break each kind of rule.
  const cli = join(repoRoot, "checker", "check.mjs");
  const fixtures = join(repoRoot, "test", "fixtures");
  const args = [cli, "--json", "--manifest", manifestWithClasses(FIXTURE_CLASSES), "checker/css", "checker/markup", "checker/waivers", "slop"];
  const { stdout } = spawnSync(process.execPath, args, { cwd: fixtures, encoding: "utf8" });
  const reported = [...new Set(JSON.parse(stdout).findings.map((finding) => finding.rule))];
  assert.ok(reported.length > 20, `only ${reported.length} rules were reported`);
  assert.deepEqual(reported.filter((id) => !manifest.rules.includes(id)), []);
});

test("every rule ID the checker can emit has an entry with a fix in the rules files", () => {
  // An entry is a table row: the rule ID in a code span, what it means, and the fix.
  const fixes = new Map();
  for (const name of files) {
    for (const [, id, fix] of text[name].matchAll(/^\| `([a-z-]+)` \|[^|\n]+\|([^|\n]*)\|$/gm)) fixes.set(id, fix.trim());
  }
  assert.ok(manifest.rules.length > 0);
  for (const id of manifest.rules) {
    assert.ok(fixes.has(id), `no rules file has an entry for ${id}`);
    assert.notEqual(fixes.get(id), "", `the entry for ${id} gives no fix`);
  }
  assert.deepEqual([...fixes.keys()].filter((id) => !manifest.rules.includes(id)), [], "entries for rules the checker does not have");
});

test("the visually hidden class is part of the system", () => {
  assert.ok(manifest.classes.includes("gw-visually-hidden"));
  assert.match(readFileSync(join(dist, "groundwork.css"), "utf8"), /\.gw-visually-hidden \{/);
});

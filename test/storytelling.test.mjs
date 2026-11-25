import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { repoRoot } from "./helpers.mjs";

// storytelling/ is an opt-in companion for public-facing surfaces. It is source only: an app that vendors dist/ never
// receives it, and nothing in rules/ points to it.
const dir = join(repoRoot, "storytelling");
const read = (path) => readFileSync(join(dir, path), "utf8");
const skills = readdirSync(join(dir, "skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map(({ name }) => name).sort();

test("the storytelling companion stays out of dist/ and out of the rules", () => {
  assert.equal(existsSync(join(repoRoot, "dist", "storytelling")), false);
  for (const name of readdirSync(join(repoRoot, "rules"))) assert.doesNotMatch(readFileSync(join(repoRoot, "rules", name), "utf8"), /storytelling/, name);
});

test("each storytelling skill has a SKILL.md whose frontmatter names it and says when to use it", () => {
  assert.deepEqual(skills, ["product-storytelling", "storytelling-review"]);
  for (const name of skills) {
    const [, block] = read(join("skills", name, "SKILL.md")).match(/^---\n([\s\S]*?)\n---\n/) ?? [];
    assert.ok(block, `${name} has no frontmatter`);
    assert.match(block, new RegExp(`^name: ${name}$`, "m"), `${name}: the name in its frontmatter is not its folder`);
    const [, description] = block.match(/^description: (.+)$/m) ?? [];
    assert.ok(description && description.length <= 1024, `${name}: a description of at most 1,024 characters`);
    assert.match(description, /Use (?:when|after)/, `${name}: the description says when to use it`);
  }
});

test("every file the companion links to exists", () => {
  for (const file of ["README.md", "motion.md", "procedures.md", "quality-gates.md", "registry.md", "examples.md", ...skills.map((name) => `skills/${name}/SKILL.md`)]) {
    const text = read(file);
    for (const [, target] of text.matchAll(/\]\((?!https?:|#)([^)#\s]+)/g)) {
      const base = file.includes("/") ? join(dir, file, "..") : dir;
      assert.ok(existsSync(join(base, target)), `${file} links to ${target}, which does not exist`);
    }
  }
});

test("the registry pins every upstream skill to a full commit and gives its licence", () => {
  const rows = [...read("registry.md").matchAll(/^\| \[([\w.-]+\/[\w.-]+)\]\([^)]+\) \| `([0-9a-f]+)` \| ([^|]+) \|/gm)];
  assert.ok(rows.length >= 15, `only ${rows.length} pinned rows`);
  for (const [, repo, revision, licence] of rows) {
    assert.match(revision, /^[0-9a-f]{40}$/, `${repo} is not pinned to a full commit`);
    assert.notEqual(licence.trim(), "", `${repo} gives no licence`);
  }
});

test("the companion states the storytelling timing scale openly and maps it to the existing tokens", () => {
  const motion = read("motion.md");
  for (const token of ["--ds-duration-fast", "--ds-duration-base", "--ds-duration-slow", "--ds-ease"]) assert.ok(motion.includes(token), token);
  assert.match(motion, /240 to 450 ms/);
  assert.match(motion, /600 to 900 ms/);
  // A beat is never written as arithmetic on a duration token to get past raw-duration.
  for (const file of ["README.md", "motion.md", "procedures.md", ...skills.map((name) => `skills/${name}/SKILL.md`)]) {
    assert.doesNotMatch(read(file), /calc\([^)]*var\(--ds-duration/, file);
  }
});

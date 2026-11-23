import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { listFiles } from "../scripts/build.mjs";
import { repoRoot } from "./helpers.mjs";

test("the React source ships in dist/react/ as its five files and nothing else", () => {
  assert.deepEqual(listFiles(join(repoRoot, "dist", "react")), ["approval.tsx", "busy-button.tsx", "dialog.tsx", "use-menu.ts", "use-transcript.ts"]);
});

test("the React source imports React and its own files only", () => {
  for (const name of listFiles(join(repoRoot, "react"))) {
    const source = readFileSync(join(repoRoot, "react", name), "utf8");
    for (const [, from] of source.matchAll(/^import [^;]*? from "([^"]+)";$/gm)) assert.match(from, /^(react|\.\/[a-z-]+\.tsx?)$/, `${name} imports ${from}`);
  }
});

test("the React source typechecks in strict use, and each misuse in the fixture is a type error", () => {
  const tsc = join(repoRoot, "node_modules", ".bin", "tsc");
  execFileSync(tsc, ["--noEmit", "-p", join(repoRoot, "test", "fixtures", "react-source")], { stdio: "pipe" });
});

test("the React source writes only the system's own classes and no inline style", () => {
  const { classes } = JSON.parse(readFileSync(join(repoRoot, "dist", "manifest.json"), "utf8"));
  for (const name of listFiles(join(repoRoot, "react"))) {
    const source = readFileSync(join(repoRoot, "react", name), "utf8");
    // Class names in quoted strings, as written in className or a class map.
    for (const [, quoted] of source.matchAll(/(?:className=|: |\? |\[)"([^"]*)"/g)) {
      for (const word of quoted.split(" ").filter((each) => each.startsWith("ds-"))) assert.ok(classes.includes(word), `${name} writes ${word}`);
    }
    assert.doesNotMatch(source, /\bstyle=\{/, `${name} sets an inline style`);
  }
});

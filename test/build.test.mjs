import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { build, listFiles, staleFiles } from "../scripts/build.mjs";
import { copySources, repoRoot, tempDir } from "./helpers.mjs";

const committed = join(repoRoot, "dist");

test("building twice produces byte-identical output", () => {
  const first = tempDir();
  const second = tempDir();
  build({ outDir: first });
  build({ outDir: second });
  const names = listFiles(first);
  assert.ok(names.length > 0);
  assert.deepEqual(listFiles(second), names);
  for (const name of names) {
    assert.ok(readFileSync(join(first, name)).equals(readFileSync(join(second, name))), name);
  }
});

test("committed dist matches a fresh build", () => {
  const stale = staleFiles({ distDir: committed });
  assert.equal(stale.length, 0, `stale in dist/: ${stale.join(", ")}. Run \`npm run build\` and commit dist/.`);
});

test("dist carries the repo's licence and notice, byte for byte", () => {
  for (const name of ["LICENSE", "NOTICE"]) {
    assert.ok(readFileSync(join(committed, name)).equals(readFileSync(join(repoRoot, name))), name);
  }
});

test("an edited source without a rebuild is reported as stale, by file name", () => {
  const root = copySources();
  const source = join(root, "tokens", "tokens.css");
  writeFileSync(source, readFileSync(source, "utf8").replace("--gw-space-xs: 4px", "--gw-space-xs: 5px"));
  const stale = staleFiles({ root, distDir: committed });
  assert.ok(stale.includes("tokens.css"), `expected tokens.css in ${JSON.stringify(stale)}`);
  assert.ok(stale.includes("tokens.json"));
});

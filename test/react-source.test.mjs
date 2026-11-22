import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";

import { listFiles } from "../scripts/build.mjs";
import { repoRoot } from "./helpers.mjs";

test("the React source ships in dist/react/ as the two files and nothing else", () => {
  assert.deepEqual(listFiles(join(repoRoot, "dist", "react")), ["busy-button.tsx", "use-transcript.ts"]);
});

test("the React source typechecks in strict use, and each misuse in the fixture is a type error", () => {
  const tsc = join(repoRoot, "node_modules", ".bin", "tsc");
  execFileSync(tsc, ["--noEmit", "-p", join(repoRoot, "test", "fixtures", "react-source")], { stdio: "pipe" });
});

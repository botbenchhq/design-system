#!/usr/bin/env node
// A Claude Code hook for an app that vendors the system. Usage: node claude-hook.mjs <config file>
// It reads the hook event from standard input and takes its paths from the checker's config file.
//   Before an edit: denies a change to a file inside the vendored copy.
//   After an edit: runs the static scan on the edited file when it is a UI file under the configured paths.
// The app's test and end-to-end commands are the gate. This only reports sooner.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const UI_FILES = new Set([".css", ".html", ".jsx", ".tsx", ".js", ".ts"]);

const configPath = resolve(process.argv[2]);
const base = dirname(configPath);
const config = JSON.parse(readFileSync(configPath, "utf8"));
const event = JSON.parse(readFileSync(0, "utf8"));
const file = event.tool_input?.file_path;

const isInside = (dir, path) => {
  const between = relative(resolve(base, dir), path);
  return between !== "" && !between.startsWith("..") && !isAbsolute(between);
};

if (file && event.hook_event_name === "PreToolUse" && config.vendorDir && isInside(config.vendorDir, file)) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `${config.vendorDir} is a read-only copy of the design system. Change the system in its own repo and sync again.`,
      },
    }),
  );
}

if (file && event.hook_event_name === "PostToolUse" && UI_FILES.has(extname(file)) && (config.paths ?? []).some((dir) => isInside(dir, file))) {
  const checker = join(dirname(fileURLToPath(import.meta.url)), "..", "checker", "check.mjs");
  const result = spawnSync(process.execPath, [checker, "--config", configPath, file], { cwd: base, encoding: "utf8" });
  if (result.status !== 0) {
    // Exit code 2 shows this to the agent that made the edit.
    process.stderr.write(result.stdout + result.stderr);
    process.exitCode = 2;
  }
}

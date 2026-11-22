#!/usr/bin/env node
// Rewrites an app's own source from the names of 0.5 to the names of 0.6.0: the prefix gw becomes ds,
// and the vendored folder, the stylesheet, the tabs module and the config file take their new names.
// Usage: node <vendored copy>/migrate-prefix.mjs [--dry-run] <paths…>
//
// It reads .css, .html, .htm, .js, .mjs, .cjs, .jsx, .ts, .mts, .cts, .tsx, .json and .md files. It skips node_modules,
// every directory whose name starts with a dot, and any synced copy of the system, which holds hashes.json and VERSION.
// It prints each file it changed and a total. Run twice, the second run changes nothing.
//
// Exit codes: 0 done, 2 the command could not run.

import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const USAGE = "Usage: node migrate-prefix.mjs [--dry-run] <paths…>";
const TEXT_FILES = new Set([".css", ".html", ".htm", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts", ".cts", ".tsx", ".json", ".md"]);

// Old form, new form, in the order they are applied. A longer form comes before the shorter one it contains.
export const REWRITES = [
  [/\bbehaviors\/groundwork\.js\b/g, "behaviors/tabs.js"],
  [/\bvendor\/groundwork(?![\w-])/g, "vendor/design-system"],
  [/(?<![\w-])groundwork\.config\.json\b/g, "design-system.config.json"],
  [/(?<![\w-])groundwork\.css\b/g, "design-system.css"],
  [/\$extensions\.groundwork\b/g, '$extensions["design-system"]'],
  [/(?<![\w-])data-gw-/g, "data-ds-"],
  [/(?<![\w-])--gw-/g, "--ds-"],
  // A cascade layer, also when its dot is escaped in a regular expression.
  [/(?<![\w$.-])gw(\\?\.)(reset|tokens|base|components)\b/g, "ds$1$2"],
  // A class, element, keyframe, icon id or waiver. Not inside a word, and not a path segment such as example.com/gw-reports.
  [/(?<![\w-])(?<![\w./-]\/)gw-/g, "ds-"],
  [/\bdataset\.gw(?=[A-Z])/g, "dataset.ds"],
  [/\bgwCheckDom\b/g, "dsCheckDom"],
  [/\bGw(Tabs|Combobox|CommandPalette|Transcript|Elapsed)\b/g, "Ds$1"],
];

// The text with every old form rewritten, and how many were.
export function migrate(text) {
  let count = 0;
  let out = text;
  for (const [pattern, replacement] of REWRITES) {
    out = out.replace(pattern, (...match) => {
      count++;
      return replacement.replace(/\$(\d)/g, (_, group) => match[Number(group)]);
    });
  }
  return { text: out, count };
}

const self = realpathSync(fileURLToPath(import.meta.url));
// The directory this script runs from is the vendored copy itself.
const isSyncedCopy = (dir) => realpathSync(dir) === dirname(self) || (existsSync(join(dir, "hashes.json")) && existsSync(join(dir, "VERSION")));

function filesUnder(path) {
  if (statSync(path).isFile()) return TEXT_FILES.has(extname(path)) && !isSyncedCopy(dirname(path)) ? [path] : [];
  if (isSyncedCopy(path)) return [];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") files.push(...filesUnder(full));
    } else if (entry.isFile() && TEXT_FILES.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function run(argv, cwd, print) {
  const dryRun = argv.includes("--dry-run");
  const unknown = argv.filter((argument) => argument.startsWith("--") && argument !== "--dry-run");
  const paths = argv.filter((argument) => !argument.startsWith("--")).map((path) => resolve(cwd, path));
  if (unknown.length > 0 || paths.length === 0) throw new Error(USAGE);
  const missing = paths.find((path) => !existsSync(path));
  if (missing) throw new Error(`Not found: ${missing}`);

  let changed = 0;
  let total = 0;
  for (const file of [...new Set(paths.flatMap(filesUnder))]) {
    const before = readFileSync(file, "utf8");
    const { text, count } = migrate(before);
    if (count === 0 || text === before) continue;
    if (!dryRun) writeFileSync(file, text);
    changed++;
    total += count;
    print(`${relative(cwd, file).split(sep).join("/")}: ${count}`);
  }
  print(`${dryRun ? "Would change" : "Changed"} ${changed} ${changed === 1 ? "file" : "files"}, ${total} ${total === 1 ? "name" : "names"}.`);
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === self) {
  try {
    run(process.argv.slice(2), process.cwd(), (line) => process.stdout.write(`${line}\n`));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

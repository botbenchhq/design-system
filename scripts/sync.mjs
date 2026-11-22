#!/usr/bin/env node
// Puts a copy of dist/ into an app's repo and records the hash of every file, which the checker verifies.
// Usage: node scripts/sync.mjs --to <dir> [--from <dist dir>] [--check]
//
// A copy that was edited by hand is never overwritten: the run stops and names the files.
// With --check nothing is written. It prints one line when the source holds a newer version than the copy.
//
// Exit codes: 0 done, 1 stopped without writing, 2 the command could not run.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { HASH_FILE, verifyVendored } from "../checker/vendor.mjs";
import { listFiles } from "./build.mjs";

const USAGE = "Usage: node scripts/sync.mjs --to <dir> [--from <dist dir>] [--check]";

class Stop extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
}

function parseArguments(argv) {
  const options = { to: null, from: fileURLToPath(new URL("../dist", import.meta.url)), check: false };
  for (let at = 0; at < argv.length; at++) {
    const argument = argv[at];
    if (argument === "--check") options.check = true;
    else if ((argument === "--to" || argument === "--from") && argv[at + 1] !== undefined) options[argument.slice(2)] = resolve(argv[++at]);
    else throw new Stop(USAGE, 2);
  }
  if (options.to === null) throw new Stop(USAGE, 2);
  return options;
}

const hashOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const versionOf = (dir) => readFileSync(join(dir, "VERSION"), "utf8").trim();
const readJson = (dir, name) => (existsSync(join(dir, name)) ? JSON.parse(readFileSync(join(dir, name), "utf8")) : {});
const named = (names) => (names.length > 0 ? names.join(", ") : "none");

function isNewer(version, than) {
  const [a, b] = [version, than].map((text) => text.split(".").map(Number));
  const at = a.findIndex((part, index) => part !== b[index]);
  return at !== -1 && a[at] > b[at];
}

// Advisory only. A source that cannot be read is not a failure: the app may be checked where the source is absent.
function checkFreshness({ from, to }, shown) {
  let source;
  let copy;
  try {
    [source, copy] = [versionOf(from), versionOf(to)];
  } catch {
    return [];
  }
  return isNewer(source, copy) ? [`The design system ${source} is available. ${shown} holds ${copy}. Sync to update.`] : [];
}

// What changed between two copies, from their component indexes and rule lists.
function changes(from, to) {
  const entries = (dir, list) => new Map((readJson(dir, "components.json")[list] ?? []).map((entry) => [entry.name, JSON.stringify(entry)]));
  const rules = (dir) => readJson(dir, "manifest.json").rules ?? [];
  const [oldRules, newRules] = [rules(to), rules(from)];
  const lines = (label, list) => {
    const [older, newer] = [entries(to, list), entries(from, list)];
    return [
      `${label} added: ${named([...newer.keys()].filter((name) => !older.has(name)))}`,
      `${label} changed: ${named([...newer.keys()].filter((name) => older.has(name) && older.get(name) !== newer.get(name)))}`,
      `${label} removed: ${named([...older.keys()].filter((name) => !newer.has(name)))}`,
    ];
  };
  return [
    ...lines("Components", "components"),
    ...lines("Patterns", "patterns"),
    `Rules added: ${named(newRules.filter((id) => !oldRules.includes(id)))}`,
    `Rules removed: ${named(oldRules.filter((id) => !newRules.includes(id)))}`,
  ];
}

function sync({ from, to }, shown, print) {
  if (!existsSync(join(from, "VERSION"))) throw new Stop(`No built copy of the system at ${from}. Run \`npm run build\` there first.`, 2);
  const hashes = Object.fromEntries(listFiles(from).map((name) => [name, hashOf(join(from, name))]));

  let previous = null;
  if (existsSync(join(to, HASH_FILE))) {
    const edited = verifyVendored(to).map((finding) => relative(to, finding.file).replaceAll("\\", "/"));
    if (edited.length > 0) {
      throw new Stop(
        [
          `Stopped. These files in ${shown} were changed or removed since the last sync:`,
          ...edited.map((name) => `  ${name}`),
          "Nothing was written. Restore them from version control, and make the change in the design system's repo.",
        ].join("\n"),
      );
    }
    previous = JSON.parse(readFileSync(join(to, HASH_FILE), "utf8")).files;
  } else if (existsSync(to) && readdirSync(to).length > 0) {
    throw new Stop(`Stopped. ${shown} holds files and no ${HASH_FILE}, so it is not a synced copy. Sync into an empty directory.`);
  }

  const version = versionOf(from);
  if (previous && JSON.stringify(previous) === JSON.stringify(hashes)) {
    print(`${shown} is already at ${version}. Nothing to change.`);
    return;
  }

  if (previous) {
    print(`The design system ${versionOf(to)} -> ${version} in ${shown}`);
    for (const line of changes(from, to)) print(line);
  } else {
    const { components = [] } = readJson(from, "components.json");
    const { rules = [] } = readJson(from, "manifest.json");
    print(`The design system ${version}, first sync into ${shown}: ${components.length} components, ${rules.length} checker rules`);
  }

  const removed = Object.keys(previous ?? {}).filter((name) => !(name in hashes));
  for (const name of removed) rmSync(join(to, name), { force: true });
  for (const name of Object.keys(hashes)) {
    mkdirSync(dirname(join(to, name)), { recursive: true });
    copyFileSync(join(from, name), join(to, name));
  }
  writeFileSync(join(to, HASH_FILE), `${JSON.stringify({ files: hashes }, null, 2)}\n`);
  print(`Wrote ${Object.keys(hashes).length} files and ${HASH_FILE}${removed.length > 0 ? `, removed ${removed.length}` : ""}`);
}

try {
  const options = parseArguments(process.argv.slice(2));
  const shown = relative(process.cwd(), options.to).replaceAll("\\", "/") || ".";
  const print = (line) => process.stdout.write(`${line}\n`);
  if (options.check) checkFreshness(options, shown).forEach(print);
  else sync(options, shown, print);
} catch (error) {
  if (!(error instanceof Stop)) throw error;
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code;
}

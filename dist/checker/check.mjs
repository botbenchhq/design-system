#!/usr/bin/env node
// The static scan. Usage: node check.mjs [--json] [--config path] [--manifest path] <paths…>
//
// Exit codes: 0 clean, 1 findings, 2 the checker could not run. A crash never reads as a pass.
// There is no option that switches a rule off. The one exception to a rule is an inline waiver.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { oldPrefix } from "./classes.mjs";
import { jsonReport, textReport } from "./report.mjs";
import { scanCss } from "./scan-css.mjs";
import { scanHtml } from "./scan-html.mjs";
import { scanScript } from "./scan-script.mjs";
import { scanStructure } from "./scan-structure.mjs";
import { verifyVendored } from "./vendor.mjs";
import { loadVocabulary } from "./vocabulary.mjs";
import { applyWaivers, oldWaiverLines, parseWaivers } from "./waivers.mjs";

const USAGE = "Usage: node check.mjs [--json] [--config path] [--manifest path] <paths…>";
const CONFIG_KEYS = ["paths", "appPrefix", "gaps", "vendorDir"];
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", "build", "coverage"]);

const script = (jsx) => (text, options) => scanScript(text, { ...options, jsx });

// The scanners, by stage and file extension. Stages run in this order, so a finding from an earlier
// stage is never hidden by a later one. The last stage is the structural rules, which read a static page as a tree.
const STAGES = [
  { ".css": scanCss },
  {
    ".html": scanHtml, ".htm": scanHtml,
    ".jsx": script(true), ".tsx": script(true), ".js": script(true),
    ".mjs": script(false), ".cjs": script(false), ".ts": script(false), ".mts": script(false), ".cts": script(false),
  },
  { ".html": scanStructure, ".htm": scanStructure },
];
const SCANNED = new Set(STAGES.flatMap((stage) => Object.keys(stage)));

// What went wrong is the user's to fix: a bad argument, a missing file, a path with nothing to scan.
class Misuse extends Error {}

function parseArguments(argv) {
  const options = { json: false, config: null, manifest: null, paths: [] };
  for (let at = 0; at < argv.length; at++) {
    const argument = argv[at];
    if (argument === "--json") options.json = true;
    else if (argument === "--config" || argument === "--manifest") {
      if (argv[at + 1] === undefined) throw new Misuse(`${argument} needs a path.\n${USAGE}`);
      options[argument.slice(2)] = argv[++at];
    } else if (argument.startsWith("--")) throw new Misuse(`Unknown option ${argument}.\n${USAGE}`);
    else options.paths.push(argument);
  }
  return options;
}

function readJson(path, what) {
  if (!existsSync(path)) throw new Misuse(`${what} not found: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Misuse(`${what} is not valid JSON: ${path} (${error.message})`);
  }
}

function readConfig(path) {
  if (path === null) return { paths: [], appPrefix: null, gaps: [], gapClasses: new Set(), appLocalFiles: new Set(), vendorDir: null };
  const config = readJson(path, "The config file");
  const unknown = Object.keys(config).filter((key) => !CONFIG_KEYS.includes(key));
  if (unknown.length > 0) {
    throw new Misuse(`The config file has an unknown key: ${unknown.join(", ")}. It holds only ${CONFIG_KEYS.join(", ")}.`);
  }
  const base = dirname(resolve(path));
  let gaps = [];
  let gapBase = base;
  if (config.gaps) {
    const gapPath = resolve(base, config.gaps);
    gapBase = dirname(gapPath);
    gaps = readJson(gapPath, "The gap file").gaps;
    if (!Array.isArray(gaps)) throw new Misuse(`The gap file must hold a "gaps" list: ${gapPath}`);
  }
  return {
    paths: (config.paths ?? []).map((path) => resolve(base, path)),
    appPrefix: config.appPrefix ?? null,
    gaps: gaps.map((gap) => ({ name: gap.name, reason: gap.reason, classes: gap.classes ?? [] })),
    gapClasses: new Set(gaps.flatMap((gap) => gap.classes ?? [])),
    appLocalFiles: new Set(gaps.flatMap((gap) => gap.files ?? []).map((file) => resolve(gapBase, file))),
    vendorDir: config.vendorDir ? resolve(base, config.vendorDir) : null,
  };
}

function filesUnder(path, vendorDir) {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return SCANNED.has(extname(path)) ? [path] : [];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || SKIPPED_DIRECTORIES.has(entry.name) || full === vendorDir) continue;
      files.push(...filesUnder(full, vendorDir));
    } else if (SCANNED.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const byPlace = (a, b) => a.file.localeCompare(b.file) || a.line - b.line;

// In a built copy the checker sits in a checker/ directory beside the manifest.
function shippedManifest() {
  const here = dirname(fileURLToPath(import.meta.url));
  const beside = join(here, "manifest.json");
  return existsSync(beside) ? beside : join(here, "..", "manifest.json");
}

function run(argv, cwd) {
  const options = parseArguments(argv);
  const manifestPath = options.manifest ? resolve(cwd, options.manifest) : shippedManifest();
  if (!existsSync(manifestPath)) throw new Misuse(`The manifest was not found: ${manifestPath}`);
  const vocabulary = loadVocabulary(manifestPath);
  const config = readConfig(options.config ? resolve(cwd, options.config) : null);
  const shown = (path) => relative(cwd, path).split(sep).join("/");
  // rules is how many rules the checker holds, so a reader of the summary can tell an old copy from a new one.
  const result = (findings, waivers, filesScanned) => ({ findings, waivers, gaps: config.gaps, filesScanned, rules: vocabulary.rules.length });

  // A changed vendored copy ends the run: the allowlists the other rules read are part of it.
  if (config.vendorDir) {
    const changed = verifyVendored(config.vendorDir).map((finding) => ({ ...finding, file: shown(finding.file) }));
    if (changed.length > 0) return { options, ...result(changed, [], 0) };
  }

  const roots = options.paths.length > 0 ? options.paths.map((path) => resolve(cwd, path)) : config.paths;
  if (roots.length === 0) throw new Misuse(`No paths to scan.\n${USAGE}`);
  const files = new Set();
  for (const root of roots) {
    const found = filesUnder(root, config.vendorDir);
    if (found.length === 0) throw new Misuse(`No files to scan at ${shown(root)}.`);
    for (const file of found) files.add(file);
  }

  const sources = new Map([...files].map((file) => [file, readFileSync(file, "utf8")]));
  const waiversByFile = new Map();
  for (const [file, text] of sources) {
    const waivers = parseWaivers(text);
    if (waivers.length > 0) waiversByFile.set(shown(file), waivers);
  }

  const found = [];
  for (const stage of STAGES) {
    const stageFindings = [];
    for (const [file, text] of sources) {
      const scan = stage[extname(file)];
      if (!scan) continue;
      stageFindings.push(
        ...scan(text, {
          file: shown(file),
          vocabulary,
          appPrefix: config.appPrefix,
          gapClasses: config.gapClasses,
          appLocalFile: config.appLocalFiles.has(file),
        }),
      );
    }
    found.push(...stageFindings.sort(byPlace));
  }
  const oldWaivers = [...sources].flatMap(([file, text]) =>
    oldWaiverLines(text).map((line) => ({ file: shown(file), line, ...oldPrefix("gw-waive", vocabulary) })),
  );
  found.push(...oldWaivers.sort(byPlace));

  const { invalid, unused, used, standing } = applyWaivers(found, waiversByFile);
  const findings = [...invalid.sort(byPlace), ...standing, ...unused.sort(byPlace)];
  return { options, ...result(findings, used.sort(byPlace), files.size) };
}

try {
  const { options, ...result } = run(process.argv.slice(2), process.cwd());
  process.stdout.write(options.json ? jsonReport(result) : textReport(result));
  process.exitCode = result.findings.length > 0 ? 1 : 0;
} catch (error) {
  process.stderr.write(error instanceof Misuse ? `${error.message}\n` : `The checker crashed: ${error.stack}\n`);
  process.exitCode = 2;
}

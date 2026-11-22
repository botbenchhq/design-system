import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { lexScript } from "../../checker/lex-script.mjs";
import { parseWaivers } from "../../checker/waivers.mjs";
import { manifestWithClasses, repoRoot, tempDir } from "../helpers.mjs";

const cli = join(repoRoot, "checker", "check.mjs");
const fixtures = join(repoRoot, "test", "fixtures", "checker");
const distManifest = join(repoRoot, "dist", "manifest.json");

// Runs the real command. Fixture paths in the output are relative to the fixtures directory.
function check(args, { manifest = distManifest, cwd = fixtures } = {}) {
  const result = spawnSync(process.execPath, [cli, "--manifest", manifest, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function checkJson(args, options) {
  const result = check(["--json", ...args], options);
  return { ...result, report: JSON.parse(result.stdout) };
}

const brief = (findings) => findings.map((finding) => `${finding.file}:${finding.line} ${finding.rule}`);

test("a raw colour in CSS fails with the file, line, rule and nearest token", () => {
  const { status, stdout } = check(["css/raw-color.css"]);
  assert.equal(status, 1);
  const line = stdout.split("\n").find((text) => text.includes("raw-color"));
  assert.match(line, /^css\/raw-color\.css:3\b/);
  assert.match(line, /#6366f1/);
  assert.match(line, /var\(--ds-color-blocked\)/);
});

test("an off-scale padding fails, and a spacing token or zero passes", () => {
  const { status, report } = checkJson(["css/spacing.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["css/spacing.css:2 off-scale-spacing"]);
  assert.match(report.findings[0].fix, /var\(--ds-space-md\)/);
});

test("a gradient built only from tokens still fails", () => {
  const { status, report } = checkJson(["css/gradient.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["css/gradient.css:2 banned-gradient"]);
});

test("a backdrop filter built only from tokens still fails", () => {
  const { status, report } = checkJson(["css/backdrop.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["css/backdrop.css:2 banned-backdrop-filter"]);
});

test("a media query at 900px fails and one at 768px passes", () => {
  const { status, report } = checkJson(["css/breakpoint.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["css/breakpoint.css:1 off-breakpoint"]);
  assert.match(report.findings[0].fix, /768px/);
});

test("two arbitrary Tailwind values in a TSX file are two findings", () => {
  const { status, report } = checkJson(["markup/arbitrary.tsx"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["markup/arbitrary.tsx:2 arbitrary-value", "markup/arbitrary.tsx:2 arbitrary-value"]);
  assert.deepEqual(report.findings.map((finding) => finding.message.match(/^\S+/)[0]), ["bg-[#111]", "p-[13px]"]);
});

test("visual utilities in a screen are findings and a spacing utility is not", () => {
  const { status, report } = checkJson(["markup/screen.tsx"]);
  assert.equal(status, 1);
  assert.deepEqual(report.findings.map((finding) => finding.rule), ["visual-utility", "visual-utility", "visual-utility"]);
  assert.deepEqual(report.findings.map((finding) => finding.message.match(/^\S+/)[0]), ["rounded-md", "border", "bg-surface"]);
});

test("the same visual utilities pass in a file declared as an app-local component", () => {
  const { status, report } = checkJson(["--config", "app-local/design-system.config.json", "app-local/src/run-ledger.tsx"]);
  assert.deepEqual(report.findings, []);
  assert.equal(status, 0);
});

test("a system class built by template interpolation fails with the dynamic-class rule", () => {
  const { status, report } = checkJson(["markup/dynamic.tsx"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["markup/dynamic.tsx:2 dynamic-class"]);
});

test("a link into the icon sprite is not read as a class, interpolated or literal, in TSX and in HTML", () => {
  for (const file of ["markup/icon-sprite.tsx", "markup/icon-sprite.html"]) {
    const { status, report } = checkJson([file]);
    assert.deepEqual(report.findings, [], file);
    assert.equal(status, 0, file);
  }
});

test("the name of a sprite symbol used as a class is still checked as a class", () => {
  const { status, report } = checkJson(["markup/icon-class.tsx"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["markup/icon-class.tsx:2 unknown-class", "markup/icon-class.tsx:5 dynamic-class"]);
});

test("a misspelt system class fails and suggests the nearest known one", () => {
  const manifest = manifestWithClasses(["ds-badge", "ds-button", "ds-button--primary"]);
  const { status, report } = checkJson(["markup/typo.tsx"], { manifest });
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["markup/typo.tsx:2 unknown-class"]);
  assert.match(report.findings[0].fix, /ds-button\b(?!-)/);
});

test("an inline style in HTML fails and a custom property set from script passes", () => {
  const html = checkJson(["markup/inline-style.html"]);
  assert.equal(html.status, 1);
  assert.deepEqual(brief(html.report.findings), ["markup/inline-style.html:4 inline-style"]);

  const script = checkJson(["markup/script-style.js"]);
  assert.deepEqual(script.report.findings, []);
  assert.equal(script.status, 0);
});

test("a waiver with no reason is ignored and reported as its own finding", () => {
  const { status, report } = checkJson(["waivers/no-reason.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["waivers/no-reason.css:2 waiver-without-reason", "waivers/no-reason.css:3 raw-color"]);
  assert.deepEqual(report.waivers, []);

  // The same waiver with a reason holds, and the run prints it.
  const waived = check(["waivers/with-reason.css"]);
  assert.equal(waived.status, 0);
  assert.match(waived.stdout, /waivers\/with-reason\.css:2\s+raw-color\s+the partner logo colour is fixed by contract/);
});

test("a waiver that matches no finding is reported as unused", () => {
  const { status, report } = checkJson(["waivers/unused.css"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["waivers/unused.css:2 unused-waiver"]);
});

test("a name with the prefix from before 0.6.0 fails with old-prefix, which names the codemod and the new name", () => {
  const html = checkJson(["old-prefix/screen.html"]);
  assert.equal(html.status, 1);
  assert.deepEqual(brief(html.report.findings), [
    "old-prefix/screen.html:4 old-prefix",
    "old-prefix/screen.html:5 old-prefix",
    "old-prefix/screen.html:5 old-prefix",
    "old-prefix/screen.html:5 old-prefix",
    "old-prefix/screen.html:6 old-prefix",
    // With its only system class misspelt by the old prefix, the view uses no component of the system.
    "old-prefix/screen.html:5 unstyled-controls",
    "old-prefix/screen.html:8 old-prefix",
  ]);
  const names = (report) => report.findings.filter(({ rule }) => rule === "old-prefix").map(({ message }) => message.match(/^\S+/)[0]);
  assert.deepEqual(names(html.report), ["gw-tabs", "gw-button", "gw-button--primary", "data-gw-critical", "gw-icon-check", "gw-waive"]);
  assert.match(html.report.findings[1].message, /migrate-prefix\.mjs/);
  assert.match(html.report.findings[1].fix, /migrate-prefix\.mjs .*The new name is ds-button\.$/);

  const script = checkJson(["old-prefix/screen.tsx"]);
  assert.deepEqual(names(script.report), ["gw-card__title", "--gw-progress", "gw-transcript", "data-gw-scroller", "gw-button", "gw-button--small", "gw-waive"]);
  assert.deepEqual(script.report.findings.map(({ rule }) => rule).filter((rule) => rule !== "old-prefix"), []);

  const css = checkJson(["old-prefix/app.css"]);
  assert.deepEqual(names(css.report), ["gw.components", "data-gw-critical", "--gw-space-md", "gw-streaming-turn", "--gw-color-accent"]);
  assert.deepEqual(css.report.findings.map(({ fix }) => fix.match(/\S+\.$/)[0]), ["ds.components.", "data-ds-critical.", "--ds-space-md.", "ds-streaming-turn.", "--ds-color-accent."]);

  const unchanged = checkJson(["old-prefix/unchanged.tsx"]);
  assert.deepEqual([unchanged.status, unchanged.report.findings], [0, []]);
});

test("a changed vendored file fails before any other rule and names the file", () => {
  const dir = tempDir();
  cpSync(join(fixtures, "vendored"), dir, { recursive: true });
  const vendor = join(dir, "vendor", "design-system");
  const files = Object.fromEntries(
    readdirSync(vendor).map((name) => [name, createHash("sha256").update(readFileSync(join(vendor, name))).digest("hex")]),
  );
  writeFileSync(join(vendor, "hashes.json"), JSON.stringify({ files }));
  const args = ["--config", "design-system.config.json"];

  const intact = checkJson(args, { cwd: dir });
  assert.deepEqual(brief(intact.report.findings), ["src/app.css:2 raw-color"]);

  const original = readFileSync(join(vendor, "design-system.css"), "utf8");
  writeFileSync(join(vendor, "design-system.css"), original.replace("sm", "md"));
  const changed = checkJson(args, { cwd: dir });
  assert.equal(changed.status, 1);
  assert.deepEqual(brief(changed.report.findings), ["vendor/design-system/design-system.css:1 vendored-file-changed"]);
  assert.equal(changed.report.filesScanned, 0);
});

test("a declared app-local class styled with tokens passes and is listed in the summary", () => {
  const { status, stdout } = check(["--config", "app-local/design-system.config.json"]);
  assert.equal(status, 0);
  assert.match(stdout, /Declared gaps \(1\)/);
  assert.match(stdout, /Run ledger\s+sm-run-ledger\s+No catalogue component shows a run's cost lines\./);
  const { rules } = JSON.parse(readFileSync(distManifest, "utf8"));
  assert.equal(rules.length, 41);
  assert.match(stdout, /^0 findings, 0 waivers, 1 declared gap, 3 files scanned, 41 rules$/m);
});

test("the summary line and the JSON report say how many rules the checker holds", () => {
  const text = check(["css/spacing.css"]);
  assert.match(text.stdout, /\n1 finding, 0 waivers, 0 declared gaps, 1 file scanned, 41 rules\n$/);
  assert.equal(checkJson(["css/spacing.css"]).report.rules, 41);
  // The count comes from the manifest the run reads, so a copy with one rule says so.
  const dir = tempDir();
  const manifest = JSON.parse(readFileSync(distManifest, "utf8"));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ ...manifest, rules: ["raw-color"] }));
  cpSync(join(repoRoot, "dist", "tokens.css"), join(dir, "tokens.css"));
  assert.match(check(["css/spacing.css"], { manifest: join(dir, "manifest.json") }).stdout, /1 file scanned, 1 rule\n$/);
});

test("an app-local class missing from the gap file fails", () => {
  const { status, report } = checkJson(["--config", "app-local/design-system.config.json", "app-local/undeclared"]);
  assert.equal(status, 1);
  assert.deepEqual(brief(report.findings), ["app-local/undeclared/panel.tsx:2 undeclared-app-class"]);
  assert.match(report.findings[0].message, /^sm-cost-panel\b/);
});

test("a CSS syntax error is a parse finding with exit code 1, not a crash", () => {
  const { status, report, stderr } = checkJson(["css/syntax-error.css"]);
  assert.equal(status, 1);
  assert.equal(stderr, "");
  assert.deepEqual(report.findings.map((finding) => finding.rule), ["parse-error"]);
  assert.equal(report.findings[0].file, "css/syntax-error.css");
});

test("a path that matches no files exits with the crash code and a message", () => {
  const { status, stdout, stderr } = check(["no-such-directory"]);
  assert.equal(status, 2);
  assert.equal(stdout, "");
  assert.match(stderr, /no-such-directory/);
});

// Valid source the scanners once misread, or could. Each of these files is clean.
for (const [name, why] of [
  ["jsx-text.tsx", "an apostrophe in element text does not start a string"],
  ["lookup-table.tsx", "table keys, compared values and regular expressions are not classes"],
  ["generics.tsx", "type arguments and comparisons are not tags"],
  ["class-helpers.tsx", "class helper arrays, conditions and object keys are read as classes"],
  ["app-styles.css", "font faces, Tailwind directives, data URLs and braces in comments parse"],
]) {
  test(`valid source is not misread: ${why}`, () => {
    const { status, report } = checkJson([`characterisation/${name}`]);
    assert.deepEqual(report.findings, []);
    assert.equal(status, 0);
  });
}

test("the script reader keeps strings, template parts and element attributes apart", () => {
  const tokens = lexScript('const a = <p className="flex" title={`x ${b}`}>it\'s</p>;', { jsx: true });
  const element = tokens.find((token) => token.type === "jsx");
  assert.equal(element.name, "p");
  assert.deepEqual(element.attrs.map((attr) => attr.name), ["className", "title"]);
  assert.equal(element.attrs[0].value.str, "flex");
  assert.deepEqual(element.attrs[1].value.expr[0].quasis.map((quasi) => quasi.value), ["x ", ""]);
  assert.equal(tokens.at(-1).value, ";");
});

test("a waiver comment yields its rule, reason and line in each comment style", () => {
  const waivers = parseWaivers(
    ["/* ds-waive raw-color: fixed by contract */", "// ds-waive inline-style: measured at run time", "<!-- ds-waive visual-utility -->"].join("\n"),
  );
  assert.deepEqual(waivers, [
    { line: 1, rule: "raw-color", reason: "fixed by contract" },
    { line: 2, rule: "inline-style", reason: "measured at run time" },
    { line: 3, rule: "visual-utility", reason: "" },
  ]);
});

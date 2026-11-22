import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { FIXTURE_CLASSES, manifestWithClasses, repoRoot, tempDir } from "../helpers.mjs";

const cli = join(repoRoot, "checker", "check.mjs");
const fixtures = join(repoRoot, "test", "fixtures");
const manifest = manifestWithClasses(FIXTURE_CLASSES);

function check(paths, cwd) {
  const result = spawnSync(process.execPath, [cli, "--json", "--manifest", manifest, ...paths], { cwd, encoding: "utf8" });
  assert.notEqual(result.status, 2, result.stderr);
  return { status: result.status, findings: JSON.parse(result.stdout).findings };
}

// Runs the real command on one page and returns its findings.
function findingsFor(body) {
  const dir = tempDir();
  writeFileSync(join(dir, "page.html"), `<!doctype html>\n<html lang="en">\n<body>\n${body}\n</body>\n</html>\n`);
  return check(["page.html"], dir).findings;
}

const rulesFor = (body) => findingsFor(body).map((finding) => finding.rule);

const primary = (label) => `<button class="gw-button gw-button--primary">${label}</button>`;
const secondary = (label) => `<button class="gw-button">${label}</button>`;
const words = (amount) => Array.from({ length: amount }, (_, at) => `word${at}`).join(" ");

test("two primary buttons in one view fail and both are identified; one primary and two secondary pass", () => {
  const findings = findingsFor(`<header>${primary("Save")}</header>\n<footer>${primary("Publish")}</footer>`);
  assert.deepEqual(findings.map((finding) => `${finding.file}:${finding.line} ${finding.rule}`), [
    "page.html:4 one-primary-action",
    "page.html:5 one-primary-action",
  ]);
  assert.ok(findings.every((finding) => finding.message && finding.fix));
  assert.deepEqual(rulesFor(`${primary("Save")} ${secondary("Cancel")} ${secondary("Preview")}`), []);
});

test("a primary button on the page and another inside an open dialog pass", () => {
  assert.deepEqual(rulesFor(`${primary("Save")}\n<dialog open><p>Discard the draft?</p>${primary("Discard")}</dialog>`), []);
  assert.deepEqual(rulesFor(`${primary("Save")}\n<div role="dialog"><p>Discard the draft?</p>${primary("Discard")}</div>`), []);
  assert.deepEqual(rulesFor(`${primary("Save")}\n<div popover><p>Discard the draft?</p>${primary("Discard")}</div>`), []);
  assert.deepEqual(rulesFor(`<dialog open>${primary("Discard")} ${primary("Keep")}</dialog>`), [
    "one-primary-action",
    "one-primary-action",
  ]);
});

test("three approval cards in one view, each with Allow and Decline, pass", () => {
  const card = (tool) => `<li><article class="gw-card"><h2>${tool}</h2>${secondary("Allow")} ${secondary("Decline")}</article></li>`;
  assert.deepEqual(rulesFor(`<ul>${card("Shell")}${card("Write")}${card("Fetch")}</ul>`), []);
});

test("a primary button inside a repeated list item fails with the repeated-primary rule", () => {
  const row = (name) => `<li>${name} ${primary("Connect")}</li>`;
  assert.deepEqual(rulesFor(`<ul>${row("Mail")}${row("Chat")}</ul>`), ["repeated-item-primary", "repeated-item-primary"]);
  const card = (name) => `<div class="gw-card"><h2>${name}</h2>${primary("Open")}</div>`;
  assert.deepEqual(rulesFor(`<section>${card("Mail")}${card("Chat")}</section>`), ["repeated-item-primary", "repeated-item-primary"]);
});

test("a single card holding a primary button is not repeated and counts as its view's primary", () => {
  const card = `<div class="gw-card"><h2>Plan</h2>${primary("Upgrade")}</div>`;
  assert.deepEqual(rulesFor(card), []);
  assert.deepEqual(rulesFor(`${card}\n${primary("Save")}`), ["one-primary-action", "one-primary-action"]);
});

test("a second advanced-settings disclosure in one view fails; one passes", () => {
  const advanced = (label) => `<details data-gw-advanced><summary>${label}</summary><p>Options</p></details>`;
  assert.deepEqual(rulesFor(`${advanced("Advanced network")}\n${advanced("Advanced storage")}`), ["one-advanced-disclosure"]);
  assert.deepEqual(rulesFor(advanced("Advanced")), []);
});

test("a critical control inside a closed details with no copy outside fails", () => {
  const critical = `<button class="gw-button" data-gw-critical>Delete</button>`;
  const closed = `<details><summary>More</summary>${critical}</details>`;
  assert.deepEqual(rulesFor(closed), ["hidden-critical-action"]);
  assert.deepEqual(rulesFor(`${closed}\n<button class="gw-button">Delete</button>`), []);
  assert.deepEqual(rulesFor(`<details open><summary>More</summary>${critical}</details>`), []);
  assert.deepEqual(rulesFor(`${closed}\n<details><summary>Other</summary><button class="gw-button">Delete</button></details>`), [
    "hidden-critical-action",
  ]);
});

test("details nested three deep fails; two deep passes", () => {
  const nest = (inner) => `<details><summary>Level</summary>${inner}</details>`;
  assert.deepEqual(rulesFor(nest(nest(nest("<p>End</p>")))), ["disclosure-depth"]);
  assert.deepEqual(rulesFor(nest(nest("<p>End</p>"))), []);
});

test("a summary containing only an icon fails; one with text passes", () => {
  const icon = `<svg width="16" height="16" aria-hidden="true"><use href="/icons.svg#gw-icon-check"/></svg>`;
  assert.deepEqual(rulesFor(`<details><summary>${icon}</summary><p>Filters</p></details>`), ["summary-without-text"]);
  assert.deepEqual(rulesFor(`<details><summary>${icon} Filters</summary><p>Owner</p></details>`), []);
});

test("a card inside a card fails; a card inside a list passes", () => {
  assert.deepEqual(rulesFor(`<div class="gw-card"><h2>Outer</h2><div class="gw-card">Inner</div></div>`), ["nested-cards"]);
  assert.deepEqual(rulesFor(`<ul><li><div class="gw-card">Only</div></li></ul>`), []);
});

test("three sibling cards with identical structure fail; a data-driven list of rows passes", () => {
  const card = (title) => `<div class="gw-card"><h3>${title}</h3><p>Copy</p></div>`;
  assert.deepEqual(rulesFor(`<div class="gw-grid gw-grid-3">${card("Fast")}${card("Secure")}${card("Simple")}</div>`), [
    "identical-card-grid",
  ]);
  assert.deepEqual(rulesFor(`<div class="gw-grid">${card("Fast")}${card("Secure")}</div>`), []);
  const row = (title) => `<li class="gw-card"><h3>${title}</h3><p>Copy</p></li>`;
  assert.deepEqual(rulesFor(`<ul>${row("First")}${row("Second")}${row("Third")}</ul>`), []);
  const tableRow = (name) => `<tr><td>${name}</td><td>Ready</td></tr>`;
  assert.deepEqual(rulesFor(`<table><tbody>${tableRow("a")}${tableRow("b")}${tableRow("c")}</tbody></table>`), []);
});

test("eight status badges in one view fail the excess-badge rule; one badge per list row passes", () => {
  const badge = `<span class="gw-badge">New</span>`;
  assert.deepEqual(rulesFor(`<p>${badge.repeat(8)}</p>`), ["excess-badges"]);
  assert.deepEqual(rulesFor(`<p>${badge.repeat(7)}</p>`), []);
  assert.deepEqual(rulesFor(`<ul>${`<li>Item ${badge}</li>`.repeat(10)}</ul>`), []);
});

test("an emoji in a button label fails; an emoji inside a marked user-content region passes", () => {
  assert.deepEqual(rulesFor(`<button class="gw-button">\u{1F680} Launch</button>`), ["emoji-as-icon"]);
  assert.deepEqual(rulesFor(`<h2>Settings &#x2699;&#xFE0F;</h2>`), ["emoji-as-icon"]);
  assert.deepEqual(rulesFor(`<div data-gw-content><h2>Shipped \u{1F680}</h2><a href="/x">see \u{1F525}</a></div>`), []);
  assert.deepEqual(rulesFor(`<button class="gw-button">Launch 2</button>`), []);
});

test("the same stock call to action on three controls in one view fails", () => {
  const cta = `<a class="gw-button" href="/signup">Get started</a>`;
  assert.deepEqual(rulesFor(`${cta}\n${cta}\n<button class="gw-button">Get Started!</button>`), ["stock-phrase"]);
  assert.deepEqual(rulesFor(`${cta}\n${cta}`), []);
  assert.deepEqual(rulesFor(`${secondary("Open")}${secondary("Open")}${secondary("Open")}`), []);
});

test("long body text centred across the page fails; a short centred line and long uncentred text pass", () => {
  assert.deepEqual(rulesFor(`<p class="gw-text-center">${words(30)}</p>`), ["centred-body-text"]);
  assert.deepEqual(rulesFor(`<div class="gw-text-center"><h2>Title</h2><p>${words(30)}</p></div>`), ["centred-body-text"]);
  assert.deepEqual(rulesFor(`<p class="gw-text-center">${words(8)}</p>`), []);
  assert.deepEqual(rulesFor(`<p>${words(30)}</p>`), []);
});

test("a view whose controls use no system component fails once; one control in or on a system class passes", () => {
  const form = `<form><input type="hidden" name="id" value="4"><label for="t">Title</label><input id="t" type="text"><select><option>One</option></select><textarea></textarea><button type="submit">Save</button></form>`;
  const findings = findingsFor(form);
  assert.deepEqual(findings.map((finding) => `${finding.file}:${finding.line} ${finding.rule}`), ["page.html:4 unstyled-controls"]);
  assert.match(findings[0].message, /none of its 4 controls/);
  assert.ok(findings[0].fix);
  assert.deepEqual(rulesFor(`<button type="button">Save</button>`), ["unstyled-controls"]);

  // On the control, or on anything it sits inside.
  assert.deepEqual(rulesFor(`${form}\n${secondary("Cancel")}`), []);
  assert.deepEqual(rulesFor(`<main class="gw-container">${form}</main>`), []);
  // A view with no control, only links, or only a hidden input has nothing to report.
  assert.deepEqual(rulesFor(`<h1>Runs</h1><p>Nothing here yet.</p>`), []);
  assert.deepEqual(rulesFor(`<a href="/runs">Runs</a> <a role="button" href="/new">New</a>`), []);
  assert.deepEqual(rulesFor(`<form><input type="hidden" name="id" value="4"></form>`), []);
});

test("each view is judged by itself: a dialog of plain controls fails beside a page built from the system", () => {
  const page = `<main>${secondary("Rename")}</main>`;
  assert.deepEqual(rulesFor(`${page}\n<dialog><input type="text"><button>Save</button></dialog>`), ["unstyled-controls"]);
  assert.deepEqual(rulesFor(`${page}\n<dialog class="gw-stack"><input type="text"><button>Save</button></dialog>`), []);
  assert.deepEqual(rulesFor(`<button>Open</button>\n<dialog><button>Save</button></dialog>`), ["unstyled-controls", "unstyled-controls"]);
});

test("a class with the app's declared prefix counts as the system's, and without the prefix it does not", () => {
  const dir = tempDir();
  writeFileSync(join(dir, "page.html"), `<!doctype html>\n<html lang="en">\n<body>\n<form class="sm-ledger-form"><input type="text"><button>Save</button></form>\n</body>\n</html>\n`);
  writeFileSync(join(dir, "gaps.json"), JSON.stringify({ gaps: [{ name: "Ledger form", reason: "No component fits.", classes: ["sm-ledger-form"] }] }));
  writeFileSync(join(dir, "groundwork.config.json"), JSON.stringify({ paths: ["page.html"], appPrefix: "sm", gaps: "gaps.json" }));
  assert.deepEqual(check(["--config", "groundwork.config.json"], dir).findings, []);
  writeFileSync(join(dir, "groundwork.config.json"), JSON.stringify({ paths: ["page.html"], appPrefix: "other" }));
  assert.deepEqual(check(["--config", "groundwork.config.json"], dir).findings.map((finding) => finding.rule), ["unlisted-class", "unstyled-controls"]);
});

test("a structural finding is covered by an inline waiver on the line before it", () => {
  const body = `<!-- gw-waive nested-cards: the inner panel is a quoted record -->\n<div class="gw-card"><div class="gw-card">Inner</div></div>`;
  assert.deepEqual(rulesFor(body), []);
});

test("every page in the generic-looking corpus reports its expected rules", () => {
  const dir = join(fixtures, "slop");
  const expected = JSON.parse(readFileSync(join(dir, "expected.json"), "utf8"));
  const pages = readdirSync(dir).filter((name) => name.endsWith(".html")).sort();
  assert.deepEqual(Object.keys(expected), pages);
  const { findings } = check(["."], dir);
  const reported = Object.fromEntries(pages.map((page) => [page, []]));
  for (const finding of findings) reported[finding.file].push(finding.rule);
  for (const page of pages) reported[page].sort();
  assert.deepEqual(reported, expected);
});

test("no page in the well-structured corpus reports anything", () => {
  const { status, findings } = check(["."], join(fixtures, "clean"));
  assert.deepEqual(findings, []);
  assert.equal(status, 0);
});

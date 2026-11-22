import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { build, readComponents, readPatterns } from "../scripts/build.mjs";
import { copySources, repoRoot, tempDir } from "./helpers.mjs";

const dist = join(repoRoot, "dist");
const folders = readdirSync(join(repoRoot, "components")).sort();
const patternFolders = readdirSync(join(repoRoot, "patterns")).sort();
const META_FIELDS = [
  "name", "title", "purpose", "status", "whenToUse", "whenNotToUse", "variants", "sizes", "states",
  "accessibility", "icons", "classes",
];

// Builds a private copy of the sources after `change` has edited the button folder.
function buildWith(change) {
  const root = copySources();
  change(join(root, "components", "button"));
  return () => build({ root, outDir: tempDir() });
}

const edit = (file, change) => writeFileSync(file, change(readFileSync(file, "utf8")));

for (const file of ["meta.json", "examples.html", "button.css"]) {
  test(`a component folder without ${file} fails the build and is named`, () => {
    const run = buildWith((folder) => rmSync(join(folder, file)));
    assert.throws(run, (error) => error.message.includes("components/button") && error.message.includes(file));
  });
}

test("a component folder without a don't example fails the build and is named", () => {
  const run = buildWith((folder) =>
    edit(join(folder, "examples.html"), (html) => html.replace(/ data-dont="[^"]*"/g, "")),
  );
  assert.throws(run, /components\/button: .*don't example/);
});

test("a don't example without a reason fails the build", () => {
  const run = buildWith((folder) =>
    edit(join(folder, "examples.html"), (html) => html.replace(/(data-dont="[^"]*"[^>]*?) data-reason="[^"]*"/, "$1")),
  );
  assert.throws(run, /components\/button: .*data-reason/);
});

test("metadata listing a state with no matching example fails the build", () => {
  const run = buildWith((folder) =>
    edit(join(folder, "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), states: [...JSON.parse(json).states, "loading"] })),
  );
  assert.throws(run, /components\/button: .*"loading"/);
});

test("metadata missing a field fails the build and names the field", () => {
  const run = buildWith((folder) =>
    edit(join(folder, "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), whenNotToUse: undefined })),
  );
  assert.throws(run, /components\/button: .*whenNotToUse/);
});

test("a class in the metadata that the stylesheet does not define fails the build, and so does the reverse", () => {
  const listed = buildWith((folder) =>
    edit(join(folder, "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), classes: [...JSON.parse(json).classes, "ds-button--large"] })),
  );
  assert.throws(listed, /components\/button: .*ds-button--large/);
  const defined = buildWith((folder) =>
    edit(join(folder, "button.css"), (css) => css.replace(".ds-button--quiet", ".ds-button--ghost")),
  );
  assert.throws(defined, /components\/button: .*ds-button--ghost/);
});

test("components.json has one entry per folder, each with every metadata field and its do examples' markup", () => {
  const { components } = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  assert.deepEqual(components.map((component) => component.name), folders);
  for (const component of components) {
    assert.deepEqual(Object.keys(component), [...META_FIELDS, ...(component.statusSet ? ["statusSet"] : []), "examples"]);
    assert.ok(["draft", "stable"].includes(component.status));
    assert.ok(component.examples.length > 0);
    for (const example of component.examples) {
      assert.ok(example.id && example.title, `${component.name} example without an id or title`);
      assert.ok(example.markup.trim().startsWith("<"), `${component.name} example ${example.id} has no markup`);
      assert.doesNotMatch(example.markup, /data-example/);
    }
    for (const state of component.states) {
      assert.ok(component.examples.some((example) => example.state === state), `${component.name} has no ${state} example`);
    }
  }
  // Example ids are unique within a component, not across components.
  const donts = readComponents(repoRoot).flatMap((component) => component.examples.filter((example) => example.dont).map((example) => `${component.name}/${example.id}`));
  assert.ok(donts.length > 0);
  for (const component of components) {
    for (const example of component.examples) assert.ok(!donts.includes(`${component.name}/${example.id}`), `${component.name}/${example.id} is a don't example`);
  }
});

test("components.json lists the patterns in their own array, each marked with its kind, and leaves components as they were", () => {
  const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  assert.deepEqual(Object.keys(index), ["components", "patterns"]);
  assert.deepEqual(index.patterns.map((pattern) => pattern.name), patternFolders);
  for (const pattern of index.patterns) {
    assert.deepEqual(Object.keys(pattern), [...META_FIELDS, "kind", "examples"]);
    assert.equal(pattern.kind, "pattern");
    assert.ok(pattern.examples.length > 0);
    for (const example of pattern.examples) {
      assert.ok(example.id && example.title && example.markup.trim().startsWith("<"), `${pattern.name} example ${example.id}`);
      assert.doesNotMatch(example.markup, /data-example/);
    }
    for (const state of pattern.states) {
      assert.ok(pattern.examples.some((example) => example.state === state), `${pattern.name} has no ${state} example`);
    }
  }
  assert.ok(index.components.every((component) => !("kind" in component)));
});

test("components-index.json lists every component and pattern with only what is needed to choose one", () => {
  const full = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  const short = JSON.parse(readFileSync(join(dist, "components-index.json"), "utf8"));
  assert.deepEqual(short.map((entry) => entry.name), [...folders, ...patternFolders]);
  const entries = new Map([...full.components, ...full.patterns].map((entry) => [entry.name, entry]));
  for (const entry of short) {
    assert.deepEqual(Object.keys(entry), ["name", "kind", "title", "purpose", "status", "classes"]);
    assert.equal(entry.kind, patternFolders.includes(entry.name) ? "pattern" : "component");
    const { title, purpose, status, classes } = entries.get(entry.name);
    assert.deepEqual([entry.title, entry.purpose, entry.status, entry.classes], [title, purpose, status, classes], entry.name);
  }
  // It is for searching, so it stays a small fraction of the full index.
  const size = (name) => readFileSync(join(dist, name)).length;
  assert.ok(size("components-index.json") * 10 < size("components.json"));
});

test("the app shell pattern puts the pending tray in the header's tray, both navigations around the main column, and one h1 in the page header", () => {
  const shell = readPatterns(repoRoot).find((pattern) => pattern.name === "app-shell");
  const dos = shell.examples.filter((example) => !example.dont);
  assert.deepEqual(dos.map((example) => example.id), ["list", "table", "empty"]);
  for (const { id, html } of dos) {
    assert.match(html, /<div class="ds-app-header__tray">\s*<div class="ds-pending-tray"/, id);
    // A table view takes the wide form of the container.
    const container = id === "table" ? "ds-container ds-container--wide" : "ds-container";
    assert.match(html, new RegExp(`<div class="ds-sidebar-layout ds-app-shell__body">\\s*<nav class="ds-sidebar-nav"[\\s\\S]*</nav>\\s*<div class="${container} ds-app-shell__main">\\s*<header class="ds-page-header">`), id);
    assert.match(html, /<\/div>\s*<nav class="ds-tab-bar"[\s\S]*<\/nav>\s*<\/div>\s*<\/div>$/, id);
    assert.deepEqual(html.match(/<h1[^>]*>/g), ['<h1 class="ds-page-header__title">'], id);
  }
  const dont = shell.examples.find((example) => example.dont);
  assert.equal(dont.dont, "review");
  assert.equal(dont.html.match(/<h1\b/g).length, 2);
});

test("the sign-in pattern takes its password from the password field component", () => {
  const signIn = readPatterns(repoRoot).find((pattern) => pattern.name === "sign-in");
  for (const { id, html } of signIn.examples) {
    const passwords = html.match(/<input[^>]*type="password"[^>]*>/g);
    assert.ok(passwords.length > 0, id);
    for (const input of passwords) assert.match(input, /class="ds-field__control ds-password-field__input"/, id);
    assert.match(html, /<div class="ds-password-field">\s*<input[^>]*>\s*<button type="button" class="ds-password-field__toggle"/, id);
  }
});

test("an approval has one Decline button, with the optional note before the actions, and one example has no risk line", () => {
  const approval = readComponents(repoRoot).find((component) => component.name === "approval");
  const note = approval.examples.find((example) => example.id === "decline-note").html;
  assert.equal(note.match(/>Decline[^<]*<\/button>/g).length, 1);
  assert.ok(note.indexOf("ds-approval__note") < note.indexOf("ds-approval__actions"));
  assert.doesNotMatch(note.slice(note.indexOf("ds-approval__note"), note.indexOf("ds-approval__actions")), /<button/);
  const bare = approval.examples.find((example) => example.id === "no-risk-line");
  assert.ok(bare && !bare.dont);
  assert.doesNotMatch(bare.html, /ds-approval__risk/);
  assert.match(approval.meta.accessibility.join(" "), /risk line, ds-approval__risk, is optional/);
});

test("a message has a row for the start of a session, a question, an answered request and an error, each labelled in words", () => {
  const message = readComponents(repoRoot).find((component) => component.name === "message");
  const labels = {
    "session-start": ["Session"],
    question: ["Question, waiting on you"],
    decision: ["Allowed", "Declined", "Pre-approved", "Allowed by a standing permission"],
    error: ["Error"],
  };
  for (const [kind, expected] of Object.entries(labels)) {
    const modifier = `ds-message--${kind}`;
    assert.ok(message.meta.variants.some((variant) => variant.name === kind && variant.class === modifier), kind);
    const example = message.examples.find((candidate) => candidate.id === kind);
    assert.ok(example && !example.dont, `no do example named ${kind}`);
    const rows = [...example.html.matchAll(new RegExp(`<li class="ds-message ${modifier}">\\s*<span class="ds-message__label">(?:<svg class="ds-message__icon" aria-hidden="true"><use href="icons\\.svg#ds-icon-[a-z-]+"></use></svg>)?([^<]+)</span>`, "g"))];
    assert.deepEqual(rows.map(([, label]) => label), expected, kind);
  }
  // One modifier covers every way a request was resolved: the label carries the word and an icon, and the text says by whom.
  const decision = message.examples.find((candidate) => candidate.id === "decision").html;
  assert.equal(decision.match(/<svg class="ds-message__icon"/g).length, 4);
  assert.deepEqual([...decision.matchAll(/<p class="ds-message__body">([^<]+)</g)].map(([, text]) => /\b(you|Dana Okafor)\b/.test(text)), [true, true, true, true]);
  assert.equal(message.meta.classes.filter((name) => /allowed|declined|approved|standing/.test(name)).length, 0);

  // A tool call is the tool call component in its row form: the status, a plain summary and one plain sentence, with the raw arguments behind the disclosure.
  const described = message.examples.find((candidate) => candidate.id === "tool-call-described").html;
  assert.match(described, /<li class="ds-message ds-message--tool-call">\s*<div class="ds-tool-call ds-tool-call--row" data-state="succeeded">\s*<details class="ds-tool-call__details">\s*<summary class="ds-tool-call__summary">\s*<span class="ds-tool-call__title"><span class="ds-tool-call__status">Succeeded<\/span> Ran <code class="ds-tool-call__target">[^<]+<\/code><\/span>\s*<span class="ds-tool-call__duration">[^<]+<\/span>\s*<span class="ds-tool-call__note">[^<{]+<\/span>\s*<\/summary>\s*<div class="ds-tool-call__body">\s*<p class="ds-tool-call__label">Arguments<\/p>\s*<pre class="ds-tool-call__code">\{/);
  assert.match(message.meta.variants.find((variant) => variant.name === "tool-call").use, /not as raw JSON/);
  // One way to show a tool call in a transcript: no do example writes a tool-call row the earlier way.
  for (const component of readComponents(repoRoot)) {
    for (const example of component.examples.filter((candidate) => !candidate.dont)) {
      const rows = example.html.match(/<li class="ds-message ds-message--tool-call">\s*<[a-z]+ class="[^"]*"/g) ?? [];
      for (const row of rows) assert.match(row, /class="ds-tool-call ds-tool-call--row"$/, `${component.name} ${example.id}`);
    }
  }

  // An error is told from a denial by its word and by its icon.
  assert.match(message.css, /\.ds-message--error > \.ds-message__label::before \{\s*mask-image: url\("icons\/triangle-alert\.svg"\)/);
});

test("the data-state contract in the consumer guide matches the metadata and every example, and failed or waiting tool calls are shown open", () => {
  const guide = readFileSync(join(repoRoot, "docs", "consumer-guide.md"), "utf8");
  const section = guide.split("### Agent activity, from a framework")[1].split("\n### ")[0];
  const contract = {};
  for (const [, name, values] of section.matchAll(/^\| `([a-z-]+)`[^|]*\| [^|]+\| ([^|]*)\|/gm)) {
    contract[name] = [...values.matchAll(/`([a-z-]+)`/g)].map(([, value]) => value);
  }
  assert.deepEqual(Object.keys(contract).sort(), ["activity-announcer", "jump-to-latest", "message", "now-doing", "run-timeline", "step-group", "tool-call"]);
  assert.deepEqual(contract["tool-call"], ["requested", "awaiting-approval", "running", "succeeded", "failed", "declined", "timed-out", "cancelled"]);

  const components = readComponents(repoRoot);
  for (const [name, values] of Object.entries(contract)) {
    const meta = components.find((component) => component.name === name).meta;
    for (const value of values) assert.ok(meta.states.includes(value), `${name} metadata lists ${value}`);
  }

  // The element that carries data-state in an example, by its class, and the component whose contract applies.
  const carrier = (classes) =>
    classes.includes("ds-tool-call") ? "tool-call"
    : classes.includes("ds-step-group__callout") ? "step-group"
    : classes.includes("ds-now-doing") ? "now-doing"
    : classes.includes("ds-run-timeline__station") ? "run-timeline"
    : classes.includes("ds-message") && !classes.some((name) => name.startsWith("ds-message--")) ? "message"
    : null;
  for (const folder of [...components, ...readPatterns(repoRoot)]) {
    for (const example of folder.examples) {
      for (const [element, classList, value] of example.html.matchAll(/<[a-z-]+ class="([^"]*)"[^>]*? data-state="([^"]+)"[^>]*>/g)) {
        const name = carrier(classList.split(" "));
        assert.ok(name, `${folder.name} ${example.id}: data-state on an element no contract covers: ${element}`);
        assert.ok(contract[name].includes(value), `${folder.name} ${example.id}: ${name} has no data-state ${value}`);
      }
      if (example.dont) continue;
      // In a do example a tool call that failed or awaits approval is drawn open, except where the reader closed it.
      for (const [, state, details] of example.html.matchAll(/class="ds-tool-call[^"]*" data-state="(failed|awaiting-approval)"[^>]*>\s*(<details[^>]*>)/g)) {
        if (example.id === "approval-closed") continue;
        assert.match(details, / open>$/, `${folder.name} ${example.id}: a ${state} tool call is closed`);
      }
      // One way to show a tool call in a transcript, in the patterns too.
      for (const row of example.html.match(/<li class="ds-message ds-message--tool-call">\s*<[a-z]+ class="[^"]*"/g) ?? []) {
        assert.match(row, /class="ds-tool-call ds-tool-call--row"$/, `${folder.name} ${example.id}`);
      }
    }
  }
});

test("the check list has a timed-out result, in words with the limit and its own icon, apart from failed", () => {
  const list = readComponents(repoRoot).find((component) => component.name === "check-list");
  assert.ok(list.meta.variants.some((variant) => variant.name === "timed out" && variant.class === "ds-check-list__result--timed-out"));
  const { html } = list.examples.find((example) => example.id === "timed-out");
  assert.match(html, /<span class="ds-check-list__result ds-check-list__result--timed-out">Timed out after 10 min<\/span>/);
  assert.doesNotMatch(html, /ds-check-list__result--failed/);
  const mark = (modifier) => list.css.match(new RegExp(`\\.ds-check-list__result--${modifier}::before \\{\\s*mask-image: url\\("icons/([a-z-]+)\\.svg"\\)`))[1];
  assert.equal(mark("timed-out"), "clock");
  assert.notEqual(mark("timed-out"), mark("failed"));
});

test("the activity feed has a newest-first example: the order in words, times going back, and Show older activity at the end", () => {
  const feed = readComponents(repoRoot).find((component) => component.name === "activity-feed");
  const { html } = feed.examples.find((example) => example.id === "newest-first");
  assert.match(html, /<p class="ds-visually-hidden">The newest entry is first\.<\/p>/);
  const times = [...html.matchAll(/datetime="([^"]+)"/g)].map(([, time]) => time);
  assert.ok(times.length > 3);
  assert.deepEqual(times, [...times].sort().reverse());
  assert.ok(html.indexOf("ds-activity-feed__more") > html.lastIndexOf("ds-activity-feed__day"));
  assert.match(html, /Show older activity\s*<\/button>\s*<\/div>\s*<\/section>/);
  assert.doesNotMatch(html, /role="log"/);
});

test("the undo toast sends an action with no real undo to the confirm dialog, in its metadata and in the rules", () => {
  const toast = readComponents(repoRoot).find((component) => component.name === "undo-toast");
  assert.ok(toast.meta.whenNotToUse.some((line) => /no real undo/.test(line) && /standing permission/.test(line) && /confirm dialog/.test(line)));
  assert.match(readFileSync(join(repoRoot, "rules", "choosing-components.md"), "utf8"), /`undo-toast` or `confirm-dialog`:.*no real undo.*standing permission/);
});

test("the app header and the page header agree on which carries the h1", () => {
  const meta = (name) => readComponents(repoRoot).find((component) => component.name === name).meta.accessibility.join(" ");
  assert.match(meta("app-header"), /product name is a link to the first screen\. It is not a heading/);
  assert.match(meta("app-header"), /the page header's title is the h1/);
  assert.match(meta("page-header"), /the view's one h1/);
  const tray = readComponents(repoRoot).find((component) => component.name === "app-header").examples.find((example) => example.id === "pending-tray");
  assert.match(tray.html, /<div class="ds-app-header__tray">\s*<div class="ds-pending-tray" aria-live="polite" aria-atomic="true">/);
});

test("pattern styles are bundled after every component, inside the components layer", () => {
  const css = readFileSync(join(dist, "design-system.css"), "utf8");
  const lastComponent = css.lastIndexOf(`.ds-${folders.at(-1)}`);
  for (const pattern of readPatterns(repoRoot)) {
    assert.match(pattern.css, /@layer ds\.components/);
    assert.ok(css.indexOf(`.ds-${pattern.name}`) > lastComponent, `${pattern.name} is bundled before a component`);
  }
});

test("a pattern's gallery page lays its examples out in one column, and the index lists patterns after components", () => {
  for (const name of patternFolders) {
    const html = readFileSync(join(dist, "gallery", `${name}.html`), "utf8");
    assert.match(html, /<h2>Examples<\/h2>\n<div class="ds-grid">/, name);
  }
  assert.match(readFileSync(join(dist, "gallery", "button.html"), "utf8"), /<h2>Examples<\/h2>\n<div class="ds-grid ds-grid-2">/);
  const index = readFileSync(join(dist, "gallery", "index.html"), "utf8");
  const heading = index.indexOf("<h2>Page patterns</h2>");
  assert.ok(heading > index.lastIndexOf(`href="${folders.at(-1)}.html"`));
  for (const name of patternFolders) assert.ok(index.indexOf(`href="${name}.html"`) > heading, name);
});

test("a pattern without its kind, a component with the kind of a pattern, and a component named as a pattern each fail the build", () => {
  const pattern = copySources();
  edit(join(pattern, "patterns", "sign-in", "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), kind: undefined }));
  assert.throws(() => build({ root: pattern, outDir: tempDir() }), /patterns\/sign-in: .*"kind": "pattern"/);

  const component = buildWith((folder) =>
    edit(join(folder, "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), kind: "pattern" })),
  );
  assert.throws(component, /components\/button: .*kind/);

  const twin = copySources();
  const folder = join(twin, "components", "sign-in");
  cpSync(join(twin, "components", "button"), folder, { recursive: true });
  renameSync(join(folder, "button.css"), join(folder, "sign-in.css"));
  for (const file of ["sign-in.css", "examples.html", "meta.json"]) {
    edit(join(folder, file), (text) => text.replaceAll("ds-button", "ds-sign-in").replace('"name": "button"', '"name": "sign-in"'));
  }
  assert.throws(() => build({ root: twin, outDir: tempDir() }), /patterns\/sign-in: components\/sign-in has the same name/);
});

test("a pattern folder that breaks the contract fails the build and is named", () => {
  const root = copySources();
  rmSync(join(root, "patterns", "not-found", "examples.html"));
  assert.throws(() => build({ root, outDir: tempDir() }), /patterns\/not-found: examples\.html is missing/);
});

test("every gallery page loads each behaviour module, in order", () => {
  const modules = readdirSync(join(repoRoot, "behaviors")).filter((name) => name.endsWith(".js")).sort();
  assert.deepEqual(modules, ["combobox.js", "command-palette.js", "elapsed.js", "listbox.js", "menu.js", "tabs.js", "transcript.js"]);
  const tags = modules.map((name) => `<script type="module" src="../behaviors/${name}"></script>`).join("\n");
  for (const name of readdirSync(join(dist, "gallery")).filter((file) => file.endsWith(".html"))) {
    assert.ok(readFileSync(join(dist, "gallery", name), "utf8").includes(tags), name);
    assert.ok(existsSync(join(dist, "behaviors", modules[0])));
  }
});

test("the manifest lists every component class, every pattern class and every base layout class", () => {
  const { classes } = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
  const { components, patterns } = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  assert.ok(patterns.flatMap((pattern) => pattern.classes).length > 0);
  for (const name of [...components, ...patterns].flatMap((component) => component.classes)) assert.ok(classes.includes(name), name);
  for (const name of ["ds-stack", "ds-cluster", "ds-split", "ds-grid", "ds-grid-3", "ds-sidebar-layout", "ds-container-narrow", "ds-gap-2xl"]) {
    assert.ok(classes.includes(name), name);
  }
  assert.deepEqual(classes, [...new Set(classes)].sort());
});

test("a new folder alone adds a component to the stylesheet, the index, the manifest and the gallery", () => {
  const root = copySources();
  const folder = join(root, "components", "chip");
  cpSync(join(root, "components", "button"), folder, { recursive: true });
  renameSync(join(folder, "button.css"), join(folder, "chip.css"));
  for (const file of ["chip.css", "examples.html", "meta.json"]) {
    edit(join(folder, file), (text) => text.replaceAll("ds-button", "ds-chip").replace('"name": "button"', '"name": "chip"'));
  }
  const outDir = tempDir();
  build({ root, outDir });
  assert.match(readFileSync(join(outDir, "design-system.css"), "utf8"), /\.ds-chip--primary/);
  assert.ok(JSON.parse(readFileSync(join(outDir, "components.json"), "utf8")).components.some((component) => component.name === "chip"));
  assert.ok(JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")).classes.includes("ds-chip"));
  assert.ok(existsSync(join(outDir, "gallery", "chip.html")));
  assert.match(readFileSync(join(outDir, "gallery", "index.html"), "utf8"), /href="chip\.html"/);
});

test("every gallery page links the stylesheet relatively and carries no inline style or inline script", () => {
  const gallery = join(dist, "gallery");
  const pages = readdirSync(gallery).filter((name) => name.endsWith(".html"));
  assert.deepEqual(pages.sort(), ["index.html", ...[...folders, ...patternFolders].map((name) => `${name}.html`)].sort());
  for (const name of pages) {
    // Don't examples may show a banned pattern, so only the page around them is held to the rule.
    const html = readFileSync(join(gallery, name), "utf8").replace(/<figure data-gallery="dont"[\s\S]*?<\/figure>/g, "");
    assert.match(html, /<link rel="stylesheet" href="\.\.\/design-system\.css">/);
    assert.doesNotMatch(html, /\sstyle=|<style\b/);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);
  }
});

// The shipped checker, run once over every example as a page of its own and over every component and pattern stylesheet.
function checkExamples() {
  const dir = tempDir();
  const examples = [];
  for (const component of [...readComponents(repoRoot), ...readPatterns(repoRoot)]) {
    writeFileSync(join(dir, `${component.name}.css`), component.css);
    for (const example of component.examples) {
      const file = `${component.name}.${example.id}.html`;
      writeFileSync(join(dir, file), `<!doctype html>\n<html lang="en">\n<body>\n${example.html}\n</body>\n</html>\n`);
      examples.push({ ...example, file });
    }
  }
  const result = spawnSync(process.execPath, [join(dist, "checker", "check.mjs"), "--json", "."], { cwd: dir, encoding: "utf8" });
  assert.notEqual(result.status, 2, result.stderr);
  return { examples, report: JSON.parse(result.stdout) };
}

test("do examples and component stylesheets pass the checker with no findings and no waivers, and each lintable don't example fails with its stated rule", () => {
  const { examples, report } = checkExamples();
  const rulesIn = (file) => report.findings.filter((finding) => finding.file === file).map((finding) => finding.rule);
  assert.deepEqual(report.waivers, []);
  assert.deepEqual(report.findings.filter((finding) => finding.file.endsWith(".css")), []);

  const lintable = examples.filter((example) => example.dont && example.dont !== "review");
  assert.ok(lintable.length > 0);
  for (const example of examples) {
    const rules = rulesIn(example.file);
    if (!example.dont || example.dont === "review") assert.deepEqual(rules, [], example.file);
    else assert.deepEqual([...new Set(rules)], [example.dont], example.file);
  }
});

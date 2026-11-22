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
    edit(join(folder, "meta.json"), (json) => JSON.stringify({ ...JSON.parse(json), classes: [...JSON.parse(json).classes, "gw-button--large"] })),
  );
  assert.throws(listed, /components\/button: .*gw-button--large/);
  const defined = buildWith((folder) =>
    edit(join(folder, "button.css"), (css) => css.replace(".gw-button--quiet", ".gw-button--ghost")),
  );
  assert.throws(defined, /components\/button: .*gw-button--ghost/);
});

test("components.json has one entry per folder, each with every metadata field and its do examples' markup", () => {
  const { components } = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  assert.deepEqual(components.map((component) => component.name), folders);
  for (const component of components) {
    assert.deepEqual(Object.keys(component), [...META_FIELDS, "examples"]);
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

test("pattern styles are bundled after every component, inside the components layer", () => {
  const css = readFileSync(join(dist, "groundwork.css"), "utf8");
  const lastComponent = css.lastIndexOf(`.gw-${folders.at(-1)}`);
  for (const pattern of readPatterns(repoRoot)) {
    assert.match(pattern.css, /@layer gw\.components/);
    assert.ok(css.indexOf(`.gw-${pattern.name}`) > lastComponent, `${pattern.name} is bundled before a component`);
  }
});

test("a pattern's gallery page lays its examples out in one column, and the index lists patterns after components", () => {
  for (const name of patternFolders) {
    const html = readFileSync(join(dist, "gallery", `${name}.html`), "utf8");
    assert.match(html, /<h2>Examples<\/h2>\n<div class="gw-grid">/, name);
  }
  assert.match(readFileSync(join(dist, "gallery", "button.html"), "utf8"), /<h2>Examples<\/h2>\n<div class="gw-grid gw-grid-2">/);
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
    edit(join(folder, file), (text) => text.replaceAll("gw-button", "gw-sign-in").replace('"name": "button"', '"name": "sign-in"'));
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
  assert.deepEqual(modules, ["combobox.js", "command-palette.js", "groundwork.js"]);
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
  for (const name of ["gw-stack", "gw-cluster", "gw-split", "gw-grid", "gw-grid-3", "gw-sidebar-layout", "gw-container-narrow", "gw-gap-2xl"]) {
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
    edit(join(folder, file), (text) => text.replaceAll("gw-button", "gw-chip").replace('"name": "button"', '"name": "chip"'));
  }
  const outDir = tempDir();
  build({ root, outDir });
  assert.match(readFileSync(join(outDir, "groundwork.css"), "utf8"), /\.gw-chip--primary/);
  assert.ok(JSON.parse(readFileSync(join(outDir, "components.json"), "utf8")).components.some((component) => component.name === "chip"));
  assert.ok(JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")).classes.includes("gw-chip"));
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
    assert.match(html, /<link rel="stylesheet" href="\.\.\/groundwork\.css">/);
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

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { test } from "node:test";
import { repoRoot } from "./helpers.mjs";

const base = join(repoRoot, "base");
const dist = join(repoRoot, "dist");
const bundle = join(dist, "groundwork.css");

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve("tailwindcss"))("postcss");

const LAYER_OF = {
  "reset.css": "gw.reset",
  "typography.css": "gw.base",
  "layout.css": "gw.base",
  "focus.css": "gw.base",
};

// The names of the at-rules of one kind that enclose a node, innermost first.
function enclosing(node, kind) {
  const found = [];
  for (let parent = node.parent; parent.type !== "root"; parent = parent.parent) {
    if (parent.type === "atrule" && parent.name === kind) found.push(parent.params);
  }
  return found;
}

function rulesIn(file) {
  const rules = [];
  postcss.parse(readFileSync(file, "utf8")).walkRules((rule) => rules.push(rule));
  return rules;
}

const baseStylesheets = () => readdirSync(base).filter((name) => name.endsWith(".css")).sort();
const iconList = () => JSON.parse(readFileSync(join(base, "icons.json"), "utf8"));

test("every selector in base/ sits inside a gw. layer: the reset in gw.reset, the rest in gw.base", () => {
  assert.deepEqual(baseStylesheets(), ["focus.css", "fonts.css", "layout.css", "reset.css", "typography.css"]);
  for (const name of baseStylesheets()) {
    const rules = rulesIn(join(base, name));
    // fonts.css holds @font-face rules only, which have no selector and no place in the cascade.
    if (name === "fonts.css") assert.equal(rules.length, 0);
    else assert.ok(rules.length > 0, `${name} has no rules`);
    for (const rule of rules) {
      assert.deepEqual(enclosing(rule, "layer"), [LAYER_OF[name]], `${name}: ${rule.selector}`);
    }
  }
});

test("every selector in the bundled stylesheet sits inside a gw. layer", () => {
  for (const rule of rulesIn(bundle)) {
    const [layer] = enclosing(rule, "layer");
    assert.match(layer ?? "", /^gw\.(reset|tokens|base)$/, rule.selector);
  }
});

test("every class in base/ starts with gw-", () => {
  const classes = baseStylesheets()
    .flatMap((name) => rulesIn(join(base, name)))
    .flatMap((rule) => rule.selector.match(/\.[A-Za-z_][\w-]*/g) ?? []);
  for (const name of ["stack", "cluster", "grid", "split", "sidebar-layout", "container"]) {
    assert.ok(classes.includes(`.gw-${name}`), `no .gw-${name}`);
  }
  for (const name of classes) assert.match(name, /^\.gw-/);
});

test("base styles take colours, sizes and durations from tokens, and the only media-query width is 768px", () => {
  const widths = [];
  for (const name of baseStylesheets()) {
    const root = postcss.parse(readFileSync(join(base, name), "utf8"));
    root.walkDecls((decl) => {
      const where = `${name}: ${decl.prop}: ${decl.value}`;
      assert.doesNotMatch(decl.value, /#[0-9A-Fa-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|color-mix)\(/, where);
      assert.doesNotMatch(decl.value, /\d(px|rem|em|pt|ms)\b/, where);
      // Zero is the one duration written out, for reduced motion.
      for (const duration of decl.value.match(/\b[\d.]+s\b/g) ?? []) assert.equal(duration, "0s", where);
    });
    root.walkAtRules("media", (rule) => widths.push(...(rule.params.match(/[\d.]+(px|rem|em)/g) ?? [])));
  }
  assert.ok(widths.length > 0);
  assert.deepEqual([...new Set(widths)], ["768px"]);
});

test("the reset sets border-box sizing and a zero-width solid border on every element", () => {
  const rule = rulesIn(join(base, "reset.css")).find((candidate) => candidate.selectors.includes("*"));
  const declared = Object.fromEntries(rule.nodes.filter((node) => node.type === "decl").map((decl) => [decl.prop, decl.value]));
  assert.deepEqual(rule.selectors.slice(0, 3), ["*", "::before", "::after"]);
  assert.equal(declared["box-sizing"], "border-box");
  assert.equal(declared.border, "0 solid var(--gw-color-border)");
});

test("under prefers-reduced-motion the reset forces every transition duration to zero", () => {
  const guards = rulesIn(bundle).filter((rule) =>
    enclosing(rule, "media").some((params) => /prefers-reduced-motion:\s*reduce/.test(params)),
  );
  assert.equal(guards.length, 1);
  const [guard] = guards;
  assert.deepEqual(enclosing(guard, "layer"), ["gw.reset"]);
  for (const selector of ["*", "::before", "::after"]) assert.ok(guard.selectors.includes(selector), selector);
  const duration = guard.nodes.find((node) => node.prop === "transition-duration");
  assert.equal(duration.value, "0s");
  // An important declaration in the first layer beats every later layer and unlayered CSS.
  assert.equal(duration.important, true);
});

test("the bundled stylesheet is the layer order, tokens, reset, base and fonts, in that order", () => {
  const css = readFileSync(bundle, "utf8");
  const order = [
    "@layer gw.reset, gw.tokens, gw.base, gw.components;",
    "@layer gw.tokens {",
    "@layer gw.reset {",
    "@layer gw.base {",
    "@font-face {",
  ].map((marker) => css.indexOf(marker));
  assert.ok(order.every((at) => at >= 0), JSON.stringify(order));
  assert.deepEqual(order, order.toSorted((a, b) => a - b));
  assert.ok(css.startsWith(readFileSync(join(dist, "tokens.css"), "utf8")));
  assert.equal(css.split("@layer gw.reset, gw.tokens, gw.base, gw.components;").length, 2);
});

test("every font and icon URL in dist/groundwork.css resolves to a file inside dist/", () => {
  const urls = [];
  postcss.parse(readFileSync(bundle, "utf8")).walkDecls((decl) => {
    for (const [, url] of decl.value.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) urls.push(url);
  });
  assert.ok(urls.length >= 4, `expected the font files, found ${JSON.stringify(urls)}`);
  for (const url of urls) {
    const file = resolve(dirname(bundle), url);
    assert.ok(file.startsWith(dist + sep), `${url} points outside dist/`);
    assert.ok(existsSync(file), `${url} does not exist in dist/`);
  }
});

test("the shipped fonts are IBM Plex Sans and IBM Plex Mono, each file is used, and the licence travels with them", () => {
  const faces = [];
  postcss.parse(readFileSync(bundle, "utf8")).walkAtRules("font-face", (face) => {
    const declared = Object.fromEntries(face.nodes.map((decl) => [decl.prop, decl.value]));
    faces.push({ family: declared["font-family"], weight: declared["font-weight"], file: declared.src.match(/fonts\/([^"')]+)/)[1] });
  });
  assert.deepEqual(
    faces.map(({ family, weight }) => `${family} ${weight}`),
    ['"IBM Plex Sans" 100 700', '"IBM Plex Mono" 400', '"IBM Plex Mono" 500', '"IBM Plex Mono" 600'],
  );
  const shipped = readdirSync(join(dist, "fonts")).sort();
  assert.deepEqual(shipped.filter((name) => name.endsWith(".woff2")), faces.map((face) => face.file).sort());
  const licences = shipped.filter((name) => !name.endsWith(".woff2"));
  assert.deepEqual(licences, ["OFL-IBM-Plex-Mono.txt", "OFL-IBM-Plex-Sans.txt"]);
  for (const name of licences) {
    assert.match(readFileSync(join(dist, "fonts", name), "utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});

test("the sprite and the single icon files contain exactly the icons in the base list", () => {
  const icons = iconList();
  assert.ok(icons.length >= 20);
  assert.deepEqual(icons, icons.toSorted());

  const sprite = readFileSync(join(dist, "icons.svg"), "utf8");
  const symbols = [...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/symbol>/g)];
  assert.deepEqual(symbols.map(([, id]) => id), icons.map((name) => `gw-icon-${name}`));
  assert.equal(sprite.match(/<symbol\b/g).length, icons.length);
  for (const [, id, body] of symbols) assert.match(body, /<(path|circle|rect|line|polyline|polygon|ellipse)\b/, id);

  const single = readdirSync(join(dist, "icons")).filter((name) => name.endsWith(".svg")).sort();
  assert.deepEqual(single, icons.map((name) => `${name}.svg`));
  for (const name of single) {
    assert.ok(readFileSync(join(dist, "icons", name)).equals(readFileSync(join(base, "icons", name))), name);
  }
  assert.match(readFileSync(join(dist, "icons", "LICENSE"), "utf8"), /ISC License/);
});

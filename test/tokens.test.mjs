import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { build, parseTokens, validateTheme } from "../scripts/build.mjs";
import { copySources, repoRoot, tempDir } from "./helpers.mjs";

const dist = join(repoRoot, "dist");
const fixture = join(repoRoot, "test", "fixtures", "tailwind3");
const read = (name) => readFileSync(join(dist, name), "utf8");

const require = createRequire(import.meta.url);
const tailwind = require("tailwindcss");
const postcss = createRequire(require.resolve("tailwindcss"))("postcss");

async function buildFixture() {
  const { default: config } = await import(join(fixture, "tailwind.config.mjs"));
  const css = read("tokens.css") + readFileSync(join(fixture, "input.css"), "utf8");
  const plugin = tailwind({ ...config, content: [join(fixture, "index.html")] });
  const result = await postcss([plugin]).process(css, { from: undefined });
  const rules = [];
  result.root.walkRules((rule) => {
    const layers = [];
    for (let node = rule.parent; node.type !== "root"; node = node.parent) {
      if (node.name === "layer") layers.push(node.params);
    }
    rules.push({ selector: rule.selector, layer: layers[0], css: rule.toString(), index: rules.length });
  });
  return { rules, css: result.css };
}

// The selector Tailwind writes for a class, with `:` in a variant escaped.
const selectorFor = (name) => "." + name.replace(/:/g, "\\:");
const find = (rules, selector) => rules.find((rule) => rule.selector === selector);

test("every colour token in dist/tokens.css is six-digit hex", () => {
  const colours = [...read("tokens.css").matchAll(/(--ds-color-[\w-]+):\s*([^;]+);/g)];
  assert.ok(colours.length > 20);
  for (const [, name, value] of colours) assert.match(value, /^#[0-9A-Fa-f]{6}$/, name);
});

test("every custom property is prefixed --ds- and sits in the ds.tokens layer", () => {
  const css = read("tokens.css");
  assert.ok(css.includes("@layer ds.reset, ds.tokens, ds.base, ds.components;"));
  assert.deepEqual(css.match(/--(?!ds-)[\w-]+\s*:/g), null);
  const outside = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@layer ds\.tokens \{[\s\S]*\n\}/, "");
  assert.doesNotMatch(outside, /--ds-/);
});

test("dark values are declared for the dark theme and for the auto theme under a dark system setting", () => {
  const tokens = parseTokens(read("tokens.css"));
  assert.equal(tokens.light["--ds-color-surface"], "#FAFAF9");
  assert.notEqual(tokens.dark["--ds-color-surface"], tokens.light["--ds-color-surface"]);
  const colours = Object.keys(tokens.light).filter((name) => name.startsWith("--ds-color-"));
  for (const name of colours) assert.ok(tokens.dark[name], `${name} has no dark value`);
  assert.match(read("tokens.css"), /@media \(prefers-color-scheme: dark\) \{\s*\[data-theme="auto"\] \{/);
});

test("a text pair below 4.5:1 fails the build and names both tokens and the ratio", () => {
  const root = copySources();
  const pairs = [{ foreground: "--ds-color-muted", background: "--ds-color-border", kind: "text" }];
  writeFileSync(join(root, "tokens", "pairs.json"), JSON.stringify(pairs));
  assert.throws(
    () => build({ root, outDir: tempDir() }),
    /--ds-color-muted on --ds-color-border is 3\.76:1 in the light theme, below 4\.5:1/,
  );
});

test("every listed pair passes in light and dark", () => {
  const { contrast } = build({ outDir: tempDir() });
  const pairs = JSON.parse(readFileSync(join(repoRoot, "tokens", "pairs.json"), "utf8"));
  assert.equal(contrast.length, pairs.length * 2);
  for (const row of contrast) assert.ok(row.ratio >= row.minimum, JSON.stringify(row));
});

test("Tailwind emits rules for token classes and none for classes outside the vocabulary", async () => {
  const { rules } = await buildFixture();
  assert.match(find(rules, ".bg-surface").css, /background-color: var\(--ds-color-surface\)/);
  const kept = [
    "text-on-surface", "border-border", "text-muted", "bg-accent", "font-ui", "font-mono", "text-ui",
    "text-mono", "p-xs", "px-sm", "py-md", "gap-lg", "m-xl", "mt-2xl", "rounded-sm", "rounded-md",
    "min-h-touch", "max-w-column", "md:max-w-transcript", "border",
  ];
  for (const name of kept) assert.ok(find(rules, selectorFor(name)), `${name} emitted no rule`);
  for (const name of ["bg-indigo-500", "animate-bounce", "backdrop-blur-md", "z-50", "duration-700", "bg-gradient-to-r"]) {
    assert.equal(rules.filter((rule) => rule.selector.includes(name)).length, 0, `${name} emitted a rule`);
  }
});

test("the only breakpoint Tailwind emits is 768px", async () => {
  const { css } = await buildFixture();
  assert.deepEqual([...new Set(css.match(/@media \(min-width: [^)]+\)/g))], ["@media (min-width: 768px)"]);
  assert.equal(JSON.parse(read("manifest.json")).breakpoint, "768px");
});

test("with preflight off a ds.components background survives and an unlayered utility overrides it", async () => {
  const { rules, css } = await buildFixture();
  assert.ok(css.includes("@layer ds.reset, ds.tokens, ds.base, ds.components;"));
  const component = find(rules, ".ds-button");
  assert.equal(component.layer, "ds.components");
  assert.match(component.css, /background-color: var\(--ds-color-surface-raised\)/);
  // No preflight means nothing unlayered resets a button's background.
  assert.equal(rules.filter((rule) => !rule.layer && /background-color:\s*transparent/.test(rule.css)).length, 0);
  // An unlayered rule beats a layered one whatever the specificity or order.
  assert.equal(find(rules, ".bg-accent").layer, undefined);
});

test("a rule in Tailwind's base layer is emitted unlayered, so it overrides ds.components", async () => {
  const { rules } = await buildFixture();
  const base = find(rules, "button");
  assert.match(base.css, /background-color: var\(--ds-color-surface-sunken\)/);
  assert.equal(base.layer, undefined);
});

// Botbench's DESIGN.md front matter as it stands, with its two fontFamily values replaced.
const botbenchValues = {
  colors: { accent: '"#1A1A1A"', surface: '"#FAFAF9"', "on-surface": '"#171717"', border: '"#E5E5E5"', muted: '"#737373"' },
  typography: {
    ui: { fontFamily: '"IBM Plex Sans"', fontSize: "14px", fontWeight: "400" },
    mono: { fontFamily: '"IBM Plex Mono"', fontSize: "13px" },
  },
  rounded: { sm: "4px", md: "8px" },
  spacing: { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px" },
};

// Nested maps of scalars are all the token block uses.
function parseYamlBlock(text) {
  const root = {};
  const stack = [{ indent: -1, map: root }];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [, spaces, key, value] = line.match(/^( *)([^:]+):\s*(.*)$/);
    while (stack.at(-1).indent >= spaces.length) stack.pop();
    if (value) stack.at(-1).map[key] = value;
    else stack.push({ indent: spaces.length, map: (stack.at(-1).map[key] = {}) });
  }
  return root;
}

function assertIncludes(actual, expected, path) {
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === "object") assertIncludes(actual?.[key], value, `${path}${key}.`);
    else assert.equal(actual?.[key], value, `${path}${key}`);
  }
}

test("the token block reproduces every value in Botbench's DESIGN.md front matter except its two font families, which are IBM Plex Sans and IBM Plex Mono", () => {
  const [, block] = read("design-tokens.md").match(/^---\n([\s\S]*?)\n---\n/);
  assertIncludes(parseYamlBlock(block), botbenchValues, "");
});

test("the token data file uses the Design Tokens Community Group format", () => {
  const tokens = JSON.parse(read("tokens.json"));
  assert.equal(tokens.color.accent.$type, "color");
  assert.equal(tokens.color.accent.$value.hex, "#1a1a1a");
  assert.deepEqual(tokens.space.xs, { $type: "dimension", $value: { value: 4, unit: "px" } });
  assert.deepEqual(tokens.font.ui.$value, ["IBM Plex Sans", "Helvetica Neue", "Arial", "sans-serif"]);
});

test("every value in the Tailwind preset is a token reference or a neutral keyword", () => {
  const { theme } = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  const neutral = new Set(["0", "none", "auto", "100%", "100dvh", "transparent", "currentColor", "768px"]);
  const leaves = (value) => (typeof value === "string" ? [value] : Object.values(value).flatMap(leaves));
  for (const [key, scale] of Object.entries(theme)) {
    for (const leaf of leaves(scale)) {
      assert.ok(neutral.has(leaf) || /^var\(--ds-[\w-]+\)$/.test(leaf), `${key}: ${leaf}`);
    }
  }
  assert.deepEqual(theme.screens, { md: "768px" });
  for (const key of ["animation", "keyframes", "blur", "backdropBlur", "opacity", "letterSpacing", "dropShadow"]) {
    assert.deepEqual(theme[key], {}, key);
  }
});

test("a strict TypeScript config that imports the preset typechecks", () => {
  const tsc = join(repoRoot, "node_modules", ".bin", "tsc");
  execFileSync(tsc, ["-p", join(repoRoot, "test", "fixtures", "typescript")], { stdio: "pipe" });
});

test("a theme that declares an unknown --ds- name fails validation", () => {
  const known = Object.keys(parseTokens(read("tokens.css")).light);
  validateTheme('[data-theme="dark"] { --ds-color-accent: #222222; }', known);
  assert.throws(
    () => validateTheme(":root { --ds-color-accent: #222222; --ds-color-brand: #663399; }", known),
    /--ds-color-brand is not a token/,
  );
});

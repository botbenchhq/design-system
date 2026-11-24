import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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
  assert.ok(css.includes("@layer ds.reset, ds.tokens, ds.theme, ds.base, ds.components;"));
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
    "text-mono", "text-2xs", "text-sm", "p-xs", "px-sm", "py-md", "gap-lg", "m-xl", "mt-2xl", "rounded-sm", "rounded-md",
    "p-2xs", "gap-xs-sm", "px-lg-xl", "py-3xl", "mt-4xl", "rounded-xs", "rounded-lg",
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
  assert.ok(css.includes("@layer ds.reset, ds.tokens, ds.theme, ds.base, ds.components;"));
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

// The colours of Botbench's DESIGN.md front matter as it stands, and the type, radius and spacing scales of 0.12:
// sizes in rem, seven roles, four radii and the pill, eleven spacing steps.
const botbenchValues = {
  colors: { accent: '"#1A1A1A"', surface: '"#FAFAF9"', "on-surface": '"#171717"', border: '"#E5E5E5"', muted: '"#737373"' },
  typography: {
    "2xs": { fontSize: "0.6875rem", fontWeight: "500", lineHeight: "1.273", letterSpacing: "0.02em" },
    xs: { fontSize: "0.75rem", fontWeight: "400", lineHeight: "1.333" },
    sm: { fontSize: "0.8125rem", fontWeight: "400", lineHeight: "1.385" },
    ui: { fontFamily: '"IBM Plex Sans"', fontSize: "0.875rem", fontWeight: "400", lineHeight: "1.5" },
    mono: { fontFamily: '"IBM Plex Mono"', fontSize: "0.8125rem" },
    lg: { fontSize: "1rem", fontWeight: "600", lineHeight: "1.375", letterSpacing: "-0.01em" },
    xl: { fontSize: "1.25rem", fontWeight: "600", lineHeight: "1.3", letterSpacing: "-0.015em" },
    "2xl": { fontSize: "1.625rem", fontWeight: "600", lineHeight: "1.154", letterSpacing: "-0.02em" },
  },
  "typography-coarse-pointer": { "2xs": "0.75rem", xs: "0.8125rem", sm: "0.875rem", mono: "0.875rem", ui: "0.9375rem", lg: "1.0625rem", xl: "1.3125rem", "2xl": "1.6875rem" },
  rounded: { xs: "4px", sm: "6px", md: "10px", lg: "14px", full: "9999px" },
  spacing: { "2xs": "2px", xs: "4px", "xs-sm": "6px", sm: "8px", md: "12px", lg: "16px", "lg-xl": "20px", xl: "24px", "2xl": "32px", "3xl": "40px", "4xl": "64px" },
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

test("the token block holds the colours of Botbench's DESIGN.md front matter, IBM Plex Sans and IBM Plex Mono, and the type, radius and spacing scales", () => {
  const [, block] = read("design-tokens.md").match(/^---\n([\s\S]*?)\n---\n/);
  assertIncludes(parseYamlBlock(block), botbenchValues, "");
});

test("the token data file uses the Design Tokens Community Group format", () => {
  const tokens = JSON.parse(read("tokens.json"));
  assert.equal(tokens.color.accent.$type, "color");
  assert.equal(tokens.color.accent.$value.hex, "#1a1a1a");
  assert.deepEqual(tokens.space.xs, { $type: "dimension", $value: { value: 4, unit: "px" } });
  // A type size is in rem, with its size on a coarse pointer; a tracking is a number of ems.
  assert.deepEqual(tokens.text.xs, { $type: "dimension", $value: { value: 0.75, unit: "rem" }, $extensions: { "design-system": { "coarse-pointer": { value: 0.8125, unit: "rem" } } } });
  assert.deepEqual(tokens.tracking, { "2xs": { $type: "number", $value: 0.02 }, lg: { $type: "number", $value: -0.01 }, xl: { $type: "number", $value: -0.015 }, "2xl": { $type: "number", $value: -0.02 } });
  assert.deepEqual(tokens.radius.lg, { $type: "dimension", $value: { value: 14, unit: "px" } });
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

test("the wide size reaches the tokens, the Tailwind preset and its types, the token data, the token block and the manifest, and the wide container uses it", () => {
  const name = "--ds-size-wide";
  const { light } = parseTokens(read("tokens.css"));
  assert.equal(light[name], "1200px");
  const preset = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  assert.equal(preset.theme.maxWidth.wide, `var(${name})`);
  assert.match(read("tailwind-preset.d.ts"), /maxWidth: \{[^}]*"wide": string/);
  assert.deepEqual(JSON.parse(read("tokens.json")).size.wide.$value, { value: 1200, unit: "px" });
  assert.match(read("design-tokens.md"), /\n {2}wide: 1200px\n/);
  const manifest = JSON.parse(read("manifest.json"));
  assert.ok(manifest.tokens.size.includes(name));
  assert.ok(manifest.utilities.sizeKeys.includes("wide"));
  assert.ok(manifest.classes.includes("ds-container--wide"));
  assert.match(read("design-system.css"), /\.ds-container--wide \{\n\s+max-width: var\(--ds-size-wide\);/);
});

const tokensSource = () => readFileSync(join(repoRoot, "tokens", "tokens.css"), "utf8");
const buildTokens = (css) => {
  const root = copySources();
  writeFileSync(join(root, "tokens", "tokens.css"), css);
  return () => build({ root, outDir: tempDir() });
};

const DENSITY_VALUES = {
  default: { control: "40px", row: "40px", text: "0.875rem", leading: "1.5" },
  compact: { control: "32px", row: "36px", text: "0.8125rem", leading: "1.385" },
  "coarse-pointer": { control: "44px", row: "44px", text: "0.9375rem", leading: "1.5" },
};
const COARSE_TEXT = {
  "--ds-text-2xs": "0.75rem", "--ds-text-xs": "0.8125rem", "--ds-text-sm": "0.875rem", "--ds-text-mono": "0.875rem",
  "--ds-text-ui": "0.9375rem", "--ds-text-lg": "1.0625rem", "--ds-text-xl": "1.3125rem", "--ds-text-2xl": "1.6875rem",
};

test("a control and a row are 40px, 32px and 36px in a compact container, which sets body text to the dense size and line height, and compact is the one value of the attribute", () => {
  const { light, density } = parseTokens(read("tokens.css"));
  assert.deepEqual(density, DENSITY_VALUES);
  assert.equal(density.compact.text, light["--ds-text-sm"]);
  assert.equal(density.compact.leading, light["--ds-leading-sm"]);
  assert.equal(light["--ds-size-control"], "40px");
  assert.equal(light["--ds-size-row"], "40px");
  assert.equal(light["--ds-size-touch"], "44px");
  const steps = ["xs", "sm", "md", "lg"].map((step) => light[`--ds-size-control-${step}`]);
  assert.deepEqual(steps, ["24px", "28px", "32px", "48px"]);
  assert.equal(light["--ds-size-sidebar"], "260px");
  assert.equal(light["--ds-size-inspector"], "340px");
  assert.equal(light["--ds-size-transcript"], "760px");
  // No block for a comfortable or a touch container: the default is :root, and a coarse pointer does the rest.
  assert.deepEqual([...read("tokens.css").matchAll(/\[data-ds-density="(\w+)"\]/g)].map(([, value]) => value), ["compact"]);
});

test("a coarse pointer gets 44px controls and rows on every element, a compact container included, after the block the attribute selects", () => {
  const css = read("tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const coarse = css.match(/@media \(pointer: coarse\) \{\s*:root,\s*\[data-ds-density\] \{([^}]*)\}/);
  assert.ok(coarse, "tokens.css has no block for a coarse pointer");
  assert.deepEqual([...coarse[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]), [
    ["--ds-size-control", "44px"],
    ["--ds-size-row", "44px"],
    ...Object.entries(COARSE_TEXT),
    ["--ds-leading-ui", "1.5"],
  ]);
  // Each type size is one pixel larger than :root has it, written out in rem.
  const { light, coarse: sizes } = parseTokens(read("tokens.css"));
  for (const [name, value] of Object.entries(COARSE_TEXT)) {
    assert.equal(sizes[name], value, name);
    assert.equal(parseFloat(value) * 16, parseFloat(light[name]) * 16 + 1, name);
  }
  // The same specificity as the compact block, so it wins by coming last.
  assert.ok(css.indexOf('[data-ds-density="compact"]') < coarse.index, "the compact block comes after the block for a coarse pointer");
});

test("the density reaches the manifest, the token data and the token block, for the default theme and for a theme", () => {
  const values = DENSITY_VALUES;
  const manifest = JSON.parse(read("manifest.json"));
  assert.deepEqual(manifest.density, {
    attribute: "data-ds-density",
    attributeValues: ["compact"],
    tokens: { control: "--ds-size-control", row: "--ds-size-row", text: "--ds-text-ui", leading: "--ds-leading-ui" },
    values,
  });
  assert.deepEqual(manifest.coarsePointer, { text: COARSE_TEXT });
  for (const value of ["0.6875rem", "0.75rem", "0.8125rem", "0.875rem", "0.9375rem", "1rem", "1.0625rem", "1.25rem", "1.3125rem", "1.625rem", "1.6875rem"]) assert.ok(manifest.values.text.includes(value), value);
  assert.deepEqual(manifest.values.leading.filter((value) => value === "1.385").length, 1);
  for (const value of ["24px", "28px", "32px", "36px", "40px", "44px", "48px", "260px", "340px"]) assert.ok(manifest.values.size.includes(value), value);
  for (const key of ["control", "row", "control-xs", "control-sm", "control-md", "control-lg", "touch", "sidebar", "inspector"]) {
    assert.ok(manifest.utilities.sizeKeys.includes(key), key);
  }
  const px = (value) => ({ value, unit: "px" });
  const rem = (value) => ({ value, unit: "rem" });
  for (const file of ["tokens.json", "themes/botbench.tokens.json"]) {
    const { size, text, leading } = JSON.parse(read(file));
    assert.deepEqual(text.ui, { $type: "dimension", $value: rem(0.875), $extensions: { "design-system": { density: { compact: rem(0.8125) }, "coarse-pointer": rem(0.9375) } } }, file);
    assert.deepEqual(leading.ui, { $type: "number", $value: 1.5, $extensions: { "design-system": { density: { compact: 1.385 }, "coarse-pointer": 1.5 } } }, file);
    assert.deepEqual(size.control, { $type: "dimension", $value: px(40), $extensions: { "design-system": { density: { compact: px(32) }, "coarse-pointer": px(44) } } }, file);
    assert.deepEqual(size.row.$extensions["design-system"], { density: { compact: px(36) }, "coarse-pointer": px(44) }, file);
    assert.deepEqual(size["control-md"], { $type: "dimension", $value: px(32) }, file);
  }
  for (const file of ["design-tokens.md", "themes/botbench.design-tokens.md"]) {
    const [, block] = read(file).match(/^---\n([\s\S]*?)\n---\n/);
    const parsed = parseYamlBlock(block);
    assert.deepEqual(parsed.density, values, file);
    assert.equal(parsed.sizes.control, "40px", file);
    assert.equal(parsed.sizes.sidebar, "260px", file);
  }
});

test("the Tailwind preset has a height for a control and a row, and a width for a sidebar and an inspector", () => {
  const { theme } = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  for (const scale of ["width", "height", "size", "minWidth", "minHeight"]) {
    for (const key of ["control", "row", "control-xs", "control-sm", "control-md", "control-lg", "touch"]) {
      assert.equal(theme[scale][key], `var(--ds-size-${key})`, `${scale}.${key}`);
    }
  }
  assert.equal(theme.width.sidebar, "var(--ds-size-sidebar)");
  assert.equal(theme.maxWidth.inspector, "var(--ds-size-inspector)");
  assert.equal(theme.maxWidth.column, "var(--ds-size-column)");
});

test("a compact block that sets another token, a coarse pointer whose control is not the touch size, and a missing compact block each fail the build", () => {
  const source = tokensSource();
  const compact = '[data-ds-density="compact"] {\n    --ds-size-control: 32px;';
  assert.ok(source.includes(compact));
  assert.throws(buildTokens(source.replace(compact, `${compact}\n    --ds-space-md: 8px;`)), /\[data-ds-density="compact"\] sets .*--ds-space-md.* A density block sets --ds-size-control, --ds-size-row, --ds-text-ui, --ds-leading-ui and nothing else/);
  assert.throws(buildTokens(source.replace(/(\[data-ds-density\] \{\s*--ds-size-control: )44px/, "$148px")), /on a coarse pointer --ds-size-control is 48px\. It must hold the value of --ds-size-touch, 44px/);
  assert.throws(buildTokens(source.replace(/--ds-size-touch: 44px/, "--ds-size-touch: 48px")), /It must hold the value of --ds-size-touch, 48px/);
  assert.throws(buildTokens(source.replace(/\n {2}\[data-ds-density="compact"\] \{[^}]*\}\n/, "\n")), /the density block \[data-ds-density="compact"\] is missing/);
  // A second value of the attribute is a selector the build does not know.
  assert.throws(buildTokens(source.replace(compact, `[data-ds-density="touch"] {\n    --ds-size-control: 44px;\n  }\n\n  ${compact}`)), /Unexpected selector in tokens\.css: \[data-ds-density="touch"\]/);
});

test("a type size in px, a coarse-pointer size that is not one pixel larger, and a coarse-pointer block that leaves a size out each fail the build", () => {
  const source = tokensSource();
  assert.throws(buildTokens(source.replace("--ds-text-ui: 0.875rem;\n\n", "--ds-text-ui: 14px;\n\n").replace(/(\/\* Body:[^\n]*\n\s*--ds-text-ui: )0\.875rem/, "$114px")), /--ds-text-ui is 14px\. A type size is written in rem, so it follows the reader's font-size setting/);
  assert.throws(buildTokens(source.replace("--ds-text-lg: 1.0625rem;", "--ds-text-lg: 1.125rem;")), /on a coarse pointer --ds-text-lg is 1\.125rem\. Every type size is one pixel larger there, so it must be 1\.0625rem/);
  assert.throws(buildTokens(source.replace("      --ds-text-2xs: 0.75rem;\n", "")), /the block for a coarse pointer sets .* It sets --ds-size-control and --ds-size-row, every type size and --ds-leading-ui, and nothing else/);
});

// The type scale as the owner approved it: the size in px at a 16px root, the line in px, the weight and the tracking.
const TYPE_SCALE = {
  "2xs": { size: 11, line: 14, weight: "medium", tracking: "0.02em" },
  xs: { size: 12, line: 16 },
  sm: { size: 13, line: 18 },
  ui: { size: 14, line: 21 },
  lg: { size: 16, line: 22, weight: "semibold", tracking: "-0.01em" },
  xl: { size: 20, line: 26, weight: "semibold", tracking: "-0.015em" },
  "2xl": { size: 26, line: 30, weight: "semibold", tracking: "-0.02em" },
};

test("the type scale is seven roles in rem, each with a line height that lands on its line within a twentieth of a pixel, and four with tracking", () => {
  const { light } = parseTokens(read("tokens.css"));
  const names = (prefix) => Object.keys(light).filter((name) => name.startsWith(prefix));
  assert.deepEqual(names("--ds-text-"), ["2xs", "xs", "sm", "mono", "ui", "lg", "xl", "2xl"].map((key) => `--ds-text-${key}`));
  assert.deepEqual(names("--ds-tracking-"), ["2xs", "lg", "xl", "2xl"].map((key) => `--ds-tracking-${key}`));
  for (const [key, role] of Object.entries(TYPE_SCALE)) {
    assert.match(light[`--ds-text-${key}`], /^[\d.]+rem$/, key);
    assert.equal(parseFloat(light[`--ds-text-${key}`]) * 16, role.size, key);
    assert.ok(Math.abs(role.size * Number(light[`--ds-leading-${key}`]) - role.line) < 0.05, `${key}: ${role.size * Number(light[`--ds-leading-${key}`])}px is not ${role.line}px`);
    assert.equal(light[`--ds-tracking-${key}`], role.tracking, key);
  }
  assert.equal(light["--ds-text-mono"], "0.8125rem");
  // The Tailwind preset carries the line height with each size, and the tracking with the four that have it.
  const { theme } = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  assert.deepEqual(theme.fontSize.sm, ["var(--ds-text-sm)", { lineHeight: "var(--ds-leading-sm)" }]);
  assert.deepEqual(theme.fontSize["2xl"], ["var(--ds-text-2xl)", { lineHeight: "var(--ds-leading-2xl)", letterSpacing: "var(--ds-tracking-2xl)" }]);
  assert.match(read("tailwind-preset.d.ts"), /"2xs": \[string, \{ "lineHeight": string; "letterSpacing": string \}\]/);
  const manifest = JSON.parse(read("manifest.json"));
  assert.deepEqual(manifest.tokens.tracking, names("--ds-tracking-"));
});

// Every rule of a stylesheet outside comments, as { selectors, declarations: { property: value } }, in source order.
function rulesOf(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
    selectors: selectors.split(",").map((selector) => selector.trim().replace(/\s+/g, " ")),
    declarations: Object.fromEntries([...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => [property, value.trim()])),
  }));
}

const sourceStylesheets = () =>
  ["components", "patterns"].flatMap((dir) => readdirSync(join(repoRoot, dir)).sort().map((name) => ({ name, css: readFileSync(join(repoRoot, dir, name, `${name}.css`), "utf8") })));

// A size used for a reason other than its role, so it takes no tracking: a form control is 16px below 768px so iOS does
// not zoom, a code a reader types has its own spacing, and the large spinner is sized by its font size.
const SIZE_WITHOUT_ROLE = new Set([
  ".ds-field__control", ".ds-composer__input", ".ds-tag-input__input", ".ds-copy-field__value", ".ds-otp-input",
  ".ds-device-code__code", ".ds-spinner--large",
]);

test("a size with tracking is never set without it: the micro label, the title, the heading and the display, in base and in every component", () => {
  const sheets = [...sourceStylesheets(), { name: "base/typography", css: readFileSync(join(repoRoot, "base", "typography.css"), "utf8") }];
  let tracked = 0;
  for (const { name, css } of sheets) {
    for (const { selectors, declarations } of rulesOf(css)) {
      const key = declarations["font-size"]?.match(/^var\(--ds-text-(2xs|lg|xl|2xl)\)$/)?.[1];
      if (!key || selectors.some((selector) => SIZE_WITHOUT_ROLE.has(selector))) continue;
      assert.equal(declarations["letter-spacing"], `var(--ds-tracking-${key})`, `${name}: ${selectors.join(", ")} sets the ${key} size without its tracking`);
      if (key === "2xs") assert.equal(declarations["font-weight"], "var(--ds-weight-medium)", `${name}: ${selectors.join(", ")} is a micro label, which is set in the medium weight`);
      tracked += 1;
    }
  }
  assert.ok(tracked >= 30, `only ${tracked} rules were found`);
  const base = rulesOf(readFileSync(join(repoRoot, "base", "typography.css"), "utf8"));
  const heading = (tag) => base.find((rule) => rule.selectors.length === 1 && rule.selectors[0] === tag).declarations;
  assert.equal(heading("h1")["letter-spacing"], "var(--ds-tracking-2xl)");
  assert.equal(heading("h2")["letter-spacing"], "var(--ds-tracking-xl)");
  assert.equal(heading("h3")["letter-spacing"], "var(--ds-tracking-lg)");
});

// The role each kind of text takes, by the class that draws it. docs/authoring.md has the same table in words.
const TEXT_ROLES = {
  "2xs": [
    ".ds-data-table thead th", ".ds-menu__label", ".ds-listbox__label", ".ds-command-palette__label", ".ds-sidebar-nav__heading",
    ".ds-inspector__heading", ".ds-notification-list__group", ".ds-activity-feed__heading", ".ds-calendar__weekday",
    ".ds-key-value__label", ".ds-stat__label", ".ds-tool-call__label", ".ds-message__label",
  ],
  xs: [".ds-badge", ".ds-tag", ".ds-kbd", ".ds-code-block__caption", ".ds-activity-feed__time", ".ds-tool-call__duration", ".ds-list__meta", ".ds-tooltip__content"],
  sm: [
    ".ds-list", ".ds-menu", ".ds-tree", ".ds-sidebar-nav", ".ds-data-table", ".ds-listbox", ".ds-combobox__panel", ".ds-command-palette__list",
    ".ds-context-list", ".ds-button--small", ".ds-segmented-control__label",
    ".ds-field__description", ".ds-settings-row__description", ".ds-checkbox__description", ".ds-radio__description", ".ds-switch__description",
    ".ds-option-picker__description", ".ds-option-picker__hint", ".ds-stepper__description", ".ds-review-decision__caveat", ".ds-device-code__note",
    ".ds-page-header--compact .ds-page-header__description",
  ],
  lg: [
    ".ds-card__title", ".ds-dialog__title", ".ds-sheet__title", ".ds-settings-row__heading", ".ds-empty-state__title", ".ds-error-state__title",
    ".ds-inspector__title", ".ds-notification-list__title", ".ds-app-header__title", ".ds-approval__title", ".ds-review-decision__title",
    ".ds-page-header--compact .ds-page-header__title",
  ],
  xl: [".ds-stat__value"],
  "2xl": [".ds-page-header__title"],
};

test("each kind of text takes its role: rows and helper text the dense size, table heads and meta labels the micro size, a title lg and the page title 2xl", () => {
  const rules = rulesOf(read("design-system.css"));
  const sizeOf = (selector) => rules.find((rule) => rule.selectors.includes(selector) && rule.declarations["font-size"])?.declarations;
  for (const [key, selectors] of Object.entries(TEXT_ROLES)) {
    for (const selector of selectors) {
      const declared = sizeOf(selector);
      assert.equal(declared?.["font-size"], `var(--ds-text-${key})`, selector);
      assert.match(declared["line-height"] ?? `var(--ds-leading-${key})`, new RegExp(`--ds-leading-${key}\\b|calc\\(`), selector);
    }
  }
  // No helper, hint or description text is the caption size: on a settings screen it carries most of the words.
  for (const { selectors, declarations } of rules) {
    if (!selectors.some((selector) => /__(?:description|hint|help|helper|caveat)$/.test(selector)) || !declarations["font-size"]) continue;
    assert.notEqual(declarations["font-size"], "var(--ds-text-xs)", selectors.join(", "));
  }
  // Body text is the size of the body role, and a compact container changes that token and nothing else in the base layer.
  const body = rules.find((rule) => rule.selectors.includes("body") && rule.declarations["font-size"]).declarations;
  assert.equal(body["font-size"], "var(--ds-text-ui)");
  assert.equal(body["line-height"], "var(--ds-leading-ui)");
});

test("every duration, count and line total is set in tabular figures, and headings and titles wrap in balanced lines, never with text-wrap: pretty", () => {
  const rules = rulesOf(read("design-system.css"));
  const declared = (selector, property) => rules.filter((rule) => rule.selectors.includes(selector)).map((rule) => rule.declarations[property]).filter(Boolean).at(-1);
  const tabular = [
    ".ds-badge", ".ds-stat__value", ".ds-usage-meter__figures", ".ds-diff__counts", ".ds-diff__number", ".ds-data-table .ds-data-table__numeric",
    ".ds-tool-call__duration", ".ds-step-group__duration", ".ds-check-list__duration", ".ds-now-doing__elapsed", ".ds-run-status__elapsed",
    ".ds-run-status__facts", ".ds-run-timeline__time", ".ds-pagination__page", ".ds-pagination__status", ".ds-pending-tray__count",
    ".ds-notification-list__count", ".ds-selection-basket__count", ".ds-search-field__count", ".ds-activity-feed__time", ".ds-timeline__time",
    ".ds-list__meta", ".ds-tree__meta", ".ds-code-block__number", ".ds-undo-toast__countdown", ".ds-progress__value", ".ds-attachment-chip__size",
  ];
  for (const selector of tabular) assert.equal(declared(selector, "font-variant-numeric"), "tabular-nums", selector);
  const balanced = [
    "h1, h2, h3, h4, h5, h6", ".ds-page-header__title", ".ds-card__title", ".ds-dialog__title", ".ds-sheet__title", ".ds-settings-row__heading",
    ".ds-empty-state__title", ".ds-error-state__title", ".ds-approval__title",
  ];
  for (const selector of balanced) {
    const rule = rules.filter((candidate) => candidate.selectors.join(", ") === selector || candidate.selectors.includes(selector)).find((candidate) => candidate.declarations["text-wrap"]);
    assert.equal(rule?.declarations["text-wrap"], "balance", selector);
  }
  assert.doesNotMatch(read("design-system.css"), /text-wrap:\s*pretty/);
});

test("the spacing scale is eleven steps from 2px to 64px, and each reaches the preset, the gap classes, the manifest and the checker's keys", () => {
  const steps = { "2xs": "2px", xs: "4px", "xs-sm": "6px", sm: "8px", md: "12px", lg: "16px", "lg-xl": "20px", xl: "24px", "2xl": "32px", "3xl": "40px", "4xl": "64px" };
  const { light } = parseTokens(read("tokens.css"));
  assert.deepEqual(Object.fromEntries(Object.keys(light).filter((name) => name.startsWith("--ds-space-")).map((name) => [name.slice("--ds-space-".length), light[name]])), steps);
  const { theme } = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  const manifest = JSON.parse(read("manifest.json"));
  const css = read("design-system.css");
  for (const key of Object.keys(steps)) {
    assert.equal(theme.spacing[key], `var(--ds-space-${key})`, key);
    assert.ok(manifest.utilities.spacingKeys.includes(key), key);
    assert.ok(manifest.classes.includes(`ds-gap-${key}`), `ds-gap-${key}`);
    assert.ok(css.includes(`.ds-gap-${key} {\n    gap: var(--ds-space-${key});`), `ds-gap-${key}`);
  }
  // Where a component wrote one of the new steps as arithmetic on another, it now names the step.
  for (const { name, css: source } of sourceStylesheets()) {
    assert.doesNotMatch(source, /calc\(var\(--ds-space-lg\) \+ var\(--ds-space-xs\)\)|calc\(var\(--ds-space-xs\) \/ 2\)/, name);
  }
  assert.match(css, /\.ds-button--small \{[^}]*\n\s+gap: var\(--ds-space-xs-sm\);/);
  assert.match(css, /\.ds-settings-page \{[^}]*\n\s+gap: var\(--ds-space-3xl\);/);
});

// The radius of each component, by the class that draws its corner. docs/authoring.md has the same list in words.
const RADII = {
  xs: [".ds-badge", ".ds-tag", ".ds-kbd", ".ds-checkbox__input", ".ds-tag__remove", ".ds-progress__bar", ".ds-usage-meter__bar", ".ds-skeleton__line"],
  sm: [
    ".ds-button", ".ds-field__control", ".ds-tabs__tab", ".ds-pagination__page", ".ds-copy-field__value", ".ds-tag-input", ".ds-slider__input",
    ".ds-show-more__toggle", ".ds-search-field__clear", ".ds-jump-to-latest__button", ".ds-pending-tray__link", ".ds-file-upload__input",
    ".ds-app-header__name", ".ds-disclosure__summary", ".ds-breadcrumb__link", ".ds-calendar__day",
    // An inner radius: the container's 10px less the 4px between them.
    ".ds-menu__item", ".ds-listbox__option", ".ds-combobox__option", ".ds-command-palette__option", ".ds-sidebar-nav__item",
    ".ds-composer__box > .ds-composer__input", ".ds-message__code", ".ds-tool-call__code", ".ds-approval__command",
  ],
  md: [
    ".ds-card", ".ds-code-block", ".ds-message", ".ds-alert", ".ds-composer__box", ".ds-composer__input", ".ds-menu", ".ds-popover",
    ".ds-tooltip__content", ".ds-toast", ".ds-tool-call", ".ds-approval", ".ds-diff", ".ds-log-viewer", ".ds-review-decision", ".ds-listbox",
    ".ds-combobox__panel", ".ds-toolbar", ".ds-selection-basket", ".ds-option-picker__option", ".ds-split-panel", ".ds-device-code__entry",
  ],
  lg: [".ds-dialog"],
  full: [
    ".ds-filter-chips__chip", ".ds-suggestion-chips__chip", ".ds-source-chip", ".ds-attachment-chip", ".ds-attachment-chip__remove",
    ".ds-segmented-control__options", ".ds-segmented-control__input", ".ds-switch__input", ".ds-switch__input::before", ".ds-avatar__mark",
    ".ds-presence__more", ".ds-pending-tray__count", ".ds-composer__row > :where(button:last-child)", ".ds-composer__bar > :where(button:last-child)",
  ],
};

// The pill is for the shapes the list above names. A circle is the other use of the same token: a mark that is round
// because of what it is, not a container with rounded ends.
const CIRCLES = [
  ".ds-radio__input", ".ds-radio__input:checked::before", ".ds-option-picker__input", ".ds-option-picker__input:checked::before",
  ".ds-notification-list__unread::before", ".ds-stepper__step::before",
];

test("each component's radius is the one its kind takes: 4px a badge, 6px a control, 10px a container, 14px a dialog, and the pill only where the list allows", () => {
  const { light } = parseTokens(read("tokens.css"));
  assert.deepEqual(Object.fromEntries(Object.keys(light).filter((name) => name.startsWith("--ds-radius-")).map((name) => [name.slice("--ds-radius-".length), light[name]])), {
    xs: "4px", sm: "6px", md: "10px", lg: "14px", full: "9999px",
  });
  const rules = rulesOf(read("design-system.css"));
  const radiusOf = (selector) => rules.find((rule) => rule.selectors.includes(selector) && rule.declarations["border-radius"])?.declarations["border-radius"];
  for (const [key, selectors] of Object.entries(RADII)) {
    for (const selector of selectors) assert.equal(radiusOf(selector), `var(--ds-radius-${key})`, selector);
  }
  assert.equal(radiusOf(".ds-sheet"), "var(--ds-radius-lg) var(--ds-radius-lg) 0 0");
  // A select, a textarea, a toggle button and an icon button draw no corner of their own: they are a field or a button.
  for (const name of ["select", "textarea", "toggle-button", "icon-button", "split-button"]) {
    const own = rulesOf(readFileSync(join(repoRoot, "components", name, `${name}.css`), "utf8")).flatMap((rule) => Object.entries(rule.declarations)).filter(([property, value]) => /radius/.test(property) && value !== "0");
    assert.deepEqual(own, [], name);
  }
  // The pill, in every component and pattern: only the classes of the list, and the circles.
  const allowed = new Set([...RADII.full, ...CIRCLES]);
  let pills = 0;
  for (const { name, css } of sourceStylesheets()) {
    for (const { selectors, declarations } of rulesOf(css)) {
      if (!Object.entries(declarations).some(([property, value]) => /radius/.test(property) && value.includes("--ds-radius-full"))) continue;
      for (const selector of selectors) assert.ok(allowed.has(selector), `${name}: ${selector} uses --ds-radius-full, which is for a chip, the segmented control, a switch, an avatar, a count and Send`);
      pills += 1;
    }
  }
  assert.ok(pills >= RADII.full.length - 1);
  // No component writes a radius the scale does not have, and the old way to a 2px corner is gone.
  for (const { name, css } of sourceStylesheets()) {
    for (const { declarations } of rulesOf(css)) {
      for (const [property, value] of Object.entries(declarations)) {
        if (/radius/.test(property)) assert.match(value, /^(?:0|inherit|(?:var\(--ds-radius-(?:xs|sm|md|lg|full)\)|0)(?: (?:var\(--ds-radius-(?:xs|sm|md|lg|full)\)|0))*|calc\(.*\))$/, `${name}: ${property}: ${value}`);
      }
    }
  }
});

// Where each use of the touch size sits in a component or pattern stylesheet: the property, the selector of its
// rule and whether the rule is inside @media (pointer: coarse).
function touchUses(css) {
  const uses = [];
  const open = [];
  for (const [index, line] of css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " ")).split("\n").entries()) {
    const text = line.trim();
    if (text.endsWith("{")) open.push(text.slice(0, -1).trim());
    else if (text === "}") open.pop();
    else if (text.includes("--ds-size-touch")) {
      uses.push({ line: index + 1, property: text.split(":")[0], selector: open.at(-1), coarse: open.includes("@media (pointer: coarse)") });
    }
  }
  return uses;
}

test("a component uses the touch size only for the hit area of a pseudo-element, inside a coarse-pointer media query", () => {
  const folders = ["components", "patterns"].flatMap((dir) => readdirSync(join(repoRoot, dir)).map((name) => join(dir, name, `${name}.css`)));
  assert.ok(folders.length > 100);
  const sized = /^(?:width|height|min-width|min-height|inset|inset-block|inset-inline|top|padding)$/;
  let hitAreas = 0;
  for (const file of folders) {
    for (const use of touchUses(readFileSync(join(repoRoot, file), "utf8"))) {
      const where = `${file}:${use.line}`;
      assert.ok(use.coarse, `${where} uses --ds-size-touch outside @media (pointer: coarse). The height of a control is --ds-size-control and of a row --ds-size-row`);
      assert.match(use.selector, /::(?:after|before)$/, `${where} uses --ds-size-touch on ${use.selector}, which is not the pseudo-element of a hit area`);
      assert.match(use.property, sized, `${where} uses --ds-size-touch for ${use.property}`);
      hitAreas += 1;
    }
  }
  assert.ok(hitAreas >= 10, `only ${hitAreas} hit areas were found`);
  for (const file of ["base/layout.css", "base/typography.css", "base/focus.css", "base/reset.css", "gallery/gallery.css"]) {
    assert.doesNotMatch(readFileSync(join(repoRoot, file), "utf8"), /--ds-size-touch/, file);
  }
  // The check itself: a height outside the media query, and one on the control itself, are both caught.
  assert.deepEqual(touchUses(".ds-x {\n  min-height: var(--ds-size-touch);\n}\n"), [{ line: 2, property: "min-height", selector: ".ds-x", coarse: false }]);
  assert.equal(touchUses("@media (pointer: coarse) {\n  .ds-x::after {\n    height: var(--ds-size-touch);\n  }\n}\n")[0].coarse, true);
});

test("the new size variants are in the manifest and the component index, each with an example, and the old 44px sizes are gone from the metadata", () => {
  const manifest = JSON.parse(read("manifest.json"));
  const { components } = JSON.parse(read("components.json"));
  const sizes = (name) => Object.fromEntries(components.find((component) => component.name === name).sizes.map((size) => [size.name, size.class]));
  assert.deepEqual(sizes("button"), { default: undefined, small: "ds-button--small", large: "ds-button--large" });
  assert.deepEqual(sizes("icon-button"), { default: undefined, small: "ds-icon-button--small", xsmall: "ds-icon-button--xsmall" });
  for (const [name, className] of [["button", "ds-button--large"], ["icon-button", "ds-icon-button--small"], ["icon-button", "ds-icon-button--xsmall"]]) {
    assert.ok(manifest.classes.includes(className), className);
    const component = components.find((item) => item.name === name);
    assert.ok(component.classes.includes(className), className);
    assert.ok(component.examples.some((example) => example.markup.includes(className)), `${className} has no do example`);
  }
  const css = read("design-system.css");
  assert.match(css, /\.ds-button--small \{\n\s+min-height: var\(--ds-size-control-md\);/);
  assert.match(css, /\.ds-icon-button--small \{\n\s+width: var\(--ds-size-control-md\);/);
  assert.match(css, /\.ds-button--large \{\n\s+min-height: max\(var\(--ds-size-control-lg\), var\(--ds-size-control\)\);/);
  assert.match(css, /\.ds-icon-button--xsmall \{\n\s+width: var\(--ds-size-control-xs\);/);
  assert.match(read("react/busy-button.tsx"), /export type ButtonSize = "default" \| "small" \| "large";/);
  assert.match(read("react/busy-button.tsx"), /export type IconButtonSize = "default" \| "small" \| "xsmall";/);
});

test("the sidebar nav and the split panel's list column are as wide as the sidebar size, and the inspector as wide as the inspector size", () => {
  const css = read("design-system.css");
  assert.match(css, /\.ds-sidebar-nav \{[^}]*\n\s+width: var\(--ds-size-sidebar\);/);
  assert.match(css, /grid-template-columns: var\(--ds-size-sidebar\) minmax\(0, 1fr\);/);
  assert.match(css, /\.ds-inspector \{\n\s+width: var\(--ds-size-inspector\);/);
});

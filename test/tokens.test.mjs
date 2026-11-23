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

test("the density tokens are 28px, 36px and 44px for a control and 32px, 36px and 44px for a row, and comfortable is the default", () => {
  const { light, density } = parseTokens(read("tokens.css"));
  assert.deepEqual(density, {
    compact: { control: "28px", row: "32px" },
    comfortable: { control: "36px", row: "36px" },
    touch: { control: "44px", row: "44px" },
  });
  assert.equal(light["--ds-size-control"], density.comfortable.control);
  assert.equal(light["--ds-size-row"], density.comfortable.row);
  assert.equal(light["--ds-size-touch"], "44px");
  const steps = ["xs", "sm", "md", "lg"].map((step) => light[`--ds-size-control-${step}`]);
  assert.deepEqual(steps, ["24px", "28px", "32px", "40px"]);
  assert.equal(light["--ds-size-sidebar"], "260px");
  assert.equal(light["--ds-size-inspector"], "360px");
});

test("a coarse pointer gets the touch density on every element, after the blocks an attribute selects", () => {
  const css = read("tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const coarse = css.match(/@media \(pointer: coarse\) \{\s*:root,\s*\[data-ds-density\] \{([^}]*)\}/);
  assert.ok(coarse, "tokens.css has no block for a coarse pointer");
  assert.deepEqual([...coarse[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]), [
    ["--ds-size-control", "44px"],
    ["--ds-size-row", "44px"],
  ]);
  // The same specificity as one density block, so it wins by coming last.
  for (const density of ["compact", "comfortable", "touch"]) {
    assert.ok(css.indexOf(`[data-ds-density="${density}"]`) < coarse.index, `${density} comes after the block for a coarse pointer`);
  }
});

test("the density reaches the manifest, the token data and the token block, for the default theme and for a theme", () => {
  const values = { compact: { control: "28px", row: "32px" }, comfortable: { control: "36px", row: "36px" }, touch: { control: "44px", row: "44px" } };
  const manifest = JSON.parse(read("manifest.json"));
  assert.deepEqual(manifest.density, {
    attribute: "data-ds-density",
    default: "comfortable",
    coarsePointer: "touch",
    tokens: { control: "--ds-size-control", row: "--ds-size-row" },
    values,
  });
  for (const value of ["24px", "28px", "32px", "36px", "40px", "44px", "260px", "360px"]) assert.ok(manifest.values.size.includes(value), value);
  for (const key of ["control", "row", "control-xs", "control-sm", "control-md", "control-lg", "touch", "sidebar", "inspector"]) {
    assert.ok(manifest.utilities.sizeKeys.includes(key), key);
  }
  const px = (value) => ({ value, unit: "px" });
  for (const file of ["tokens.json", "themes/botbench.tokens.json"]) {
    const { size } = JSON.parse(read(file));
    assert.deepEqual(size.control, { $type: "dimension", $value: px(36), $extensions: { "design-system": { density: { compact: px(28), comfortable: px(36), touch: px(44) } } } }, file);
    assert.deepEqual(size.row.$extensions["design-system"].density, { compact: px(32), comfortable: px(36), touch: px(44) }, file);
    assert.deepEqual(size["control-sm"], { $type: "dimension", $value: px(28) }, file);
  }
  for (const file of ["design-tokens.md", "themes/botbench.design-tokens.md"]) {
    const [, block] = read(file).match(/^---\n([\s\S]*?)\n---\n/);
    const parsed = parseYamlBlock(block);
    assert.deepEqual(parsed.density, { ...values, default: "comfortable", "coarse-pointer": "touch" }, file);
    assert.equal(parsed.sizes.control, "36px", file);
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

test("a density block that sets another token, a comfortable density that is not the default, and a touch density that is not the touch size each fail the build", () => {
  const source = tokensSource();
  const compact = '[data-ds-density="compact"] {\n    --ds-size-control: 28px;';
  assert.ok(source.includes(compact));
  assert.throws(buildTokens(source.replace(compact, `${compact}\n    --ds-space-md: 8px;`)), /\[data-ds-density="compact"\] sets .*--ds-space-md.* A density block sets --ds-size-control and --ds-size-row and nothing else/);
  assert.throws(buildTokens(source.replace(/(\[data-ds-density="comfortable"\] \{\s*--ds-size-control: )36px/, "$140px")), /the comfortable density is the default, so its block must hold the values of :root/);
  assert.throws(buildTokens(source.replace(/(\[data-ds-density="touch"\] \{\s*--ds-size-control: )44px/, "$148px")), /the block for a coarse pointer must hold the values of the touch density/);
  assert.throws(buildTokens(source.replace(/--ds-size-touch: 44px/, "--ds-size-touch: 48px")), /the touch density must hold the value of --ds-size-touch/);
  assert.throws(buildTokens(source.replace(/\n {2}\[data-ds-density="touch"\] \{[^}]*\}\n/, "\n")), /the density block \[data-ds-density="touch"\] is missing/);
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
  assert.match(css, /\.ds-button--small \{\n\s+min-height: var\(--ds-size-control-sm\);/);
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

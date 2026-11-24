import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { build, parseTheme, parseTokens, readComponents, readPatterns } from "../scripts/build.mjs";
import { copySources, repoRoot, tempDir } from "./helpers.mjs";

const dist = join(repoRoot, "dist");
const read = (name) => readFileSync(join(dist, name), "utf8");
const defaults = parseTokens(read("tokens.css"));
const source = readFileSync(join(repoRoot, "themes", "botbench.css"), "utf8");
const botbench = parseTheme("botbench", source, defaults);

const ROLES = ["approval", "blocked", "peer", "tainted"];

// A copy of the sources whose botbench theme has been changed, and the error its build throws.
function buildWithTheme(change) {
  const root = copySources();
  const file = join(root, "themes", "botbench.css");
  writeFileSync(file, change(readFileSync(file, "utf8")));
  return () => build({ root, outDir: tempDir() });
}

// A theme with the given light and dark blocks, in the shape of tokens.css.
const theme = (light, dark, header = "/* A test theme. */") =>
  `${header}\n@layer ds.theme {\n  :root { ${light} }\n  [data-theme="dark"] { ${dark} }\n  @media (prefers-color-scheme: dark) {\n    [data-theme="auto"] { ${dark} }\n  }\n}\n`;

test("a theme that sets a name the vocabulary does not have fails the build, naming the theme and the name", () => {
  const run = buildWithTheme((css) => css.replace("--ds-color-accent: #215BB8;", "--ds-color-accent: #215BB8;\n    --ds-color-brand: #F59E0B;"));
  assert.throws(run, /themes\/botbench\.css: --ds-color-brand is not a token\. A theme can change a value and cannot add a name\./);
});

test("a theme without its dark values fails the build, naming the theme and the missing mode", () => {
  const run = buildWithTheme((css) => css.replace(/\n  \[data-theme="dark"\] \{[\s\S]*$/, "\n}\n"));
  assert.throws(run, /themes\/botbench\.css: the theme sets no dark values/);
  assert.throws(() => parseTheme("half", theme("", "--ds-color-accent: #222222;"), defaults), /themes\/half\.css: the theme sets no light values/);
});

test("a theme whose dark and auto blocks differ fails", () => {
  const css = theme("--ds-color-accent: #222222;", "--ds-color-accent: #EEEEEE;").replace('[data-theme="auto"] { --ds-color-accent: #EEEEEE;', '[data-theme="auto"] { --ds-color-accent: #DDDDDD;');
  assert.throws(() => parseTheme("split", css, defaults), /themes\/split\.css: the \[data-theme="dark"\] and \[data-theme="auto"\] blocks must declare the same values/);
});

test("a colour a theme sets for light alone fails, because the cascade would carry it into dark", () => {
  const css = theme("--ds-color-accent: #222222; --ds-color-focus: #222222;", "--ds-color-accent: #EEEEEE;");
  assert.throws(() => parseTheme("leaky", css, defaults), /--ds-color-focus has a light value and no dark value/);
});

test("a theme colour that is not six-digit hex fails", () => {
  const css = theme("--ds-color-accent: rgb(0 0 0);", "--ds-color-accent: #EEEEEE;");
  assert.throws(() => parseTheme("rgb", css, defaults), /--ds-color-accent must be six-digit hex, got rgb\(0 0 0\)/);
});

test("a theme pair below its minimum fails the build, naming the theme, the pair, the mode and the ratio", () => {
  const run = buildWithTheme((css) => css.replace("--ds-color-accent: #215BB8;", "--ds-color-accent: #D97706;"));
  assert.throws(run, /In the botbench theme, --ds-color-on-accent on --ds-color-accent is 3\.19:1 in light mode, below 4\.5:1/);
});

test("resolved values are the theme's where it sets one and the default theme's otherwise, in each mode", () => {
  const small = parseTheme("small", theme("--ds-color-accent: #222222;", "--ds-color-accent: #EEEEEE;"), defaults);
  assert.equal(small.defaultMode, "light");
  assert.equal(small.tokens.light["--ds-color-accent"], "#222222");
  assert.equal(small.tokens.dark["--ds-color-accent"], "#EEEEEE");
  assert.equal(small.tokens.light["--ds-color-surface"], defaults.light["--ds-color-surface"]);
  assert.equal(small.tokens.dark["--ds-color-surface"], defaults.dark["--ds-color-surface"]);
  assert.equal(small.tokens.dark["--ds-shadow-overlay"], defaults.dark["--ds-shadow-overlay"]);
  // Botbench sets no radius, so it comes from the default theme. It sets the one shadow, larger, in neutral black in both modes.
  assert.equal(botbench.tokens.light["--ds-radius-sm"], "10px");
  assert.equal(botbench.tokens.light["--ds-radius-md"], "12px");
  assert.equal(botbench.tokens.dark["--ds-shadow-overlay"], "0 16px 40px 0 rgb(0 0 0 / 0.5)");
  assert.equal(botbench.tokens.light["--ds-shadow-overlay"], "0 16px 40px 0 rgb(0 0 0 / 0.16)");
});

test("the default mode is read from the theme's first comment, and anything but light or dark fails", () => {
  assert.equal(botbench.defaultMode, "dark");
  const css = theme("--ds-color-accent: #222222;", "--ds-color-accent: #EEEEEE;", "/*\n * Default mode: sepia.\n */");
  assert.throws(() => parseTheme("sepia", css, defaults), /the default mode is light or dark, got sepia/);
});

test("every theme passes every listed pair in light and dark", () => {
  const { themes } = build({ outDir: tempDir() });
  const pairs = JSON.parse(readFileSync(join(repoRoot, "tokens", "pairs.json"), "utf8"));
  assert.deepEqual(themes.map(({ name }) => name), ["botbench"]);
  for (const { contrast } of themes) {
    assert.equal(contrast.length, pairs.length * 2);
    for (const row of contrast) assert.ok(row.ratio >= row.minimum, JSON.stringify(row));
  }
});

test("the theme stylesheet declares the layer order, keeps every rule in ds.theme and sets the dark values on a root with no data-theme", () => {
  const css = read("themes/botbench.css");
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(code.trimStart().startsWith("@layer ds.reset, ds.tokens, ds.theme, ds.base, ds.components;"));
  assert.equal(code.replace("@layer ds.reset, ds.tokens, ds.theme, ds.base, ds.components;", "").replace(/@layer ds\.theme \{[\s\S]*\n\}/, "").trim(), "");
  for (const [, name, value] of code.matchAll(/(--ds-color-[\w-]+):\s*([^;]+);/g)) assert.match(value, /^#[0-9A-F]{6}$/, name);
  const block = (selector) => {
    const at = code.indexOf(`${selector} {`);
    assert.ok(at >= 0, selector);
    return Object.fromEntries([...code.slice(at, code.indexOf("}", at)).matchAll(/(--ds-[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]));
  };
  assert.deepEqual(block(":root:not([data-theme])"), botbench.tokens.dark);
  // Native controls and scrollbars are drawn dark on that root too, as the reset does for data-theme="dark".
  assert.match(code.slice(code.indexOf(":root:not([data-theme]) {")).split("}")[0], /\n\s+color-scheme: dark;\n/);
  assert.deepEqual(block('[data-theme="dark"]'), botbench.own.dark);
  assert.deepEqual(block('[data-theme="auto"]'), botbench.own.dark);
  assert.deepEqual(block(":root"), botbench.own.light);
});

test("each theme has a summary with its default mode and the page background of each mode, for theme-color", () => {
  assert.deepEqual(JSON.parse(read("themes/botbench.json")), {
    name: "botbench",
    defaultMode: "dark",
    themeColor: { light: "#F5F6F7", dark: "#111316" },
  });
});

test("each theme has a DESIGN.md token block and a token data file holding its resolved values", () => {
  const block = read("themes/botbench.design-tokens.md");
  assert.match(block, /^---\nversion: alpha\nname: Design system, botbench theme\n/);
  assert.match(block, /\ncolors:\n {2}accent: "#215BB8"\n/);
  assert.match(block, /\ncolors-dark:\n {2}accent: "#7CB7FF"\n/);
  assert.match(block, /\nrounded:\n {2}xs: 6px\n {2}sm: 10px\n {2}md: 12px\n {2}lg: 16px\n {2}full: 9999px\n/);
  assert.match(block, /\n {2}ui:\n {4}fontFamily: "system-ui"\n {4}fontSize: 0\.9375rem\n {4}fontWeight: 400\n {4}lineHeight: 1\.533\n/);
  const data = JSON.parse(read("themes/botbench.tokens.json"));
  assert.deepEqual(Object.keys(data), Object.keys(JSON.parse(read("tokens.json"))));
  assert.equal(data.color.surface.$value.hex, "#f5f6f7");
  assert.equal(data.color.surface.$extensions["design-system"].dark.hex, "#111316");
  assert.equal(data.color.approval.$extensions["design-system"].dark.hex, "#f2b95d");
  assert.deepEqual(data.radius, JSON.parse(read("tokens.json")).radius);
  assert.deepEqual(data.text, JSON.parse(read("tokens.json")).text);
  assert.deepEqual(data.font.ui.$value.slice(0, 2), ["system-ui", "-apple-system"]);
  assert.deepEqual(data.shadow.overlay.$value.blur, { value: 40, unit: "px" });
  assert.deepEqual(data.shadow.overlay.$value.color.components, [0, 0, 0]);
});

test("the Tailwind preset is the same with and without a theme, because its values are custom property references", () => {
  const root = copySources();
  rmSync(join(root, "themes"), { recursive: true });
  // A pair that holds for one theme goes with the theme.
  const pairsFile = join(root, "tokens", "pairs.json");
  writeFileSync(pairsFile, JSON.stringify(JSON.parse(readFileSync(pairsFile, "utf8")).filter((pair) => !pair.themes)));
  const without = tempDir();
  const { files } = build({ root, outDir: without });
  assert.ok(!files.some((name) => name.startsWith("themes/")));
  for (const name of ["tailwind-preset.js", "tailwind-preset.d.ts", "tokens.css", "tokens.json", "manifest.json", "design-tokens.md"]) {
    assert.equal(readFileSync(join(without, name), "utf8"), read(name), name);
  }
});

test("the four new status roles reach the tokens, the preset, the token data, the token block, the manifest and the pairs", () => {
  const preset = JSON.parse(read("tailwind-preset.js").replace(/^export default /, "").replace(/;\s*$/, ""));
  const data = JSON.parse(read("tokens.json"));
  const block = read("design-tokens.md");
  const manifest = JSON.parse(read("manifest.json"));
  const pairs = JSON.parse(readFileSync(join(repoRoot, "tokens", "pairs.json"), "utf8"));
  const types = read("tailwind-preset.d.ts");
  for (const role of ROLES) {
    for (const key of [role, `${role}-subtle`]) {
      const name = `--ds-color-${key}`;
      assert.ok(defaults.light[name] && defaults.dark[name], name);
      assert.ok(botbench.own.light[name] && botbench.own.dark[name], `botbench ${name}`);
      assert.equal(preset.theme.colors[key], `var(${name})`);
      assert.ok(types.includes(`"${key}": string`), key);
      assert.equal(data.color[key].$value.hex, defaults.light[name].toLowerCase());
      assert.equal(data.color[key].$extensions["design-system"].dark.hex, defaults.dark[name].toLowerCase());
      assert.ok(block.includes(`\n  ${key}: "${defaults.light[name]}"\n`), key);
      assert.ok(manifest.tokens.color.includes(name), name);
      assert.ok(manifest.values.color.includes(defaults.light[name]) && manifest.values.color.includes(defaults.dark[name]), name);
    }
    const name = `--ds-color-${role}`;
    for (const background of [`${name}-subtle`, "--ds-color-surface", "--ds-color-surface-raised", "--ds-color-surface-sunken"]) {
      assert.ok(pairs.some((pair) => pair.foreground === name && pair.background === background && pair.kind === "text"), `${name} on ${background}`);
    }
    assert.ok(pairs.some((pair) => pair.foreground === "--ds-color-on-surface" && pair.background === `${name}-subtle`), `on-surface on ${name}-subtle`);
  }
});

// The status set lives in the badge's metadata. Every component that shows one of its states shows that state's icon and tone.
const components = Object.fromEntries([...readComponents(repoRoot), ...readPatterns(repoRoot)].map((folder) => [folder.name, folder]));
const statusSet = components.badge.meta.statusSet;
const byState = Object.fromEntries(statusSet.map((entry) => [entry.state, entry]));
const TONE_COLOUR = { neutral: "muted", info: "info", success: "success", warning: "warning", danger: "danger", approval: "approval", blocked: "blocked" };

// The declarations of every rule whose selector list holds the selector, in source order.
function declarationsFor(css, selector) {
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  return rules
    .filter(([, selectors]) => selectors.split(",").map((item) => item.trim()).includes(selector))
    .flatMap(([, , body]) => [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => [property, value.trim()]));
}

const last = (declarations, properties) => declarations.filter(([property]) => properties.includes(property)).at(-1)?.[1];
const iconOf = (css, selector) => last(declarationsFor(css, selector), ["mask", "mask-image"])?.match(/icons\/([\w-]+)\.svg/)?.[1];
const colourOf = (css, selectors) =>
  selectors.map((selector) => last(declarationsFor(css, selector), ["color", "background-color"])).filter(Boolean).at(-1)?.match(/--ds-color-([\w-]+)/)?.[1];

test("the badge's status set gives each of its thirteen states one icon and one tone of its own, and its examples show all of them", () => {
  assert.deepEqual(statusSet.map((entry) => entry.state), [
    "Queued", "Working", "Checking", "Needs input", "Ready for review", "Stopped", "Cancelled", "Check passed", "Check failed",
    "Failed", "Done", "Accepted", "Rejected",
  ]);
  assert.equal(new Set(statusSet.map((entry) => entry.icon)).size, statusSet.length);
  const { html } = components.badge.examples.find((example) => example.id === "status-set");
  for (const { state, icon, tone } of statusSet) {
    const modifier = tone === "neutral" ? "" : ` ds-badge--${tone}`;
    assert.match(html, new RegExp(`<span class="ds-badge${modifier}">\\s*<svg class="ds-badge__icon" aria-hidden="true"><use href="icons\\.svg#ds-icon-${icon}"></use></svg>\\s*${state}\\s*</span>`), state);
  }
  assert.ok(components.badge.examples.some((example) => example.dont === "review" && /colour alone/.test(example.title)));
});

test("every badge that names a state of the status set, in any component or pattern, has that state's icon and tone", () => {
  const badge = /<span class="ds-badge(?: ds-badge--([\w-]+))?">\s*(?:<svg class="ds-badge__icon" aria-hidden="true"><use href="icons\.svg#ds-icon-([\w-]+)"><\/use><\/svg>)?\s*([^<]*?)\s*<\/span>/g;
  let checked = 0;
  for (const { name, examples } of Object.values(components)) {
    for (const example of examples.filter((item) => !item.dont)) {
      for (const [, tone = "neutral", icon, label] of example.html.matchAll(badge)) {
        if (!(label in byState)) continue;
        checked++;
        assert.deepEqual({ tone, icon }, { tone: byState[label].tone, icon: byState[label].icon }, `${name}, ${example.id}: ${label}`);
      }
    }
  }
  assert.ok(checked > 30, `${checked} badges checked`);
});

test("run timeline, check list, tool call, step group and now doing draw a state of the status set with its icon and tone", () => {
  const drawn = [
    ["check-list", "Queued", [".ds-check-list__result"], ".ds-check-list__result::before"],
    ["check-list", "Working", [".ds-check-list__result", ".ds-check-list__result--running"], ".ds-check-list__result--running::before"],
    ["check-list", "Check passed", [".ds-check-list__result--passed"], ".ds-check-list__result--passed::before"],
    ["check-list", "Check failed", [".ds-check-list__result--failed"], ".ds-check-list__result--failed::before"],
    ["run-timeline", "Queued", [".ds-run-timeline__station"], ".ds-run-timeline__station::before"],
    ["run-timeline", "Working", ['.ds-run-timeline__station[data-state="running"]::before'], '.ds-run-timeline__station[data-state="running"]::before'],
    ["run-timeline", "Needs input", ['.ds-run-timeline__station[data-state="waiting"]::before'], '.ds-run-timeline__station[data-state="waiting"]::before'],
    ["run-timeline", "Check failed", ['.ds-run-timeline__station[data-state="failed"]::before'], '.ds-run-timeline__station[data-state="failed"]::before'],
    ["tool-call", "Needs input", ['.ds-tool-call[data-state] .ds-tool-call__status', '.ds-tool-call[data-state="awaiting-approval"] .ds-tool-call__status'], '.ds-tool-call[data-state="awaiting-approval"] .ds-tool-call__status::before'],
    ["tool-call", "Working", ['.ds-tool-call[data-state] .ds-tool-call__status', '.ds-tool-call[data-state="running"] .ds-tool-call__status'], '.ds-tool-call[data-state="running"] .ds-tool-call__status::before'],
    ["tool-call", "Check failed", ['.ds-tool-call[data-state] .ds-tool-call__status', '.ds-tool-call[data-state="failed"] .ds-tool-call__status'], '.ds-tool-call[data-state="failed"] .ds-tool-call__status::before'],
    ["tool-call", "Cancelled", ['.ds-tool-call[data-state] .ds-tool-call__status'], '.ds-tool-call[data-state="cancelled"] .ds-tool-call__status::before'],
    ["step-group", "Needs input", ['.ds-step-group__callout[data-state="awaiting-approval"]'], '.ds-step-group__callout[data-state="awaiting-approval"]::before'],
    ["now-doing", "Needs input", ['.ds-now-doing[data-state="waiting"] > .ds-now-doing__text::before'], '.ds-now-doing[data-state="waiting"] > .ds-now-doing__text::before'],
  ];
  for (const [name, state, colourSelectors, iconSelector] of drawn) {
    const { css } = components[name];
    const { icon, tone } = byState[state];
    assert.equal(iconOf(css, iconSelector), icon, `${name}: the icon of ${state}`);
    assert.equal(colourOf(css, colourSelectors), TONE_COLOUR[tone], `${name}: the tone of ${state}`);
  }
});

test("a timed-out check and a timed-out tool call look the same: a clock in the warning tone", () => {
  const checkList = components["check-list"].css;
  const toolCall = components["tool-call"].css;
  assert.equal(iconOf(checkList, ".ds-check-list__result--timed-out::before"), "clock");
  assert.equal(iconOf(toolCall, '.ds-tool-call[data-state="timed-out"] .ds-tool-call__status::before'), "clock");
  assert.equal(colourOf(checkList, [".ds-check-list__result--timed-out"]), "warning");
  assert.equal(colourOf(toolCall, ['.ds-tool-call[data-state] .ds-tool-call__status', '.ds-tool-call[data-state="timed-out"] .ds-tool-call__status']), "warning");
});

test("a status set that gives two states one icon, or names a tone that is not a variant, fails the build", () => {
  const root = copySources();
  const file = join(root, "components", "badge", "meta.json");
  const meta = JSON.parse(readFileSync(file, "utf8"));
  writeFileSync(file, JSON.stringify({ ...meta, statusSet: [...meta.statusSet, { state: "Paused", icon: "circle-pause", tone: "approval", use: "Paused." }] }));
  assert.throws(() => build({ root, outDir: tempDir() }), /components\/badge: the statusSet gives two states the icon "circle-pause"/);
  writeFileSync(file, JSON.stringify({ ...meta, statusSet: [{ ...meta.statusSet[0], tone: "amber" }] }));
  assert.throws(() => build({ root, outDir: tempDir() }), /the statusSet state "Queued" has the tone "amber", which is not a variant/);
});

test("a theme that sets a density token, or holds a density block, fails and is named", () => {
  const sized = theme("--ds-color-accent: #222222;\n    --ds-size-control: 40px;", "--ds-color-accent: #EEEEEE;");
  assert.throws(() => parseTheme("tall", sized, defaults), /themes\/tall\.css: a theme cannot set the density, and --ds-size-control is one of its tokens/);
  const block = theme("--ds-color-accent: #222222;", "--ds-color-accent: #EEEEEE;").replace(/\}\s*$/, '  [data-ds-density="compact"] {\n    --ds-size-row: 24px;\n  }\n}\n');
  assert.throws(() => parseTheme("dense", block, defaults), /themes\/dense\.css: a theme cannot set the density/);
  // The body size is a density token too, so a theme cannot set it either.
  const body = theme("--ds-text-ui: 1rem;", "--ds-color-accent: #EEEEEE;");
  assert.throws(() => parseTheme("large", body, defaults), /themes\/large\.css: a theme cannot set the density, and --ds-text-ui is one of its tokens/);
  // The Botbench theme leaves the density alone, and its controls are the default theme's.
  assert.deepEqual(botbench.tokens.density, defaults.density);
  assert.deepEqual(botbench.tokens.coarse, defaults.coarse);
  assert.equal(botbench.tokens.light["--ds-size-control"], "40px");
});

test("a theme sets no type size, line height, tracking or radius: the build fails, naming the theme and the token, and the Botbench theme sets none", () => {
  const cases = {
    "--ds-text-lg: 17px": /themes\/sized\.css: a theme cannot set a type size, and --ds-text-lg is one/,
    "--ds-leading-lg: 1.4": /themes\/sized\.css: a theme cannot set a line height, and --ds-leading-lg is one/,
    "--ds-tracking-lg: 0em": /themes\/sized\.css: a theme cannot set a tracking, and --ds-tracking-lg is one/,
    "--ds-radius-md: 22px": /themes\/sized\.css: a theme cannot set a radius, and --ds-radius-md is one\. The type scale and the radius scale are the same under every theme/,
  };
  for (const [declaration, message] of Object.entries(cases)) {
    assert.throws(() => parseTheme("sized", theme(`--ds-color-accent: #222222; ${declaration};`, "--ds-color-accent: #EEEEEE;"), defaults), message, declaration);
  }
  assert.throws(buildWithTheme((css) => css.replace("--ds-color-accent: #215BB8;", "--ds-color-accent: #215BB8;\n    --ds-radius-md: 22px;")), /themes\/botbench\.css: a theme cannot set a radius/);
  // What the theme does set: colours, the two font stacks and the shadow, and nothing else.
  const own = [...Object.keys(botbench.own.light), ...Object.keys(botbench.own.dark)];
  assert.deepEqual([...new Set(own.map((name) => name.match(/^--ds-([a-z]+)/)[1]))].sort(), ["color", "font", "shadow"]);
  for (const name of Object.keys(defaults.light).filter((token) => /^--ds-(?:text|leading|tracking|radius|space|size)-/.test(token))) {
    assert.equal(botbench.tokens.light[name], defaults.light[name], name);
  }
  assert.doesNotMatch(read("themes/botbench.css").replace(/\/\*[\s\S]*?\*\//g, ""), /--ds-(?:text|leading|tracking|radius)-/);
  // Its header no longer describes pills or its own sizes.
  assert.doesNotMatch(source, /22px|pill-shaped|ui 15px/);
});

// Graphite + Glacier, as the owner approved it: the value of each role in light and in dark.
const GRAPHITE_GLACIER = {
  accent: ["#215BB8", "#7CB7FF"], "on-accent": ["#FFFFFF", "#0B1522"], focus: ["#215BB8", "#7CB7FF"], info: ["#215BB8", "#7CB7FF"], "info-subtle": ["#E6EEFB", "#16263A"],
  surface: ["#F5F6F7", "#111316"], "surface-pane": ["#FBFBFC", "#181B20"], "surface-raised": ["#FFFFFF", "#20242B"], "surface-sunken": ["#EEF0F2", "#0B0D10"],
  fill: ["#ECEEF1", "#2C3139"], border: ["#DFE2E7", "#2A2F37"], "border-strong": ["#76808E", "#727D8B"], "on-surface": ["#1A2028", "#F2F3F5"], muted: ["#545E6B", "#ADB4BE"],
  peer: ["#0C7187", "#60D4D4"], "peer-subtle": ["#E0F3F6", "#10292B"], approval: ["#97600E", "#F2B95D"], "approval-subtle": ["#FBF0DC", "#2E2513"],
  success: ["#146A4A", "#6ED5A4"], "success-subtle": ["#E1F3EA", "#12281F"], danger: ["#B43E46", "#FF898A"], "danger-subtle": ["#FBE6E7", "#331A1C"],
};

test("the Botbench theme holds the Graphite + Glacier values: one interactive blue for accent, focus and working, and five status colours under the eight names", () => {
  for (const [key, [light, dark]] of Object.entries(GRAPHITE_GLACIER)) {
    assert.equal(botbench.tokens.light[`--ds-color-${key}`], light, `${key} in light`);
    assert.equal(botbench.tokens.dark[`--ds-color-${key}`], dark, `${key} in dark`);
  }
  for (const mode of ["light", "dark"]) {
    const value = (key) => botbench.tokens[mode][`--ds-color-${key}`];
    // One interactive colour, under three names a later theme can part.
    assert.equal(value("focus"), value("accent"), mode);
    assert.equal(value("info"), value("accent"), mode);
    assert.notEqual(value("accent-hover"), value("accent"), mode);
    // Warning is the attention pair, blocked the secondary text on the fill, and outside input the peer pair.
    assert.deepEqual([value("warning"), value("warning-subtle")], [value("approval"), value("approval-subtle")], mode);
    assert.deepEqual([value("blocked"), value("blocked-subtle")], [value("muted"), value("fill")], mode);
    assert.deepEqual([value("tainted"), value("tainted-subtle")], [value("peer"), value("peer-subtle")], mode);
    // Five status colours, no more, and none of them the interactive one but info.
    const hues = new Set(["success", "warning", "danger", "info", "approval", "blocked", "peer", "tainted"].map(value));
    assert.equal(hues.size, 6, `${mode}: ${[...hues].join(", ")}`);
    for (const key of ["success", "warning", "danger", "approval", "blocked", "peer", "tainted"]) assert.notEqual(value(key), value("accent"), `${key} in ${mode}`);
  }
  // The eight status names are all still tokens.
  for (const key of ["success", "warning", "danger", "info", "approval", "blocked", "peer", "tainted"]) {
    assert.ok(`--ds-color-${key}` in defaults.light && `--ds-color-${key}-subtle` in defaults.light, key);
  }
});

test("the pane surface is a token of every theme, between the page and a card, with its text, status and edge pairs", () => {
  const luminance = (hex) => [1, 3, 5].reduce((sum, at, index) => sum + [0.2126, 0.7152, 0.0722][index] * (parseInt(hex.slice(at, at + 2), 16) / 255) ** 2.2, 0);
  for (const [name, tokens] of [["default", defaults], ["botbench", botbench.tokens]]) {
    for (const mode of ["light", "dark"]) {
      const values = { ...tokens.light, ...(mode === "dark" ? tokens.dark : {}) };
      const [page, pane, raised] = ["surface", "surface-pane", "surface-raised"].map((key) => luminance(values[`--ds-color-${key}`]));
      assert.ok(page < pane && pane < raised, `${name} ${mode}: the pane is not between the page and a card`);
      assert.notEqual(values["--ds-color-border"], values["--ds-color-surface-pane"], `${name} ${mode}: the hairline on a pane would not be drawn`);
    }
  }
  const pairs = JSON.parse(readFileSync(join(repoRoot, "tokens", "pairs.json"), "utf8"));
  const on = (background) => pairs.filter((pair) => pair.background === background && !pair.themes).map((pair) => `${pair.foreground.slice("--ds-color-".length)} ${pair.kind}`);
  for (const foreground of ["on-surface text", "muted text", "accent text", "success text", "warning text", "danger text", "info text", "approval text", "blocked text", "peer text", "tainted text", "border-strong ui", "focus ui"]) {
    assert.ok(on("--ds-color-surface-pane").includes(foreground), `${foreground} on the pane surface has no pair`);
  }
  const css = read("design-system.css");
  for (const selector of [".ds-sidebar-nav", ".ds-inspector", ".ds-tab-bar"]) {
    assert.match(css, new RegExp(`\\${selector} \\{[^}]*background-color: var\\(--ds-color-surface-pane\\);`), selector);
  }
  // And nothing else takes it: a pane is the one role of the token.
  const users = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{[^{}]*var\(--ds-color-surface-pane\)[^{}]*\}/g)].map(([, selector]) => selector.trim());
  assert.deepEqual(users.sort(), [".ds-inspector", ".ds-sidebar-nav", ".ds-tab-bar"]);
});

test("a pair with a themes list is checked for those themes and no other, and the build fails when it names a theme that is not there or when the theme fails it", () => {
  const pairs = JSON.parse(readFileSync(join(repoRoot, "tokens", "pairs.json"), "utf8"));
  const scoped = pairs.filter((pair) => pair.themes);
  assert.ok(scoped.length >= 10);
  for (const pair of scoped) assert.deepEqual(pair.themes, ["botbench"]);
  const result = build({ outDir: tempDir() });
  const key = (row) => `${row.foreground} on ${row.background} ${row.kind}`;
  const inDefault = new Set(result.contrast.map(key));
  const inBotbench = new Set(result.themes.find((item) => item.name === "botbench").contrast.map(key));
  for (const pair of scoped) {
    assert.ok(!inDefault.has(key(pair)), `${key(pair)} is checked for the default theme`);
    assert.ok(inBotbench.has(key(pair)), `${key(pair)} is not checked for the botbench theme`);
  }
  assert.equal(result.contrast.length, (pairs.length - scoped.length) * 2);
  assert.equal(inBotbench.size, pairs.length);
  // What the direction needs beyond the default theme: secondary text on a well, on the fill and on a tint, and a control's edge on the fill and on two tints.
  for (const wanted of ["--ds-color-muted on --ds-color-surface-sunken text", "--ds-color-muted on --ds-color-fill text", "--ds-color-muted on --ds-color-approval-subtle text", "--ds-color-border-strong on --ds-color-fill ui", "--ds-color-border-strong on --ds-color-approval-subtle ui", "--ds-color-border-strong on --ds-color-peer-subtle ui"]) {
    assert.ok(scoped.some((pair) => key(pair) === wanted), wanted);
  }
  const withPairs = (change) => {
    const root = copySources();
    writeFileSync(join(root, "tokens", "pairs.json"), JSON.stringify(change(pairs)));
    return () => build({ root, outDir: tempDir() });
  };
  assert.throws(withPairs((all) => [...all, { foreground: "--ds-color-muted", background: "--ds-color-fill", kind: "text", themes: ["amber"] }]), /tokens\/pairs\.json: the pair --ds-color-muted on --ds-color-fill is for the theme "amber", and themes\/ has no amber\.css/);
  assert.throws(withPairs((all) => [...all, { foreground: "--ds-color-border", background: "--ds-color-surface", kind: "ui", themes: ["botbench"] }]), /In the botbench theme, --ds-color-border on --ds-color-surface is 1\.\d\d:1 in light mode, below 3:1/);
  assert.throws(withPairs((all) => [...all, { foreground: "--ds-color-ink", background: "--ds-color-surface", kind: "text" }]), /names --ds-color-ink, which is not a colour token/);
  assert.throws(withPairs((all) => [...all, { foreground: "--ds-color-muted", background: "--ds-color-surface", kind: "body" }]), /has the kind "body"\. It is text or ui/);
  // The same pair with no list would fail the default theme, which is why it has one.
  assert.throws(withPairs((all) => all.map((pair) => (pair.themes ? { foreground: pair.foreground, background: pair.background, kind: pair.kind } : pair))), /--ds-color-muted on --ds-color-surface-sunken is 4\.24:1 in the light theme, below 4\.5:1/);
});

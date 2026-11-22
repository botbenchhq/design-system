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
  const run = buildWithTheme((css) => css.replace("--ds-radius-md: 6px;", "--ds-radius-md: 6px;\n    --ds-color-brand: #F59E0B;"));
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
  const run = buildWithTheme((css) => css.replace("--ds-color-accent: #AD5D02;", "--ds-color-accent: #D97706;"));
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
  // Botbench sets no shadow and no 4px radius, so both come from the default theme.
  assert.equal(botbench.tokens.light["--ds-radius-sm"], "4px");
  assert.equal(botbench.tokens.light["--ds-radius-md"], "6px");
  assert.equal(botbench.tokens.dark["--ds-shadow-overlay"], defaults.dark["--ds-shadow-overlay"]);
  assert.equal(botbench.tokens.light["--ds-shadow-overlay"], defaults.light["--ds-shadow-overlay"]);
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
    themeColor: { light: "#FAF8F4", dark: "#121417" },
  });
});

test("each theme has a DESIGN.md token block and a token data file holding its resolved values", () => {
  const block = read("themes/botbench.design-tokens.md");
  assert.match(block, /^---\nversion: alpha\nname: Design system, botbench theme\n/);
  assert.match(block, /\ncolors:\n {2}accent: "#AD5D02"\n/);
  assert.match(block, /\ncolors-dark:\n {2}accent: "#F59E0B"\n/);
  assert.match(block, /\nrounded:\n {2}sm: 4px\n {2}md: 6px\n/);
  const data = JSON.parse(read("themes/botbench.tokens.json"));
  assert.deepEqual(Object.keys(data), Object.keys(JSON.parse(read("tokens.json"))));
  assert.equal(data.color.surface.$value.hex, "#faf8f4");
  assert.equal(data.color.surface.$extensions["design-system"].dark.hex, "#121417");
  assert.equal(data.color.approval.$extensions["design-system"].dark.hex, "#fbbf24");
  assert.deepEqual(data.radius.md.$value, { value: 6, unit: "px" });
  assert.deepEqual(data.shadow.overlay, JSON.parse(read("tokens.json")).shadow.overlay);
});

test("the Tailwind preset is the same with and without a theme, because its values are custom property references", () => {
  const root = copySources();
  rmSync(join(root, "themes"), { recursive: true });
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

test("the badge's status set gives each of its nine states one icon and one tone of its own, and its examples show all of them", () => {
  assert.deepEqual(statusSet.map((entry) => entry.state), [
    "Queued", "Working", "Checking", "Needs input", "Ready for review", "Stopped", "Cancelled", "Check passed", "Check failed",
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

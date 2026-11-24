// Generates everything in dist/ from tokens/, themes/, base/, components/, patterns/, gallery/, behaviors/, react/, checker/, rules/, hooks/ and scripts/migrate-prefix.mjs. Run with `npm run build`.
// `npm run vendor` refreshes the font and icon files under base/ from node_modules.

import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

// ds.theme comes after ds.tokens, so a theme loaded after design-system.css wins over the default values.
const LAYERS = ["ds.reset", "ds.tokens", "ds.theme", "ds.base", "ds.components"];

const MODES = ["light", "dark"];

// Longer prefixes first, so --ds-border-width is not read as a colour named "border".
const CATEGORIES = [
  "border-width", "breakpoint", "color", "duration", "ease", "font", "leading",
  "radius", "shadow", "size", "space", "text", "tracking", "weight", "z",
];

// The bundled stylesheet is tokens.css followed by these, in this order.
const BASE_STYLES = ["reset.css", "typography.css", "layout.css", "visually-hidden.css", "focus.css", "fonts.css"];

// Each file in base/fonts/ and the place in node_modules it is copied from.
const FONT_SOURCES = {
  "ibm-plex-sans-latin-wght-normal.woff2": "@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2",
  "ibm-plex-mono-latin-400-normal.woff2": "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
  "ibm-plex-mono-latin-500-normal.woff2": "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
  "ibm-plex-mono-latin-600-normal.woff2": "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
  "OFL-IBM-Plex-Sans.txt": "@fontsource-variable/ibm-plex-sans/LICENSE",
  "OFL-IBM-Plex-Mono.txt": "@fontsource/ibm-plex-mono/LICENSE",
};

// What a symbol keeps from an icon's root element, so one drawn through <use> looks like the single file.
const SYMBOL_ATTRIBUTES = ["viewBox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"];

// The rendered check is these checker files joined in this order, each after the ones it imports from.
const DOM_BUNDLE = [
  "rules/stock-phrases.mjs", "rules/tree.mjs", "rules/disclosure.mjs", "rules/tells.mjs", "rules/copy.mjs", "rules/adoption.mjs",
  "rules/index.mjs", "dom-entry.mjs",
];

const MINIMUM_CONTRAST = { text: 4.5, ui: 3 };

// rules/core.md is the one file every agent reads, so its length is capped. About 400 tokens.
export const CORE_RULES_LIMIT = 2400;

// What meta.json holds, in the order components.json lists it. The contract is docs/authoring.md.
const COMPONENT_FIELDS = {
  name: "text", title: "text", purpose: "text", status: "text",
  whenToUse: "list", whenNotToUse: "list", variants: "list", sizes: "list", states: "list",
  accessibility: "list", icons: "list", classes: "list",
};
const STATUSES = ["draft", "stable"];

// An optional field: a fixed set of states, each with one icon and one tone, that other components reuse.
// Each entry is { state, icon, tone, use }, where tone is the name of one of the component's variants.
const STATUS_SET_FIELDS = ["state", "icon", "tone", "use"];

// The two kinds of folder built to the authoring contract, and the directory each lives in.
// A page pattern is a whole screen composed from components. Its meta.json says "kind": "pattern".
const KINDS = { component: "components", pattern: "patterns" };

// The gallery's own stylesheet and script, copied from gallery/ beside the generated pages.
const GALLERY_FILES = ["gallery.css", "gallery.js"];

// Utility classes a screen may use: layout, spacing and sizing only.
const UTILITIES = {
  layout: {
    exact: [
      "block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid", "contents", "hidden",
      "static", "relative", "absolute", "fixed", "sticky", "grow", "shrink", "truncate", "sr-only",
    ],
    prefixes: [
      "flex-", "grid-", "col-", "row-", "items-", "justify-", "content-", "self-", "place-", "order-",
      "grow-", "shrink-", "basis-", "overflow-", "inset-", "top-", "right-", "bottom-", "left-", "z-",
    ],
  },
  spacing: {
    prefixes: [
      "p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-", "m-", "mx-", "my-", "mt-", "mr-", "mb-", "ml-",
      "gap-", "gap-x-", "gap-y-", "space-x-", "space-y-",
    ],
  },
  sizing: {
    prefixes: ["w-", "h-", "size-", "min-w-", "min-h-", "max-w-", "max-h-"],
  },
  variants: ["md"],
};

const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

function declarations(css) {
  return [...withoutComments(css).matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(
    ([, name, value]) => [name, value.trim()],
  );
}

export function validateTheme(css, knownNames) {
  const known = new Set(knownNames);
  for (const [name] of declarations(css)) {
    if (!known.has(name)) throw new Error(`${name} is not a token. A theme can change a value and cannot add a name.`);
  }
}

function categoryOf(name) {
  const rest = name.slice("--ds-".length);
  const category = CATEGORIES.find((prefix) => rest === prefix || rest.startsWith(`${prefix}-`));
  if (!name.startsWith("--ds-") || !category) throw new Error(`${name} is not in a known token category`);
  return { category, key: rest === category ? "DEFAULT" : rest.slice(category.length + 1) };
}

const SELECTORS = { light: ":root", dark: '[data-theme="dark"]', auto: '[data-theme="auto"]' };

// Density: four tokens say how tall a control and a row are and how large body text is. :root holds the default.
// data-ds-density="compact" on a container sets them for what is inside it, and one block inside
// @media (pointer: coarse) sets them on every element, a compact container included, and makes every type size one
// pixel larger. A theme cannot set any of them.
export const DENSITY = {
  attribute: "data-ds-density",
  attributeValues: ["compact"],
  tokens: { control: "--ds-size-control", row: "--ds-size-row", text: "--ds-text-ui", leading: "--ds-leading-ui" },
};
// The two of them a coarse pointer sets to the touch size. It sets the type sizes itself.
const DENSITY_SIZES = ["--ds-size-control", "--ds-size-row"];
// How much larger a type size is on a coarse pointer: one pixel at a 16px root. Two sizes are not: the label of a
// control takes the body size there, and the title of a view stays as :root has it, so its block leaves it out.
const COARSE_TEXT_STEP = 0.0625;
const COARSE_TEXT_AS_BODY = ["--ds-text-md"];
const COARSE_TEXT_UNCHANGED = ["--ds-text-2xl"];
// No type size is under 12px at a 16px root.
const SMALLEST_TEXT = 0.75;
// The weight a type role is set in, where it is not normal: the sub-heading, the heading and the title.
const ROLE_WEIGHTS = { lg: "semibold", xl: "semibold", "2xl": "semibold" };
// What a theme cannot set, by category: the type scale and the radius scale are the same under every theme.
const THEME_FIXED = { text: "a type size", leading: "a line height", tracking: "a tracking", radius: "a radius" };
const DENSITY_SELECTORS = {
  ...Object.fromEntries(DENSITY.attributeValues.map((density) => [density, `[${DENSITY.attribute}="${density}"]`])),
  coarse: `:root, [${DENSITY.attribute}]`,
};

// The light, dark and auto blocks of a token file, each as { name: value } or null when the file has none, and
// its density blocks by name. The dark and auto blocks must hold the same values, and every colour is six-digit hex.
function parseBlocks(css, file) {
  const blocks = { light: null, dark: null, auto: null, density: {} };
  for (const [, selector, body] of withoutComments(css).matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const written = selector.trim().replace(/\s+/g, " ");
    const mode = Object.keys(SELECTORS).find((key) => SELECTORS[key] === written);
    const density = Object.keys(DENSITY_SELECTORS).find((key) => DENSITY_SELECTORS[key] === written);
    if (!mode && !density) throw new Error(`Unexpected selector in ${file}: ${written}`);
    if (mode) blocks[mode] = Object.fromEntries(declarations(body));
    else blocks.density[density] = Object.fromEntries(declarations(body));
  }
  if (JSON.stringify(blocks.dark) !== JSON.stringify(blocks.auto)) {
    throw new Error(`${file}: the [data-theme="dark"] and [data-theme="auto"] blocks must declare the same values`);
  }
  for (const [name, value] of [...Object.entries(blocks.light ?? {}), ...Object.entries(blocks.dark ?? {})]) {
    if (categoryOf(name).category === "color" && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
      throw new Error(`${file}: ${name} must be six-digit hex, got ${value}`);
    }
  }
  return blocks;
}

// A type size in rem, as a number. Every type size is written in rem, so it follows the reader's font-size setting.
function rem(name, value) {
  const [, amount] = value.match(/^([\d.]+)rem$/) ?? [];
  if (amount === undefined) throw new Error(`tokens.css: ${name} is ${value}. A type size is written in rem, so it follows the reader's font-size setting`);
  return Number(amount);
}

// The density of tokens.css as { default, compact, "coarse-pointer" }, each holding { control, row, text, leading },
// and everything the block for a coarse pointer sets as { name: value }. The compact block sets the four density
// tokens and nothing else. The block for a coarse pointer sets the control and the row to the touch size, makes
// each type size one pixel larger than :root has it (the label of a control takes the body size, and the title
// is left out), and sets the body line height.
function parseDensity(blocks, light) {
  const names = Object.values(DENSITY.tokens);
  const textNames = Object.keys(light).filter((name) => categoryOf(name).category === "text");
  for (const name of textNames) {
    if (rem(name, light[name]) < SMALLEST_TEXT) throw new Error(`tokens.css: ${name} is ${light[name]}. No type size is under ${SMALLEST_TEXT}rem, which is 12px unless the reader changed it`);
  }
  const coarseTextNames = textNames.filter((name) => !COARSE_TEXT_UNCHANGED.includes(name));
  const expected = { ...Object.fromEntries(DENSITY.attributeValues.map((density) => [density, names])), coarse: [...DENSITY_SIZES, ...coarseTextNames, DENSITY.tokens.leading] };
  for (const key of Object.keys(DENSITY_SELECTORS)) {
    const block = blocks[key];
    if (!block) throw new Error(`tokens.css: the density block ${DENSITY_SELECTORS[key]} is missing`);
    if (!same(Object.keys(block), expected[key])) {
      throw new Error(
        key === "coarse"
          ? `tokens.css: the block for a coarse pointer sets ${Object.keys(block).join(", ")}. It sets ${DENSITY_SIZES.join(" and ")}, every type size but ${COARSE_TEXT_UNCHANGED.join(", ")}, and ${DENSITY.tokens.leading}, and nothing else`
          : `tokens.css: ${DENSITY_SELECTORS[key]} sets ${Object.keys(block).join(", ")}. A density block sets ${names.join(", ")} and nothing else`,
      );
    }
  }
  for (const name of DENSITY_SIZES) {
    if (blocks.coarse[name] !== light["--ds-size-touch"]) throw new Error(`tokens.css: on a coarse pointer ${name} is ${blocks.coarse[name]}. It must hold the value of --ds-size-touch, ${light["--ds-size-touch"]}`);
  }
  const body = `${rem(DENSITY.tokens.text, light[DENSITY.tokens.text]) + COARSE_TEXT_STEP}rem`;
  for (const name of coarseTextNames) {
    if (COARSE_TEXT_AS_BODY.includes(name)) {
      if (blocks.coarse[name] !== body) throw new Error(`tokens.css: on a coarse pointer ${name} is ${blocks.coarse[name]}. The label of a control is the body size there, so it must be ${body}`);
      continue;
    }
    const larger = `${rem(name, light[name]) + COARSE_TEXT_STEP}rem`;
    if (blocks.coarse[name] !== larger) throw new Error(`tokens.css: on a coarse pointer ${name} is ${blocks.coarse[name]}. A type size is one pixel larger there, so it must be ${larger}`);
  }
  const parts = (from) => Object.fromEntries(Object.entries(DENSITY.tokens).map(([key, name]) => [key, from[name]]));
  return {
    density: {
      default: parts(light),
      ...Object.fromEntries(DENSITY.attributeValues.map((density) => [density, parts(blocks[density])])),
      "coarse-pointer": parts(blocks.coarse),
    },
    coarse: blocks.coarse,
  };
}

export function parseTokens(css) {
  const { light, dark, density } = parseBlocks(css, "tokens.css");
  validateTheme(css, Object.keys(light));
  return { light, dark, ...parseDensity(density, light) };
}

// A theme is themes/<name>.css: values for existing token names in light and dark, in the selector shape of
// tokens.css, inside @layer ds.theme. Its first comment may say "Default mode: dark", which makes a page with
// no data-theme attribute dark. Returns the theme's own values, its default mode and its resolved values:
// the theme's value where it sets one and the default theme's otherwise, as the cascade gives them.
export function parseTheme(name, css, defaults) {
  const file = `themes/${name}.css`;
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`${file}: a theme's name is lower case with hyphens`);
  const outside = withoutComments(css).replace(/@layer ds\.theme \{[\s\S]*\}/, "").trim();
  if (!withoutComments(css).includes("@layer ds.theme {") || outside !== "") {
    throw new Error(`${file}: every rule goes inside @layer ds.theme { … }, and nothing outside it`);
  }
  try {
    validateTheme(css, Object.keys(defaults.light));
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
  const blocks = parseBlocks(css, file);
  const density = Object.values(DENSITY.tokens).find((token) => [blocks.light, blocks.dark].some((block) => block && token in block));
  if (density || Object.keys(blocks.density).length > 0) {
    throw new Error(`${file}: a theme cannot set the density${density ? `, and ${density} is one of its tokens` : ""}. The density is the same under every theme`);
  }
  for (const token of [...Object.keys(blocks.light ?? {}), ...Object.keys(blocks.dark ?? {})]) {
    const fixed = THEME_FIXED[categoryOf(token).category];
    if (fixed) throw new Error(`${file}: a theme cannot set ${fixed}, and ${token} is one. The type scale and the radius scale are the same under every theme: a theme sets colours, the two font stacks and the shadow`);
  }
  for (const mode of MODES) {
    if (!blocks[mode] || Object.keys(blocks[mode]).length === 0) {
      throw new Error(`${file}: the theme sets no ${mode} values. A theme sets both modes: a :root block for light, and a [data-theme="dark"] block repeated as [data-theme="auto"] inside @media (prefers-color-scheme: dark)`);
    }
  }
  // A value set for light alone would also apply in dark, over the default theme's dark value.
  for (const token of Object.keys(blocks.light)) {
    if (token in defaults.dark && !(token in blocks.dark)) {
      throw new Error(`${file}: ${token} has a light value and no dark value. The default theme has both, so the theme must set both`);
    }
  }
  const comment = css.match(/^\s*\/\*([\s\S]*?)\*\//)?.[1] ?? "";
  const declared = comment.match(/Default mode: (\w+)/)?.[1] ?? "light";
  if (!MODES.includes(declared)) throw new Error(`${file}: the default mode is light or dark, got ${declared}`);
  const light = { ...defaults.light, ...blocks.light };
  const dark = Object.fromEntries(
    [...new Set([...Object.keys(defaults.dark), ...Object.keys(blocks.dark)])].map((token) => [
      token,
      blocks.dark[token] ?? blocks.light[token] ?? defaults.dark[token],
    ]),
  );
  return { name, defaultMode: declared, own: { light: blocks.light, dark: blocks.dark }, tokens: { light, dark, density: defaults.density, coarse: defaults.coarse }, comment: css.match(/^\s*(\/\*[\s\S]*?\*\/)/)?.[1] ?? null };
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const [darker, lighter] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (lighter + 0.05) / (darker + 0.05);
}

// A pair with a "themes" list holds for those themes only: it is checked for each of them and for no other, the
// default theme included. A component may rely only on a pair with no list, which every theme passes.
const pairsFor = (pairs, themeName) => pairs.filter((pair) => (pair.themes ? pair.themes.includes(themeName) : true));

function checkPairs(pairs, tokenNames, themeNames) {
  for (const pair of pairs) {
    const where = `tokens/pairs.json: the pair ${pair.foreground} on ${pair.background}`;
    for (const name of [pair.foreground, pair.background]) {
      if (!tokenNames.includes(name) || categoryOf(name).category !== "color") throw new Error(`${where} names ${name}, which is not a colour token`);
    }
    if (!(pair.kind in MINIMUM_CONTRAST)) throw new Error(`${where} has the kind ${JSON.stringify(pair.kind)}. It is ${Object.keys(MINIMUM_CONTRAST).join(" or ")}`);
    if (pair.themes !== undefined && (!Array.isArray(pair.themes) || pair.themes.length === 0)) throw new Error(`${where} has a "themes" that is not a list of theme names`);
    for (const theme of pair.themes ?? []) {
      if (!themeNames.includes(theme)) throw new Error(`${where} is for the theme ${JSON.stringify(theme)}, and themes/ has no ${theme}.css`);
    }
  }
}

function checkContrast(tokens, allPairs, themeName = null) {
  const pairs = pairsFor(allPairs, themeName);
  const themes = { light: tokens.light, dark: { ...tokens.light, ...tokens.dark } };
  const report = [];
  for (const { foreground, background, kind } of pairs) {
    for (const [theme, values] of Object.entries(themes)) {
      const ratio = contrastRatio(values[foreground], values[background]);
      report.push({ foreground, background, kind, theme, ratio, minimum: MINIMUM_CONTRAST[kind] });
    }
  }
  const failures = report.filter((row) => row.ratio < row.minimum);
  if (failures.length > 0) {
    throw new Error(
      failures
        .map((row) =>
          themeName
            ? `In the ${themeName} theme, ${row.foreground} on ${row.background} is ${row.ratio.toFixed(2)}:1 in ${row.theme} mode, below ${row.minimum}:1`
            : `${row.foreground} on ${row.background} is ${row.ratio.toFixed(2)}:1 in the ${row.theme} theme, below ${row.minimum}:1`,
        )
        .join("\n"),
    );
  }
  return report;
}

// { color: { accent: "--ds-color-accent", … }, … } in source order.
function groupByCategory(names) {
  const groups = {};
  for (const name of names) {
    const { category, key } = categoryOf(name);
    (groups[category] ??= {})[key] = name;
  }
  return groups;
}

function tailwindPreset(groups, breakpoint) {
  const refs = (category) =>
    Object.fromEntries(Object.entries(groups[category]).map(([key, name]) => [key, `var(${name})`]));
  const spacing = { 0: "0", ...refs("space") };
  const size = refs("size");
  const pick = (keys) => Object.fromEntries(keys.map((key) => [key, size[key]]));
  // The heights of a control and a row, and the widths of a column: each kind of utility takes the sizes that fit it.
  const targets = pick(Object.keys(size).filter((key) => /^(?:control|row|touch)/.test(key)));
  const columns = pick(["sidebar", "inspector", "column", "transcript", "wide"]);
  const theme = {
    screens: { md: breakpoint },
    colors: { ...refs("color"), transparent: "transparent", current: "currentColor" },
    spacing,
    borderRadius: { none: "0", ...refs("radius") },
    borderWidth: { DEFAULT: refs("border-width").DEFAULT, 0: "0" },
    fontFamily: refs("font"),
    // A size comes with its line height, and with its tracking where the role has one.
    fontSize: Object.fromEntries(
      Object.keys(groups.text).map((key) => [
        key,
        [refs("text")[key], { lineHeight: refs("leading")[key], ...(key in groups.tracking ? { letterSpacing: refs("tracking")[key] } : {}) }],
      ]),
    ),
    fontWeight: refs("weight"),
    lineHeight: refs("leading"),
    boxShadow: { none: "none", ...refs("shadow") },
    zIndex: { 0: "0", ...refs("z") },
    transitionDuration: { DEFAULT: refs("duration").base, ...refs("duration") },
    transitionTimingFunction: { DEFAULT: refs("ease").DEFAULT },
    backgroundImage: { none: "none" },
    outlineOffset: spacing,
    outlineWidth: { 0: "0" },
    textUnderlineOffset: { auto: "auto", ...refs("space") },
    textDecorationThickness: { auto: "auto" },
    width: { auto: "auto", ...spacing, ...targets, sidebar: size.sidebar, inspector: size.inspector, full: "100%" },
    height: { auto: "auto", ...spacing, ...targets, full: "100%", screen: "100dvh" },
    size: { auto: "auto", ...spacing, ...targets, full: "100%" },
    minWidth: { 0: "0", ...targets, full: "100%" },
    minHeight: { 0: "0", ...targets, full: "100%", screen: "100dvh" },
    maxWidth: { none: "none", ...columns, full: "100%" },
    maxHeight: { none: "none", full: "100%", screen: "100dvh" },
  };
  const emptied = [
    "letterSpacing", "boxShadowColor", "dropShadow", "opacity", "animation", "keyframes", "transitionDelay",
    "scale", "rotate", "skew", "gradientColorStops", "gradientColorStopPositions", "strokeWidth",
    "ringWidth", "ringColor", "ringOffsetWidth", "ringOffsetColor", "ringOpacity",
    "blur", "brightness", "contrast", "grayscale", "hueRotate", "invert", "saturate", "sepia",
    "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale", "backdropHueRotate",
    "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia",
  ];
  for (const key of emptied) theme[key] = {};
  return { theme };
}

const presetTypes = (preset) => {
  const shape = (value) =>
    Array.isArray(value)
      ? `[${value.map(shape).join(", ")}]`
      : typeof value === "string"
        ? "string"
        : `{ ${Object.entries(value).map(([key, inner]) => `${JSON.stringify(key)}: ${shape(inner)}`).join("; ")} }`;
  const keys = Object.entries(preset.theme).map(([key, value]) => `    ${key}: ${shape(value)};`);
  return `declare const preset: {\n  theme: {\n${keys.join("\n")}\n  };\n};\n\nexport default preset;\n`;
};

// A length as the token data holds it. A type size is in rem and a tracking in em; every other length is in px.
const px = (value) => ({ value: parseFloat(value), unit: value.match(/(rem|em)$/)?.[1] ?? "px" });

function srgb(hex) {
  const components = [1, 3, 5].map((at) => Math.round((parseInt(hex.slice(at, at + 2), 16) / 255) * 10000) / 10000);
  return { colorSpace: "srgb", components, hex: hex.toLowerCase() };
}

function shadowValue(name, value) {
  const match = value.match(/^(\S+) (\S+) (\S+) (\S+) rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/);
  if (!match) throw new Error(`${name} must be written as "x y blur spread rgb(r g b / alpha)", got ${value}`);
  const [offsetX, offsetY, blur, spread] = match.slice(1, 5).map(px);
  const components = match.slice(5, 8).map((channel) => Math.round((channel / 255) * 10000) / 10000);
  return { color: { colorSpace: "srgb", components, alpha: Number(match[8]) }, offsetX, offsetY, blur, spread };
}

const fontStack = (value) => value.split(",").map((family) => family.trim().replace(/^"|"$/g, ""));

const DTCG = {
  color: ["color", (_, value) => srgb(value)],
  font: ["fontFamily", (_, value) => fontStack(value)],
  text: ["dimension", (_, value) => px(value)],
  // The format's dimension has no em, so a tracking travels as the number of ems.
  tracking: ["number", (_, value) => parseFloat(value)],
  leading: ["number", (_, value) => Number(value)],
  weight: ["fontWeight", (_, value) => Number(value)],
  space: ["dimension", (_, value) => px(value)],
  radius: ["dimension", (_, value) => px(value)],
  "border-width": ["dimension", (_, value) => px(value)],
  shadow: ["shadow", shadowValue],
  duration: ["duration", (_, value) => ({ value: parseFloat(value), unit: "ms" })],
  ease: ["cubicBezier", (_, value) => value.match(/[\d.]+/g).map(Number)],
  z: ["number", (_, value) => Number(value)],
  size: ["dimension", (_, value) => px(value)],
  breakpoint: ["dimension", (_, value) => px(value)],
};

// Dark values travel in $extensions, since the format has no notion of a theme.
function tokenData(groups, tokens) {
  const data = {};
  for (const [category, names] of Object.entries(groups)) {
    const [$type, convert] = DTCG[category];
    data[category] = {};
    for (const [key, name] of Object.entries(names)) {
      const token = { $type, $value: convert(name, tokens.light[name]) };
      if (name in tokens.dark) token.$extensions = { "design-system": { dark: convert(name, tokens.dark[name]) } };
      // A density token's value in a compact container travels the same way.
      const density = Object.keys(DENSITY.tokens).find((part) => DENSITY.tokens[part] === name);
      if (density) {
        token.$extensions = { "design-system": { density: Object.fromEntries(DENSITY.attributeValues.map((level) => [level, convert(name, tokens.density[level][density])])) } };
      }
      // And what a coarse pointer sets: the control, the row, each type size and the body line height.
      if (name in tokens.coarse) {
        token.$extensions = { "design-system": { ...token.$extensions?.["design-system"], "coarse-pointer": convert(name, tokens.coarse[name]) } };
      }
      data[category][key] = token;
    }
  }
  return data;
}

function yaml(value, indent = "") {
  return Object.entries(value)
    .map(([key, inner]) =>
      typeof inner === "object" ? `${indent}${key}:\n${yaml(inner, `${indent}  `)}` : `${indent}${key}: ${inner}\n`,
    )
    .join("");
}

// The same shape as the front matter of a consumer's DESIGN.md.
function designTokens(groups, tokens, name = "Design system") {
  const values = (category, from = tokens.light, format = (value) => value) =>
    Object.fromEntries(
      Object.entries(groups[category])
        .filter(([, name]) => name in from)
        .map(([key, name]) => [key, format(from[name])]),
    );
  const quote = (value) => `"${value}"`;
  const typography = {};
  for (const [key, name] of Object.entries(groups.text)) {
    const family = groups.font[key] ?? groups.font.ui;
    typography[key] = {
      fontFamily: quote(fontStack(tokens.light[family])[0]),
      fontSize: tokens.light[name],
      fontWeight: tokens.light[groups.weight[ROLE_WEIGHTS[key] ?? "normal"]],
      lineHeight: tokens.light[groups.leading[key]],
      ...(key in groups.tracking ? { letterSpacing: tokens.light[groups.tracking[key]] } : {}),
    };
  }
  const block = {
    version: "alpha",
    name,
    colors: values("color", tokens.light, quote),
    "colors-dark": values("color", tokens.dark, quote),
    typography,
    fontWeights: values("weight"),
    rounded: values("radius"),
    spacing: values("space"),
    borderWidth: tokens.light[groups["border-width"].DEFAULT],
    elevation: values("shadow", tokens.light, quote),
    "elevation-dark": values("shadow", tokens.dark, quote),
    motion: { duration: values("duration"), easing: quote(tokens.light[groups.ease.DEFAULT]) },
    layers: values("z"),
    sizes: values("size"),
    // The four density tokens by default, in a compact container and on a coarse pointer, which always wins.
    density: tokens.density,
    // Every type size on a coarse pointer: one pixel larger.
    "typography-coarse-pointer": Object.fromEntries(Object.entries(groups.text).filter(([, name]) => name in tokens.coarse).map(([key, name]) => [key, tokens.coarse[name]])),
    breakpoint: tokens.light[groups.breakpoint.DEFAULT],
  };
  return `---\n${yaml(block)}---\n`;
}

const block = (indent, selector, values) =>
  `${indent}${selector} {\n${Object.entries(values).map(([name, value]) => `${indent}  ${name}: ${value};`).join("\n")}\n${indent}}`;

// dist/themes/<name>.css: the layer order, so the theme wins even when it is loaded first, then the theme's own
// values. A theme whose default mode is dark also sets every dark value on a root with no data-theme attribute,
// filled in from the default theme where the theme sets none, so that page matches data-theme="dark". That block
// sets color-scheme too, which the reset sets from data-theme alone, so native controls and scrollbars are drawn dark.
function themeStylesheet(theme) {
  const parts = [
    ...(theme.comment ? [theme.comment, ""] : []),
    `/* Generated from themes/${theme.name}.css by npm run build. Load it after design-system.css. */`,
    "",
    `@layer ${LAYERS.join(", ")};`,
    "",
    "@layer ds.theme {",
    block("  ", SELECTORS.light, theme.own.light),
    ...(theme.defaultMode === "dark" ? ["", "  /* The default mode: with no data-theme attribute the page is dark. */", block("  ", ":root:not([data-theme])", { "color-scheme": "dark", ...theme.tokens.dark })] : []),
    "",
    block("  ", SELECTORS.dark, theme.own.dark),
    "",
    "  @media (prefers-color-scheme: dark) {",
    block("    ", SELECTORS.auto, theme.own.dark),
    "  }",
    "}",
    "",
  ];
  return parts.join("\n");
}

// What a page needs to know about a theme before its stylesheet loads, such as the two theme-color meta tags.
const themeSummary = (theme) => ({
  name: theme.name,
  defaultMode: theme.defaultMode,
  themeColor: { light: theme.tokens.light["--ds-color-surface"], dark: theme.tokens.dark["--ds-color-surface"] },
});

// Every theme in themes/, parsed, validated and contrast-checked against tokens/pairs.json. An error names the theme.
export function readThemes(root, defaults, pairs) {
  const dir = join(root, "themes");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => {
      const name = file.slice(0, -".css".length);
      const theme = parseTheme(name, readFileSync(join(dir, file), "utf8"), defaults);
      return { ...theme, contrast: checkContrast(theme.tokens, pairs, name) };
    });
}

// Every rule ID the checker can emit, read from its source. A rule is named where it is defined (id: "…"),
// where a finding is made (rule: "…", add(line, "…")) or where a scale rule is set up (scaleCategory("…")).
export function ruleIds(checker) {
  const named = /(?:\b(?:rule|id): |\badd\([\w.]+, |\bscaleCategory\()"([a-z]+(?:-[a-z]+)+)"/g;
  const ids = listFiles(checker)
    .filter((file) => file.endsWith(".mjs"))
    .flatMap((file) => [...readFileSync(join(checker, file), "utf8").matchAll(named)].map(([, id]) => id));
  return [...new Set(ids)].sort();
}

function manifest(groups, tokens, classes, rules) {
  const names = {};
  const values = {};
  for (const [category, keys] of Object.entries(groups)) {
    names[category] = Object.values(keys);
    values[category] = [...new Set(names[category].flatMap((name) => [tokens.light[name], tokens.dark[name]]))]
      .filter((value) => value !== undefined);
  }
  // A density token also holds its value in a compact container and on a coarse pointer.
  for (const [part, name] of Object.entries(DENSITY.tokens)) {
    const { category } = categoryOf(name);
    values[category] = [...new Set([...values[category], ...Object.values(tokens.density).map((parts) => parts[part])])];
  }
  // And a type size its value on a coarse pointer.
  const coarseText = Object.fromEntries(Object.entries(tokens.coarse).filter(([name]) => categoryOf(name).category === "text"));
  values.text = [...new Set([...values.text, ...Object.values(coarseText)])];
  return {
    prefix: "ds",
    layers: LAYERS,
    breakpoint: tokens.light[groups.breakpoint.DEFAULT],
    tokens: names,
    values,
    // The attribute that sets the density of a container, its values, and what the four density tokens hold by
    // default, in a compact container and on a coarse pointer.
    density: { ...DENSITY, values: tokens.density },
    // Every type size on a coarse pointer, where each is one pixel larger.
    coarsePointer: { text: coarseText },
    utilities: {
      ...UTILITIES,
      spacingKeys: ["0", ...Object.keys(groups.space)],
      sizeKeys: [...Object.keys(groups.size), "auto", "full", "screen", "none"],
    },
    classes,
    rules,
  };
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function symbol(name, svg) {
  const [, root, body] = svg.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  const attributes = [...root.matchAll(/([\w-]+)="([^"]*)"/g)]
    .filter(([, attribute]) => SYMBOL_ATTRIBUTES.includes(attribute))
    .map(([pair]) => pair);
  const shapes = body.trim().split(/\s*\n\s*/).join("");
  return `  <symbol id="ds-icon-${name}" ${attributes.join(" ")}>${shapes}</symbol>\n`;
}

function sprite(icons) {
  const symbols = Object.entries(icons).map(([name, svg]) => symbol(name, svg.toString()));
  return `<!-- Icons from Lucide, ISC License. The notice is in icons/LICENSE. -->\n<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("")}</svg>\n`;
}

// One classic script holding the structural rules, for a browser test to inject into a page.
// The modules share one scope, so their imports and exports are dropped.
function domBundle(checker, readingColumn) {
  const modules = DOM_BUNDLE.map((name) => {
    const source = readFileSync(join(checker, name), "utf8");
    return `// ${name}\n${source.replace(/^import [^;]+;\n/gm, "").replace(/^export /gm, "").trim()}\n`;
  });
  return [
    "// Generated from checker/. Defines dsCheckDom(root, { appPrefix }), which returns the structural findings of the rendered page.",
    "(() => {",
    '"use strict";',
    ...modules,
    `globalThis.dsCheckDom = (root = document.documentElement, options = {}) => checkDom(root, ${parseFloat(readingColumn)}, options ?? {});`,
    "})();",
    "",
  ].join("\n");
}

const classesIn = (css) => [...new Set([...withoutComments(css).matchAll(/\.(ds-[\w-]+)/g)].map(([, name]) => name))].sort();

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escapeHtml = (text) => text.replace(/[&<>"]/g, (character) => ENTITIES[character]);
const unescapeHtml = (text) =>
  text.replace(/&(?:amp|lt|gt|quot);/g, (entity) => Object.keys(ENTITIES).find((character) => ENTITIES[character] === entity));

function dedent(markup) {
  const lines = markup.replace(/^\s*\n|\s+$/g, "").split("\n");
  const indent = Math.min(...lines.filter((line) => line.trim() !== "").map((line) => line.match(/^\s*/)[0].length));
  return lines.map((line) => line.slice(indent)).join("\n");
}

// The examples in one examples.html. Each is a top-level element carrying data-example:
//   { id, title, state, dont, reason, markup, html }
// where markup is what the element holds and html is the element itself.
function parseExamples(source) {
  const examples = [];
  const opening = /\s*(?:<!--[\s\S]*?-->\s*)*<([a-z][\w-]*)\b([^>]*)>/y;
  let at = 0;
  for (;;) {
    opening.lastIndex = at;
    const match = opening.exec(source);
    if (!match) break;
    const [whole, tag, attributeText] = match;
    const attrs = Object.fromEntries(
      [...attributeText.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, unescapeHtml(value)]),
    );
    const id = attrs["data-example"];
    if (!id) throw new Error(`examples.html has a top-level <${tag}> without data-example`);
    const bodyStart = at + whole.length;
    // The matching end tag, counting elements of the same name nested inside.
    const edge = new RegExp(`<(/?)${tag}\\b[^>]*>`, "g");
    edge.lastIndex = bodyStart;
    let closing;
    for (let depth = 1; depth > 0; depth += closing[1] ? -1 : 1) {
      closing = edge.exec(source);
      if (!closing) throw new Error(`the example "${id}" has no end tag`);
    }
    examples.push({
      id,
      title: attrs["data-title"] ?? null,
      state: attrs["data-state"] ?? null,
      dont: attrs["data-dont"] ?? null,
      reason: attrs["data-reason"] ?? null,
      markup: dedent(source.slice(bodyStart, closing.index)),
      html: source.slice(at, edge.lastIndex).trim(),
    });
    at = edge.lastIndex;
  }
  if (source.slice(at).replace(/<!--[\s\S]*?-->/g, "").trim() !== "") {
    throw new Error("examples.html holds markup outside an element with data-example");
  }
  return examples;
}

// Icons a component draws: sprite references in its examples and single files its stylesheet uses as masks.
function iconsIn(css, examples) {
  const names = [
    ...[...withoutComments(css).matchAll(/url\("icons\/([\w-]+)\.svg"\)/g)].map(([, name]) => name),
    ...examples.flatMap((example) => [...example.html.matchAll(/icons\.svg#ds-icon-([\w-]+)/g)].map(([, name]) => name)),
  ];
  return [...new Set(names)].sort();
}

const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

function checkComponent(name, { meta, css, examples }, iconNames, kind = "component") {
  if (kind === "pattern" && meta.kind !== "pattern") throw new Error('meta.json of a pattern needs "kind": "pattern"');
  if (kind === "component" && meta.kind !== undefined && meta.kind !== "component") {
    throw new Error(`meta.json has the kind "${meta.kind}". A folder in components/ is a component. A pattern goes in patterns/`);
  }
  for (const [field, type] of Object.entries(COMPONENT_FIELDS)) {
    const present = type === "list" ? Array.isArray(meta[field]) : typeof meta[field] === "string" && meta[field] !== "";
    if (!present) throw new Error(`meta.json needs ${field} as ${type === "list" ? "a list" : "text"}`);
  }
  if (meta.name !== name) throw new Error(`meta.json has the name "${meta.name}", which is not the folder name`);
  if (!STATUSES.includes(meta.status)) throw new Error(`meta.json has the status "${meta.status}". It is ${STATUSES.join(" or ")}`);

  if (!withoutComments(css).includes("@layer ds.components")) throw new Error(`${name}.css must put its rules in @layer ds.components`);
  const defined = classesIn(css);
  const foreign = defined.filter((item) => item !== `ds-${name}` && !/^(?:__|--)/.test(item.slice(`ds-${name}`.length)));
  if (foreign.length > 0) {
    throw new Error(`${name}.css defines ${foreign.join(", ")}. Its classes are ds-${name}, ds-${name}__part and ds-${name}--variant`);
  }
  const unlisted = defined.filter((item) => !meta.classes.includes(item));
  const undefinedClasses = meta.classes.filter((item) => !defined.includes(item));
  if (unlisted.length > 0) throw new Error(`${name}.css defines ${unlisted.join(", ")}, which the classes list in meta.json leaves out`);
  if (undefinedClasses.length > 0) throw new Error(`meta.json lists ${undefinedClasses.join(", ")}, which ${name}.css does not define`);

  const ids = examples.map((example) => example.id);
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) throw new Error(`examples.html has two examples named "${repeated}"`);
  for (const example of examples) {
    if (!example.title) throw new Error(`the example "${example.id}" needs data-title`);
    if (example.dont && !example.reason) throw new Error(`the don't example "${example.id}" needs data-reason`);
  }
  const dos = examples.filter((example) => !example.dont);
  if (dos.length === 0) throw new Error("examples.html needs at least one do example");
  if (dos.length === examples.length) throw new Error("examples.html needs at least one don't example, marked with data-dont");
  if (!dos.some((example) => example.reason)) throw new Error("one do example needs data-reason, to pair with the don't example");
  for (const state of meta.states) {
    if (!dos.some((example) => example.state === state)) {
      throw new Error(`the state "${state}" in meta.json has no do example with data-state="${state}"`);
    }
  }

  if (meta.statusSet !== undefined) checkStatusSet(meta);

  const used = iconsIn(css, examples);
  const unknown = used.filter((icon) => !iconNames.includes(icon));
  if (unknown.length > 0) throw new Error(`uses the icon ${unknown.join(", ")}, which base/icons.json does not list`);
  if (!same(used, meta.icons)) throw new Error(`meta.json lists the icons [${meta.icons.join(", ")}], and the stylesheet and examples use [${used.join(", ")}]`);
}

function checkStatusSet(meta) {
  if (!Array.isArray(meta.statusSet) || meta.statusSet.length === 0) throw new Error("meta.json has a statusSet that is not a list of states");
  const tones = meta.variants.map((variant) => variant.name);
  for (const entry of meta.statusSet) {
    const missing = STATUS_SET_FIELDS.filter((field) => typeof entry[field] !== "string" || entry[field] === "");
    if (missing.length > 0) throw new Error(`the statusSet entry ${JSON.stringify(entry.state)} needs ${missing.join(", ")} as text`);
    if (!tones.includes(entry.tone)) throw new Error(`the statusSet state "${entry.state}" has the tone "${entry.tone}", which is not a variant`);
    if (!meta.icons.includes(entry.icon)) throw new Error(`the statusSet state "${entry.state}" has the icon "${entry.icon}", which the icons list leaves out`);
  }
  for (const field of ["state", "icon"]) {
    const values = meta.statusSet.map((entry) => entry[field]);
    const repeated = values.find((value, index) => values.indexOf(value) !== index);
    if (repeated) throw new Error(`the statusSet gives two states the ${field} "${repeated}". Each state has its own`);
  }
}

// Every folder of one kind, read and checked against the authoring contract: [{ name, meta, css, examples }].
// An error names the folder.
function readFolders(root, kind) {
  const dir = KINDS[kind];
  if (!existsSync(join(root, dir))) return [];
  const iconNames = JSON.parse(readFileSync(join(root, "base", "icons.json"), "utf8"));
  const folders = readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return folders.map((name) => {
    try {
      const read = (file) => {
        const path = join(root, dir, name, file);
        if (!existsSync(path)) throw new Error(`${file} is missing. A ${kind} is ${name}.css, examples.html and meta.json`);
        return readFileSync(path, "utf8");
      };
      const folder = { name, meta: JSON.parse(read("meta.json")), css: read(`${name}.css`), examples: parseExamples(read("examples.html")) };
      checkComponent(name, folder, iconNames, kind);
      return folder;
    } catch (error) {
      throw new Error(`${dir}/${name}: ${error.message}`);
    }
  });
}

// Every component folder.
export function readComponents(root = repoRoot) {
  return readFolders(root, "component");
}

// Every page pattern folder. A pattern shares the gallery, the class list and the index with the components,
// so it cannot take the name of one.
export function readPatterns(root = repoRoot) {
  const taken = new Set(readdirSync(join(root, KINDS.component)));
  const patterns = readFolders(root, "pattern");
  for (const { name } of patterns) {
    if (taken.has(name)) throw new Error(`patterns/${name}: components/${name} has the same name. A component and a pattern cannot share one`);
  }
  return patterns;
}

// One entry per component and one per pattern: its metadata and the markup of each do example, for an agent to copy.
// Components keep their own list, so a reader of `components` sees what it always has. A pattern entry also says
// "kind": "pattern".
function componentIndex(components, patterns) {
  const entry = ({ meta, examples }) => ({
    ...Object.fromEntries(Object.keys(COMPONENT_FIELDS).map((field) => [field, meta[field]])),
    ...(meta.kind === "pattern" && { kind: "pattern" }),
    ...(meta.statusSet && { statusSet: meta.statusSet }),
    examples: examples
      .filter((example) => !example.dont)
      .map(({ id, title, state, reason, markup }) => ({ id, title, ...(state && { state }), ...(reason && { reason }), markup })),
  });
  return { components: components.map(entry), patterns: patterns.map(entry) };
}

// The short index: enough of each component and pattern to choose one, without the markup.
// An agent reads this first, then opens the one entry it needs in components.json.
function shortIndex(folders) {
  return folders.map(({ meta }) => ({
    name: meta.name,
    kind: meta.kind === "pattern" ? "pattern" : "component",
    title: meta.title,
    purpose: meta.purpose,
    status: meta.status,
    classes: meta.classes,
  }));
}

const galleryIcon = (name) => `<svg aria-hidden="true"><use href="../icons.svg#ds-icon-${name}"></use></svg>`;

// Every gallery page loads each behaviour module, so an example wrapped in one of their elements works.
// The bar switches the mode with ?theme= and loads a theme from themes/ with ?brand=. gallery.js applies both.
function galleryPage(title, body, behaviors, themes = []) {
  const brands = [
    '<a href="?brand=default" data-gallery-default="light">Default</a>',
    ...themes.map(({ name, defaultMode }) => `<a href="?brand=${name}" data-gallery-default="${defaultMode}">${escapeHtml(name[0].toUpperCase() + name.slice(1))}</a>`),
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="../design-system.css">
<link rel="stylesheet" href="gallery.css">
<script src="gallery.js"></script>
${behaviors.map((name) => `<script type="module" src="../behaviors/${name}"></script>`).join("\n")}
</head>
<body>
<header data-gallery="bar">
<a href="index.html">Design system gallery</a>
<div data-gallery="switches">
<nav aria-label="Mode"><a href="?theme=light">Light</a><a href="?theme=dark">Dark</a></nav>
<nav aria-label="Theme">${brands.join("")}</nav>
</div>
</header>
<main data-gallery="page">
${body}
</main>
</body>
</html>
`;
}

const galleryList = (items) => `<ul>\n${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n")}\n</ul>`;

// A do example with a reason and a don't example each get a verdict. Any other example is a plain specimen.
function galleryExample(example) {
  const kind = example.dont ? "dont" : example.reason ? "do" : "specimen";
  const verdict = { do: `${galleryIcon("check")}Do`, dont: `${galleryIcon("x")}Don't` }[kind];
  const caught = example.dont === "review" ? "Caught in review, not by the checker." : `Checker rule: <code>${escapeHtml(example.dont ?? "")}</code>`;
  return [
    `<figure data-gallery="${kind}">`,
    "<figcaption>",
    `<h3>${verdict ? `<span data-gallery="verdict">${verdict}</span> ` : ""}${escapeHtml(example.title)}</h3>`,
    ...(example.state ? [`<p data-gallery="state">State: <code>${escapeHtml(example.state)}</code></p>`] : []),
    ...(example.reason ? [`<p>${escapeHtml(example.reason)}</p>`] : []),
    ...(example.dont ? [`<p>${caught}</p>`] : []),
    "</figcaption>",
    // An example names the sprite as it sits in dist/. A gallery page is one directory down.
    example.html.replaceAll('"icons.svg#', '"../icons.svg#'),
    "</figure>",
  ].join("\n");
}

// A pattern is a whole screen, so its examples run down the page in one column. A component's sit two abreast.
function galleryComponent({ meta, examples }, behaviors, themes) {
  const columns = meta.kind === "pattern" ? "ds-grid" : "ds-grid ds-grid-2";
  const options = (heading, items) =>
    items.length === 0
      ? []
      : [
          `<section>\n<h2>${heading}</h2>\n<dl>`,
          ...items.map(
            (item) => `<dt>${escapeHtml(item.name)}${item.class ? ` <code>${escapeHtml(item.class)}</code>` : ""}</dt>\n<dd>${escapeHtml(item.use)}</dd>`,
          ),
          "</dl>\n</section>",
        ];
  return galleryPage(`${meta.title} - Design system gallery`, [
    `<header>\n<h1>${escapeHtml(meta.title)}</h1>\n<p>${escapeHtml(meta.purpose)}</p>\n<p data-gallery="status">Status: ${meta.status}</p>\n</header>`,
    `<section>\n<h2>Examples</h2>\n<div class="${columns}">\n${examples.map(galleryExample).join("\n")}\n</div>\n</section>`,
    `<div class="ds-grid ds-grid-2">`,
    `<section>\n<h2>When to use it</h2>\n${galleryList(meta.whenToUse)}\n</section>`,
    `<section>\n<h2>When not to use it</h2>\n${galleryList(meta.whenNotToUse)}\n</section>`,
    ...options("Variants", meta.variants),
    ...options("Sizes", meta.sizes),
    `<section>\n<h2>Accessibility</h2>\n${galleryList(meta.accessibility)}\n</section>`,
    `<section>\n<h2>Classes</h2>\n<ul>\n${meta.classes.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join("\n")}\n</ul>\n</section>`,
    "</div>",
  ].join("\n"), behaviors, themes);
}

function galleryIndex(components, patterns, behaviors, themes) {
  const rows = (folders) =>
    folders.map(
      ({ name, meta }) =>
        `<li><a href="${name}.html">${escapeHtml(meta.title)}</a> <span>${escapeHtml(meta.purpose)}</span> <span data-gallery="status">${meta.status}</span></li>`,
    );
  return galleryPage("Design system gallery", [
    "<header>\n<h1>Components</h1>\n<p>Each page shows a component in every variant and state, with a do and a don't.</p>\n</header>",
    `<ul data-gallery="index">\n${rows(components).join("\n")}\n</ul>`,
    ...(patterns.length === 0
      ? []
      : [
          "<header>\n<h2>Page patterns</h2>\n<p>Each page shows a whole screen composed from the components, in every state, with a do and a don't.</p>\n</header>",
          `<ul data-gallery="index">\n${rows(patterns).join("\n")}\n</ul>`,
        ]),
  ].join("\n"), behaviors, themes);
}

// Every file under dir, as a path relative to it with forward slashes.
export function listFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).replaceAll("\\", "/"))
    .sort();
}

// Copies the font files and the icons named in base/icons.json out of the installed development dependencies.
export function vendor(root = repoRoot) {
  const modules = join(root, "node_modules");
  const fonts = join(root, "base", "fonts");
  const icons = join(root, "base", "icons");
  for (const dir of [fonts, icons]) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }
  for (const [name, source] of Object.entries(FONT_SOURCES)) copyFileSync(join(modules, source), join(fonts, name));
  for (const name of JSON.parse(readFileSync(join(root, "base", "icons.json"), "utf8"))) {
    copyFileSync(join(modules, "lucide-static", "icons", `${name}.svg`), join(icons, `${name}.svg`));
  }
  copyFileSync(join(modules, "lucide-static", "LICENSE"), join(icons, "LICENSE"));
}

export function build({ root = repoRoot, outDir = join(root, "dist") } = {}) {
  const source = readFileSync(join(root, "tokens", "tokens.css"), "utf8");
  const pairs = JSON.parse(readFileSync(join(root, "tokens", "pairs.json"), "utf8"));
  if (!source.includes(`@layer ${LAYERS.join(", ")};`)) {
    throw new Error(`tokens.css must declare the layer order: @layer ${LAYERS.join(", ")};`);
  }
  const tokens = parseTokens(source);
  const themesDir = join(root, "themes");
  const themeNames = existsSync(themesDir) ? readdirSync(themesDir).filter((file) => file.endsWith(".css")).map((file) => file.slice(0, -".css".length)) : [];
  checkPairs(pairs, Object.keys(tokens.light), themeNames);
  const contrast = checkContrast(tokens, pairs);
  const themes = readThemes(root, tokens, pairs);
  const groups = groupByCategory(Object.keys(tokens.light));
  const preset = tailwindPreset(groups, tokens.light[groups.breakpoint.DEFAULT]);

  const base = join(root, "base");
  const baseStyles = BASE_STYLES.map((name) => readFileSync(join(base, name), "utf8"));
  const iconNames = JSON.parse(readFileSync(join(base, "icons.json"), "utf8"));
  const icons = Object.fromEntries(iconNames.map((name) => [name, readFileSync(join(base, "icons", `${name}.svg`))]));
  const components = readComponents(root);
  const patterns = readPatterns(root);
  const folders = [...components, ...patterns];
  const classes = [...new Set([...baseStyles.flatMap(classesIn), ...folders.flatMap(({ meta }) => meta.classes)])].sort();
  const behaviors = listFiles(join(root, "behaviors"));
  const modules = behaviors.filter((name) => name.endsWith(".js"));
  const checker = join(root, "checker");
  const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const coreRules = readFileSync(join(root, "rules", "core.md"), "utf8");
  if (coreRules.length > CORE_RULES_LIMIT) {
    throw new Error(`rules/core.md is ${coreRules.length} characters. The limit is ${CORE_RULES_LIMIT}. Move detail to another rules file.`);
  }

  const files = {
    "tokens.css": source,
    // Patterns come after every component, so a pattern's layout wins over a component it arranges.
    "design-system.css": [source, ...baseStyles, ...folders.map(({ css }) => css)].join("\n"),
    "icons.svg": sprite(icons),
    "icons/LICENSE": readFileSync(join(base, "icons", "LICENSE")),
    "tokens.json": json(tokenData(groups, tokens)),
    "tailwind-preset.js": `export default ${JSON.stringify(preset, null, 2)};\n`,
    "tailwind-preset.d.ts": presetTypes(preset),
    "design-tokens.md": designTokens(groups, tokens),
    "manifest.json": json(manifest(groups, tokens, classes, ruleIds(checker))),
    "components.json": json(componentIndex(components, patterns)),
    "gallery/index.html": galleryIndex(components, patterns, modules, themes),
    "components-index.json": json(shortIndex(folders)),
    VERSION: `${version}\n`,
    // A vendored copy carries the licence and the notice with it.
    LICENSE: readFileSync(join(root, "LICENSE")),
    NOTICE: readFileSync(join(root, "NOTICE")),
  };
  for (const folder of folders) files[`gallery/${folder.name}.html`] = galleryComponent(folder, modules, themes);
  // Each theme: its stylesheet, its DESIGN.md token block, its tokens as data and what a page's head needs.
  // The Tailwind preset needs nothing per theme, because its values are references to the custom properties.
  for (const theme of themes) {
    files[`themes/${theme.name}.css`] = themeStylesheet(theme);
    files[`themes/${theme.name}.design-tokens.md`] = designTokens(groups, theme.tokens, `Design system, ${theme.name} theme`);
    files[`themes/${theme.name}.tokens.json`] = json(tokenData(groups, theme.tokens));
    files[`themes/${theme.name}.json`] = json(themeSummary(theme));
  }
  for (const name of GALLERY_FILES) files[`gallery/${name}`] = readFileSync(join(root, "gallery", name));
  for (const [name, svg] of Object.entries(icons)) files[`icons/${name}.svg`] = svg;
  for (const name of Object.keys(FONT_SOURCES)) files[`fonts/${name}`] = readFileSync(join(base, "fonts", name));
  // The checker ships as source: it has no dependencies and reads the manifest one directory up.
  for (const name of listFiles(checker).filter((file) => file.endsWith(".mjs"))) {
    files[`checker/${name}`] = readFileSync(join(checker, name));
  }
  files["check-dom.js"] = domBundle(checker, tokens.light[groups.size.column]);
  // The codemod an app runs once over its own source when it moves from 0.5 to the ds prefix.
  files["migrate-prefix.mjs"] = readFileSync(join(root, "scripts", "migrate-prefix.mjs"));
  for (const name of listFiles(join(root, "rules")).filter((file) => file.endsWith(".md"))) {
    files[`rules/${name}`] = readFileSync(join(root, "rules", name));
  }
  // The optional behaviour modules, for an app without a framework.
  for (const name of behaviors) files[`behaviors/${name}`] = readFileSync(join(root, "behaviors", name));
  // The React source an app copies in. It is never bundled or compiled here.
  for (const name of listFiles(join(root, "react"))) files[`react/${name}`] = readFileSync(join(root, "react", name));
  for (const name of listFiles(join(root, "hooks"))) files[`hooks/${name}`] = readFileSync(join(root, "hooks", name));

  rmSync(outDir, { recursive: true, force: true });
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(outDir, name)), { recursive: true });
    writeFileSync(join(outDir, name), content);
  }
  return {
    files: Object.keys(files),
    contrast,
    themes: themes.map(({ name, defaultMode, contrast: rows }) => ({ name, defaultMode, contrast: rows })),
  };
}

// Names of files in distDir that differ from what the sources under root build now.
export function staleFiles({ root = repoRoot, distDir = join(root, "dist") } = {}) {
  const fresh = mkdtempSync(join(tmpdir(), "design-system-build-"));
  try {
    build({ root, outDir: fresh });
    const read = (dir, name) => readFileSync(join(dir, name), { flag: "r" });
    const committed = new Set(listFiles(distDir));
    const built = new Set(listFiles(fresh));
    return [...new Set([...committed, ...built])]
      .filter((name) => !committed.has(name) || !built.has(name) || !read(fresh, name).equals(read(distDir, name)))
      .sort();
  } finally {
    rmSync(fresh, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === "vendor") {
  vendor();
  console.log("Copied fonts and icons into base/");
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { files, contrast, themes } = build();
  for (const row of contrast) {
    console.log(`pass ${row.ratio.toFixed(2)}:1 (${row.kind}, ${row.theme}) ${row.foreground} on ${row.background}`);
  }
  for (const theme of themes) {
    for (const row of theme.contrast) {
      console.log(`pass ${row.ratio.toFixed(2)}:1 (${row.kind}, ${theme.name} ${row.theme}) ${row.foreground} on ${row.background}`);
    }
  }
  console.log(`Wrote ${files.length} files to dist/`);
}

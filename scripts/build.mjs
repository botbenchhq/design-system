// Generates everything in dist/ from tokens/ and base/. Run with `npm run build`.
// `npm run vendor` refreshes the font and icon files under base/ from node_modules.

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const LAYERS = ["gw.reset", "gw.tokens", "gw.base", "gw.components"];

// Longer prefixes first, so --gw-border-width is not read as a colour named "border".
const CATEGORIES = [
  "border-width", "breakpoint", "color", "duration", "ease", "font", "leading",
  "radius", "shadow", "size", "space", "text", "weight", "z",
];

// The bundled stylesheet is tokens.css followed by these, in this order.
const BASE_STYLES = ["reset.css", "typography.css", "layout.css", "focus.css", "fonts.css"];

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

const MINIMUM_CONTRAST = { text: 4.5, ui: 3 };

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

function declarations(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(
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
  const rest = name.slice("--gw-".length);
  const category = CATEGORIES.find((prefix) => rest === prefix || rest.startsWith(`${prefix}-`));
  if (!name.startsWith("--gw-") || !category) throw new Error(`${name} is not in a known token category`);
  return { category, key: rest === category ? "DEFAULT" : rest.slice(category.length + 1) };
}

export function parseTokens(css) {
  const blocks = { ":root": null, '[data-theme="dark"]': null, '[data-theme="auto"]': null };
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    if (!(selector.trim() in blocks)) throw new Error(`Unexpected selector in tokens.css: ${selector.trim()}`);
    blocks[selector.trim()] = Object.fromEntries(declarations(body));
  }
  const light = blocks[":root"];
  const dark = blocks['[data-theme="dark"]'];
  if (JSON.stringify(dark) !== JSON.stringify(blocks['[data-theme="auto"]'])) {
    throw new Error('The [data-theme="dark"] and [data-theme="auto"] blocks must declare the same values');
  }
  validateTheme(css, Object.keys(light));
  for (const [name, value] of [...Object.entries(light), ...Object.entries(dark)]) {
    if (categoryOf(name).category === "color" && !/^#[0-9A-Fa-f]{6}$/.test(value)) {
      throw new Error(`${name} must be six-digit hex, got ${value}`);
    }
  }
  return { light, dark };
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

function checkContrast(tokens, pairs) {
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
        .map((row) => `${row.foreground} on ${row.background} is ${row.ratio.toFixed(2)}:1 in the ${row.theme} theme, below ${row.minimum}:1`)
        .join("\n"),
    );
  }
  return report;
}

// { color: { accent: "--gw-color-accent", … }, … } in source order.
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
  const theme = {
    screens: { md: breakpoint },
    colors: { ...refs("color"), transparent: "transparent", current: "currentColor" },
    spacing,
    borderRadius: { none: "0", ...refs("radius") },
    borderWidth: { DEFAULT: refs("border-width").DEFAULT, 0: "0" },
    fontFamily: refs("font"),
    fontSize: Object.fromEntries(
      Object.keys(groups.text).map((key) => [key, [refs("text")[key], refs("leading")[key]]]),
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
    width: { auto: "auto", ...spacing, touch: size.touch, full: "100%" },
    height: { auto: "auto", ...spacing, touch: size.touch, full: "100%", screen: "100dvh" },
    size: { auto: "auto", ...spacing, touch: size.touch, full: "100%" },
    minWidth: { 0: "0", touch: size.touch, full: "100%" },
    minHeight: { 0: "0", touch: size.touch, full: "100%", screen: "100dvh" },
    maxWidth: { none: "none", column: size.column, transcript: size.transcript, full: "100%" },
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
      ? `[${value.map(() => "string").join(", ")}]`
      : typeof value === "string"
        ? "string"
        : `{ ${Object.entries(value).map(([key, inner]) => `${JSON.stringify(key)}: ${shape(inner)}`).join("; ")} }`;
  const keys = Object.entries(preset.theme).map(([key, value]) => `    ${key}: ${shape(value)};`);
  return `declare const preset: {\n  theme: {\n${keys.join("\n")}\n  };\n};\n\nexport default preset;\n`;
};

const px = (value) => ({ value: parseFloat(value), unit: "px" });

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
      if (name in tokens.dark) token.$extensions = { groundwork: { dark: convert(name, tokens.dark[name]) } };
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
function designTokens(groups, tokens) {
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
      fontWeight: tokens.light[groups.weight.normal],
      lineHeight: tokens.light[groups.leading[key]],
    };
  }
  const block = {
    version: "alpha",
    name: "Groundwork",
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
    breakpoint: tokens.light[groups.breakpoint.DEFAULT],
  };
  return `---\n${yaml(block)}---\n`;
}

function manifest(groups, tokens) {
  const names = {};
  const values = {};
  for (const [category, keys] of Object.entries(groups)) {
    names[category] = Object.values(keys);
    values[category] = [...new Set(names[category].flatMap((name) => [tokens.light[name], tokens.dark[name]]))]
      .filter((value) => value !== undefined);
  }
  return {
    prefix: "gw",
    layers: LAYERS,
    breakpoint: tokens.light[groups.breakpoint.DEFAULT],
    tokens: names,
    values,
    utilities: {
      ...UTILITIES,
      spacingKeys: ["0", ...Object.keys(groups.space)],
      sizeKeys: [...Object.keys(groups.size), "auto", "full", "screen", "none"],
    },
  };
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function symbol(name, svg) {
  const [, root, body] = svg.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  const attributes = [...root.matchAll(/([\w-]+)="([^"]*)"/g)]
    .filter(([, attribute]) => SYMBOL_ATTRIBUTES.includes(attribute))
    .map(([pair]) => pair);
  const shapes = body.trim().split(/\s*\n\s*/).join("");
  return `  <symbol id="gw-icon-${name}" ${attributes.join(" ")}>${shapes}</symbol>\n`;
}

function sprite(icons) {
  const symbols = Object.entries(icons).map(([name, svg]) => symbol(name, svg.toString()));
  return `<!-- Icons from Lucide, ISC License. The notice is in icons/LICENSE. -->\n<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join("")}</svg>\n`;
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
  const contrast = checkContrast(tokens, pairs);
  const groups = groupByCategory(Object.keys(tokens.light));
  const preset = tailwindPreset(groups, tokens.light[groups.breakpoint.DEFAULT]);

  const base = join(root, "base");
  const baseStyles = BASE_STYLES.map((name) => readFileSync(join(base, name), "utf8"));
  const iconNames = JSON.parse(readFileSync(join(base, "icons.json"), "utf8"));
  const icons = Object.fromEntries(iconNames.map((name) => [name, readFileSync(join(base, "icons", `${name}.svg`))]));

  const files = {
    "tokens.css": source,
    "groundwork.css": [source, ...baseStyles].join("\n"),
    "icons.svg": sprite(icons),
    "icons/LICENSE": readFileSync(join(base, "icons", "LICENSE")),
    "tokens.json": json(tokenData(groups, tokens)),
    "tailwind-preset.js": `export default ${JSON.stringify(preset, null, 2)};\n`,
    "tailwind-preset.d.ts": presetTypes(preset),
    "design-tokens.md": designTokens(groups, tokens),
    "manifest.json": json(manifest(groups, tokens)),
  };
  for (const [name, svg] of Object.entries(icons)) files[`icons/${name}.svg`] = svg;
  for (const name of Object.keys(FONT_SOURCES)) files[`fonts/${name}`] = readFileSync(join(base, "fonts", name));

  rmSync(outDir, { recursive: true, force: true });
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(outDir, name)), { recursive: true });
    writeFileSync(join(outDir, name), content);
  }
  return { files: Object.keys(files), contrast };
}

// Names of files in distDir that differ from what the sources under root build now.
export function staleFiles({ root = repoRoot, distDir = join(root, "dist") } = {}) {
  const fresh = mkdtempSync(join(tmpdir(), "groundwork-build-"));
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
  const { files, contrast } = build();
  for (const row of contrast) {
    console.log(`pass ${row.ratio.toFixed(2)}:1 (${row.kind}, ${row.theme}) ${row.foreground} on ${row.background}`);
  }
  console.log(`Wrote ${files.length} files to dist/`);
}

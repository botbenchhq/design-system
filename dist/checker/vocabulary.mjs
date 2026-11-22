// The allowlists every rule reads: the generated manifest, plus token values from the tokens.css beside it.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function loadVocabulary(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const tokensCss = readFileSync(join(dirname(manifestPath), "tokens.css"), "utf8");

  // The first declaration of a name is the default (light) value.
  const tokenValues = new Map();
  for (const [, name, value] of tokensCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    if (!tokenValues.has(name)) tokenValues.set(name, value.trim());
  }

  const { layout, spacing, sizing, variants, spacingKeys, sizeKeys } = manifest.utilities;
  const prefixes = [
    ...layout.prefixes.map((prefix) => ({ prefix, group: "layout" })),
    ...spacing.prefixes.map((prefix) => ({ prefix, group: "spacing" })),
    ...sizing.prefixes.map((prefix) => ({ prefix, group: "sizing" })),
  ].sort((a, b) => b.prefix.length - a.prefix.length);

  return {
    classPrefix: `${manifest.prefix}-`,
    breakpoint: manifest.breakpoint,
    tokens: manifest.tokens,
    tokenNames: new Set(Object.values(manifest.tokens).flat()),
    tokenValues,
    classes: new Set(manifest.classes ?? []),
    utilities: {
      exact: new Set(layout.exact),
      prefixes,
      variants: new Set(variants),
      spacingKeys: new Set(spacingKeys),
      sizingKeys: new Set([...spacingKeys, ...sizeKeys]),
    },
  };
}

function editDistance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, at) => at);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

export function nearestName(name, candidates) {
  let best = null;
  for (const candidate of candidates) {
    const distance = editDistance(name, candidate);
    if (best === null || distance < best.distance) best = { candidate, distance };
  }
  return best === null ? null : best.candidate;
}

// The token in a category whose default value is numerically closest, as a var() reference.
export function nearestNumericToken(vocabulary, category, amount) {
  let best = null;
  for (const name of vocabulary.tokens[category] ?? []) {
    const distance = Math.abs(parseFloat(vocabulary.tokenValues.get(name)) - amount);
    if (!Number.isNaN(distance) && (best === null || distance < best.distance)) best = { name, distance };
  }
  return best === null ? null : `var(${best.name})`;
}

function rgbOf(text) {
  const hex = text.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join("") : hex;
    return [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16));
  }
  const channels = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return channels ? channels.slice(1, 4).map(Number) : null;
}

export function nearestColorToken(vocabulary, text) {
  const target = rgbOf(text);
  if (!target) return null;
  let best = null;
  for (const name of vocabulary.tokens.color ?? []) {
    const rgb = rgbOf(vocabulary.tokenValues.get(name) ?? "");
    if (!rgb) continue;
    const distance = rgb.reduce((sum, channel, at) => sum + (channel - target[at]) ** 2, 0);
    if (best === null || distance < best.distance) best = { name, distance };
  }
  return best === null ? null : `var(${best.name})`;
}

// Class rules: what one class name in markup may be.

import { nearestName } from "./vocabulary.mjs";

const VISUAL_FAMILY =
  /^(?:bg|text|font|border|rounded|shadow|ring|outline|decoration|underline|tracking|leading|opacity|divide|from|via|to|fill|stroke|blur|backdrop|drop-shadow|placeholder|caret|accent|whitespace|break|list|line-clamp|indent|align)(?:-|$)/;
const VISUAL_EXACT = new Set([
  "uppercase", "lowercase", "capitalize", "normal-case", "italic", "not-italic", "overline", "line-through",
  "no-underline", "antialiased", "subpixel-antialiased",
]);

const COMPONENT_FIX = "Use a catalogue component, or declare an app-local component in the gap file.";

// The prefix the system used before 0.6.0. A name that still carries it no longer matches the stylesheet,
// so it is reported until the app has run the codemod over its source.
export const OLD_PREFIX = "gw";
// A class, element, icon id or keyframe name, a data attribute, a custom property or a cascade layer with the old prefix.
export const OLD_NAME = /(?<![\w-])(?:data-|--)?gw-[\w-]+|(?<![\w$.-])gw\.(?:reset|tokens|base|components)\b/g;

export function oldPrefix(name, vocabulary) {
  const renamed = name.replace(/^(data-|--)?gw(?=[-.])/, (_, lead = "") => `${lead}${vocabulary.classPrefix.slice(0, -1)}`);
  return {
    rule: "old-prefix",
    message: `${name} has the prefix from before 0.6.0, so nothing in the system matches it. Run the codemod migrate-prefix.mjs over the app's source.`,
    fix: `Run node <vendored copy>/migrate-prefix.mjs <paths…> from the app's root. The new name is ${renamed}.`,
  };
}

// The findings for every old-prefix name in a piece of text. An app whose own prefix is gw keeps its classes.
export function oldNames(text, vocabulary, appPrefix = null) {
  return [...text.matchAll(OLD_NAME)]
    .filter(([name]) => appPrefix !== OLD_PREFIX || !name.startsWith(`${OLD_PREFIX}-`))
    .map(([name]) => oldPrefix(name, vocabulary));
}

// Findings for a whitespace-separated class list.
//   appLocalFile: the file is a declared app-local component, which may style itself with utilities.
//   only: report these rules and no others.
export function classFindings(classList, { vocabulary, appPrefix, gapClasses, appLocalFile = false, only = null }) {
  const findings = [];
  for (const name of classList.split(/\s+/).filter(Boolean)) {
    for (const finding of classify(name, { vocabulary, appPrefix, gapClasses, appLocalFile })) {
      if (!only || only.includes(finding.rule)) findings.push(finding);
    }
  }
  return findings;
}

export function unknownSystemClass(name, vocabulary) {
  const nearest = nearestName(name, vocabulary.classes);
  return {
    rule: "unknown-class",
    message: `${name} is not a class of the design system.`,
    fix: nearest ? `Did you mean ${nearest}?` : "Use a class listed in the component catalogue.",
  };
}

function classify(name, { vocabulary, appPrefix, gapClasses, appLocalFile }) {
  const { utilities } = vocabulary;
  if (name.includes("[")) {
    return [{ rule: "arbitrary-value", message: `${name} is an arbitrary value.`, fix: "Use a utility on the token scale, or a catalogue component." }];
  }
  const parts = name.split(":");
  const base = parts.pop().replace(/^!/, "").replace(/^-/, "");
  const findings = [];
  if (!appLocalFile) {
    for (const variant of parts) {
      if (!utilities.variants.has(variant)) {
        findings.push({
          rule: "unlisted-variant",
          message: `${name} uses the variant ${variant}:, which screens may not use.`,
          fix: `Screens may use: ${[...utilities.variants].map((allowed) => `${allowed}:`).join(", ")}. States belong to catalogue components.`,
        });
      }
    }
  }

  if (base.startsWith(`${OLD_PREFIX}-`) && appPrefix !== OLD_PREFIX) {
    findings.push(oldPrefix(base, vocabulary));
    return findings;
  }
  if (base.startsWith(vocabulary.classPrefix)) {
    if (!vocabulary.classes.has(base)) findings.push(unknownSystemClass(base, vocabulary));
    return findings;
  }
  if (appPrefix && base.startsWith(`${appPrefix}-`)) {
    if (!gapClasses.has(base)) {
      findings.push({ rule: "undeclared-app-class", message: `${base} is an app-local class that the gap file does not list.`, fix: "Use a catalogue component, or record the gap in the gap file." });
    }
    return findings;
  }
  if (utilities.exact.has(base)) return findings;

  const match = utilities.prefixes.find(({ prefix }) => base.startsWith(prefix));
  if (match) {
    const key = base.slice(match.prefix.length);
    const onScale =
      match.group === "layout" ||
      (match.group === "spacing" && (utilities.spacingKeys.has(key) || (key === "auto" && match.prefix.startsWith("m")))) ||
      (match.group === "sizing" && utilities.sizingKeys.has(key));
    if (!onScale) {
      const keys = match.group === "spacing" ? utilities.spacingKeys : utilities.sizingKeys;
      findings.push({ rule: "off-scale-utility", message: `${name} is not on the ${match.group} scale.`, fix: `${match.prefix} takes: ${[...keys].join(", ")}.` });
    }
    return findings;
  }
  if (appLocalFile) return findings;

  if (VISUAL_FAMILY.test(base) || VISUAL_EXACT.has(base)) {
    findings.push({ rule: "visual-utility", message: `${name} is a visual utility. Screens take colour, borders, radius, shadow and type from catalogue components.`, fix: COMPONENT_FIX });
  } else {
    findings.push({ rule: "unlisted-class", message: `${name} is not a layout, spacing or sizing utility that screens may use.`, fix: COMPONENT_FIX });
  }
  return findings;
}

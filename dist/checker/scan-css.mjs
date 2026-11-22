// Token and property rules on CSS.

import { classFindings } from "./classes.mjs";
import { parseCss } from "./parse-css.mjs";
import { nearestColorToken, nearestNumericToken } from "./vocabulary.mjs";

const NEUTRAL = new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);
const MATH = new Set(["calc", "min", "max", "clamp", "+", "-", "*", "/"]);

const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\([^()]*(?:\([^()]*\)[^()]*)*\)/gi;
const HEX_COLOR = /#[0-9a-f]{3,8}\b/gi;
const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/i;

// Properties whose value is, or may hold, a colour. Named colours are looked for only in these.
const COLOR_PROPERTY =
  /^(?:color|background|background-color|border|border-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?(?:-color)?|border-color|outline|outline-color|fill|stroke|caret-color|accent-color|text-decoration|text-decoration-color|column-rule|column-rule-color)$/;
const NAMED_COLORS = new Set(
  ("black silver gray grey white maroon red purple fuchsia green lime olive yellow navy blue teal aqua orange pink brown " +
    "cyan magenta gold indigo violet crimson coral salmon tomato khaki lavender beige ivory tan turquoise plum orchid " +
    "slategray slategrey dimgray dimgrey lightgray lightgrey darkgray darkgrey gainsboro whitesmoke snow rebeccapurple " +
    "royalblue steelblue skyblue dodgerblue midnightblue darkblue lightblue darkred darkgreen lightgreen seagreen " +
    "forestgreen hotpink deeppink goldenrod chocolate firebrick sienna peru linen").split(" "),
);

const SPACING_PROPERTY =
  /^(?:(?:margin|padding|scroll-margin|scroll-padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|gap|row-gap|column-gap|inset(?:-(?:block|inline)(?:-(?:start|end))?)?|top|right|bottom|left)$/;
const INSET_PROPERTY = /^(?:inset|top|right|bottom|left)/;
const RADIUS_PROPERTY = /^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/;
const DURATION_PROPERTY = /^(?:transition|animation)(?:-duration|-delay)?$/;

// Replaces each var() reference with a placeholder and returns the names used. A fallback stays in the text.
function withoutVars(value) {
  const names = [];
  const rest = value.replace(/var\(\s*(--[\w-]+)\s*(,)?/g, (_, name, comma) => {
    names.push(name);
    return comma ? "(VAR " : "(VAR";
  });
  return { names, rest };
}

const words = (text) => text.split(/[\s,()]+/).filter((word) => word !== "" && word !== "VAR");
const isZero = (word) => /^[-+]?0(?:\.0+)?[a-z%]*$/i.test(word);
const pixels = (word) => {
  const [, amount, unit] = word.match(/^(-?[\d.]+)(px|rem|em)$/i) ?? [];
  return amount === undefined ? null : Math.abs(Number(amount)) * (unit.toLowerCase() === "px" ? 1 : 16);
};

export function scanCss(text, { file, vocabulary, appPrefix, gapClasses, lineOffset = 0 }) {
  const findings = [];
  const add = (line, rule, message, fix) => findings.push({ file, line: line + lineOffset, rule, message, fix });
  const { nodes, error } = parseCss(text);

  for (const node of nodes) {
    if (node.type === "rule") checkSelector(node);
    else if (node.type === "at-rule") checkAtRule(node);
    else if (!node.ancestors.some((prelude) => /^@font-face\b/i.test(prelude))) checkDeclaration(node);
  }
  if (error) add(error.line, "parse-error", `This CSS could not be read: ${error.message}.`, "Fix the syntax. Nothing after this point in the file was checked.");
  return findings;

  function checkSelector({ selector, line }) {
    if (!appPrefix) return;
    for (const [, name] of selector.matchAll(/\.([\w-]+)/g)) {
      if (name.startsWith(`${appPrefix}-`) && !gapClasses.has(name)) {
        add(line, "undeclared-app-class", `${name} is an app-local class that the gap file does not list.`, "Use a catalogue component, or record the gap in the gap file.");
      }
    }
  }

  function checkAtRule({ name, params, line }) {
    if (name === "media") {
      const widths = [
        ...params.matchAll(/\b(?:min-|max-)?(?:device-)?width\s*(?::|[<>]=?|=)\s*([^\s)]+)/gi),
        ...params.matchAll(/([\d.]+[a-z]+)\s*[<>]=?\s*(?:device-)?width\b/gi),
      ];
      for (const [, width] of widths) {
        if (width !== vocabulary.breakpoint) {
          add(line, "off-breakpoint", `A media query uses the width ${width}.`, `The one breakpoint is ${vocabulary.breakpoint}.`);
        }
      }
    }
    if (name === "apply") {
      for (const finding of classFindings(params.replace(/!important\s*$/, ""), { vocabulary, appPrefix, gapClasses, only: ["arbitrary-value"] })) {
        add(line, finding.rule, finding.message, finding.fix);
      }
    }
  }

  function checkDeclaration({ property, value, line }) {
    const bare = property.replace(/^-(?:webkit|moz|ms)-/, "");
    const plain = value
      .replace(/\s*!important\s*$/i, "")
      .replace(/url\([^)]*\)/gi, "url()")
      .replace(/env\([^()]*\)/gi, "(VAR)")
      .replace(/"[^"]*"|'[^']*'/g, '""');

    if (GRADIENT.test(plain)) add(line, "banned-gradient", `${property} uses a gradient.`, "Use a flat colour token. Gradients are not part of the system.");
    if (bare === "backdrop-filter" && !isNeutral(plain, ["none"])) {
      add(line, "banned-backdrop-filter", "backdrop-filter is not part of the system.", "Use an opaque surface colour token.");
    }
    if (bare === "filter" && /\bblur\(/i.test(plain)) add(line, "banned-blur", "filter: blur() is not part of the system.", "Remove the blur.");
    if (bare === "background-clip" && /\btext\b/i.test(plain)) {
      add(line, "banned-background-clip-text", "background-clip: text is not part of the system.", "Set the text colour with a colour token.");
    }
    if (/^(?:mix|background)-blend-mode$/.test(bare) && !isNeutral(plain, ["normal"])) {
      add(line, "banned-blend-mode", `${property} is not part of the system.`, "Remove the blend mode.");
    }

    // A custom property is judged where it is used: a checked property accepts only system tokens.
    if (property.startsWith("--")) return;

    const { names, rest } = withoutVars(plain);
    const category = categoryOf(bare);
    if (category) {
      for (const name of names) {
        if (!vocabulary.tokenNames.has(name)) add(line, category.rule, `${property} uses var(${name}), which is not a system token.`, category.fix);
      }
    }

    if (category?.rule === "raw-shadow") {
      if (!isNeutral(rest, ["none"])) add(line, "raw-shadow", `${property} is written by hand.`, shadowFix());
      return;
    }
    checkColors(property, bare, rest, line);
    if (category?.check) category.check(property, rest, line);
  }

  function isNeutral(text, extra) {
    return words(text).every((word) => NEUTRAL.has(word.toLowerCase()) || extra.includes(word.toLowerCase()));
  }

  function shadowFix() {
    return `Use ${(vocabulary.tokens.shadow ?? []).map((name) => `var(${name})`).join(" or ")}, or none.`;
  }

  function checkColors(property, bare, rest, line) {
    const raw = [...(rest.match(COLOR_FUNCTION) ?? []), ...(rest.replace(COLOR_FUNCTION, "").match(HEX_COLOR) ?? [])];
    if (COLOR_PROPERTY.test(bare)) raw.push(...words(rest).filter((word) => NAMED_COLORS.has(word.toLowerCase())));
    for (const color of raw) {
      const nearest = nearestColorToken(vocabulary, color);
      add(line, "raw-color", `${property} uses the raw colour ${color}.`, nearest ? `Use a colour token. Nearest: ${nearest}` : "Use a var(--gw-color-…) token.");
    }
  }

  function categoryOf(bare) {
    if (COLOR_PROPERTY.test(bare)) return { rule: "raw-color", fix: "Use a var(--gw-color-…) token." };
    if (bare === "box-shadow" || bare === "text-shadow") return { rule: "raw-shadow", fix: shadowFix() };
    if (bare === "font-family" || bare === "font") {
      const fix = `Use ${vocabulary.tokens.font.map((name) => `var(${name})`).join(" or ")}.`;
      return { rule: "raw-font-family", fix, check: (property, rest, line) => {
        if (!isNeutral(rest.replace(/\//g, " "), [])) add(line, "raw-font-family", `${property} names a font outside the tokens.`, fix);
      } };
    }
    if (bare === "font-size") return scaleCategory("off-scale-font-size", "text", "the type scale", false);
    if (SPACING_PROPERTY.test(bare)) return scaleCategory("off-scale-spacing", "space", "the spacing scale", INSET_PROPERTY.test(bare), ["auto"]);
    if (RADIUS_PROPERTY.test(bare)) return scaleCategory("off-scale-radius", "radius", "the radius scale", false);
    if (bare === "z-index") {
      return { rule: "raw-z-index", fix: "Use a var(--gw-z-…) token.", check: (property, rest, line) => {
        for (const word of words(rest)) {
          if (isZero(word) || word === "auto" || NEUTRAL.has(word) || MATH.has(word)) continue;
          const nearest = nearestNumericToken(vocabulary, "z", Number(word));
          add(line, "raw-z-index", `z-index uses ${word}, which is not on the layering scale.`, nearest ? `Use a layering token. Nearest: ${nearest}` : "Use a var(--gw-z-…) token.");
        }
      } };
    }
    if (DURATION_PROPERTY.test(bare)) {
      return { rule: "raw-duration", fix: "Use a var(--gw-duration-…) token.", check: (property, rest, line) => {
        for (const word of words(rest)) {
          const [, amount, unit] = word.match(/^([\d.]+)(m?s)$/i) ?? [];
          if (amount === undefined || Number(amount) === 0) continue;
          const nearest = nearestNumericToken(vocabulary, "duration", Number(amount) * (unit.toLowerCase() === "s" ? 1000 : 1));
          add(line, "raw-duration", `${property} uses ${word}, which is not a duration token.`, nearest ? `Use a duration token. Nearest: ${nearest}` : "Use a var(--gw-duration-…) token.");
        }
      } };
    }
    return null;
  }

  // A property whose lengths must come from one token scale.
  function scaleCategory(rule, tokenCategory, scaleName, allowPercent, keywords = []) {
    const fix = `Use a token from ${scaleName}.`;
    return { rule, fix, check: (property, rest, line) => {
      const inMath = /\b(?:calc|min|max|clamp)\(/.test(rest);
      for (const word of words(rest)) {
        const lower = word.toLowerCase();
        if (isZero(word) || NEUTRAL.has(lower) || keywords.includes(lower) || MATH.has(lower)) continue;
        if (inMath && /^-?[\d.]+$/.test(word)) continue;
        if (allowPercent && /^-?[\d.]+%$/.test(word)) continue;
        const size = pixels(word);
        const nearest = size === null ? null : nearestNumericToken(vocabulary, tokenCategory, size);
        add(line, rule, `${property} uses ${word}, which is not on ${scaleName}.`, nearest ? `${fix} Nearest: ${nearest}` : fix);
      }
    } };
  }
}

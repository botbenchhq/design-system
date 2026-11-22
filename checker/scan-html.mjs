// Class and inline-style rules on static HTML, with its embedded style and script blocks.

import { OLD_PREFIX, classFindings, oldNames } from "./classes.mjs";
import { scanCss } from "./scan-css.mjs";
import { scanScript } from "./scan-script.mjs";

const PIECE = /<!--[\s\S]*?-->|<(style|script)\b([^>]*)>([\s\S]*?)<\/\1\s*>|<[a-zA-Z][^\s/>]*((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTRIBUTE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

export function scanHtml(text, options) {
  const { file, vocabulary } = options;
  const findings = [];
  const lineAt = (index) => text.slice(0, index).split("\n").length;

  for (const match of text.matchAll(PIECE)) {
    const [whole, block, blockAttributes, content, attributes] = match;
    if (whole.startsWith("<!--")) continue;
    if (block) {
      const lineOffset = lineAt(match.index + whole.indexOf(">") + 1) - 1;
      if (block.toLowerCase() === "style") findings.push(...scanCss(content, { ...options, lineOffset }));
      else if (!/\btype\s*=\s*["']?(?:application\/(?:ld\+)?json|importmap)/i.test(blockAttributes)) {
        findings.push(...scanScript(content, { ...options, jsx: false, lineOffset }));
      }
    }
    // An element named with the prefix from before 0.6.0, such as <gw-tabs>.
    const tag = whole.match(/^<([^\s/>]+)/)[1].toLowerCase();
    if (tag.startsWith(`${OLD_PREFIX}-`)) findings.push({ file, line: lineAt(match.index), ...oldNames(tag, vocabulary)[0] });
    const attributesAt = match.index + whole.indexOf(block ? blockAttributes : attributes);
    for (const attribute of (block ? blockAttributes : attributes).matchAll(ATTRIBUTE)) {
      const name = attribute[1].toLowerCase();
      const value = attribute[2] ?? attribute[3] ?? attribute[4] ?? "";
      const line = lineAt(attributesAt + attribute.index);
      // A data attribute, or a link to an icon, with the prefix from before 0.6.0.
      if (name.startsWith(`data-${OLD_PREFIX}-`)) findings.push({ file, line, ...oldNames(name, vocabulary)[0] });
      for (const [icon] of value.matchAll(/#gw-icon-[\w-]+/g)) findings.push({ file, line, ...oldNames(icon.slice(1), vocabulary)[0] });
      if (name === "class") {
        for (const finding of classFindings(value, options)) findings.push({ file, line, ...finding });
      }
      if (name === "style") {
        findings.push({
          file,
          line,
          rule: "inline-style",
          message: "This element has an inline style attribute.",
          fix: "Use a catalogue component or a class. Only a --ds- custom property may be set, and only from script.",
        });
      }
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

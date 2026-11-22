// The structural rules on a static HTML file.

import { parseHtml } from "./parse-html.mjs";
import { runRules } from "./rules/index.mjs";

export function scanStructure(text, { file, appPrefix }) {
  return runRules(parseHtml(text), { appPrefix })
    .map(({ node, ...finding }) => ({ file, line: node.line, ...finding }))
    .sort((a, b) => a.line - b.line);
}

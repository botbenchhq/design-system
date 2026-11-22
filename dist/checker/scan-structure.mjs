// The structural rules on a static HTML file.

import { parseHtml } from "./parse-html.mjs";
import { runRules } from "./rules/index.mjs";

export function scanStructure(text, { file }) {
  return runRules(parseHtml(text))
    .map(({ node, ...finding }) => ({ file, line: node.line, ...finding }))
    .sort((a, b) => a.line - b.line);
}

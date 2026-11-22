// The structural rules on a rendered page. The build bundles this file and the rules into dist/check-dom.js.

import { runRules } from "./rules/index.mjs";

const NOT_CONTENT = ["script", "style", "template"];
const SNIPPET_LENGTH = 160;

// Copies a live element into the tree the rules walk. Attributes are read as they are now,
// so the open attribute of a details or dialog element is its live state.
function adapt(element, parent, readingColumn) {
  const node = {
    tag: element.localName.toLowerCase(),
    attrs: {},
    children: [],
    parent,
    snippet: element.outerHTML.replace(/\s+/g, " ").slice(0, SNIPPET_LENGTH),
    centred: getComputedStyle(element).textAlign === "center",
    wide: element.getBoundingClientRect().width > readingColumn,
  };
  for (const { name, value } of element.attributes) node.attrs[name] = value;
  if (NOT_CONTENT.includes(node.tag)) return node;
  for (const child of element.childNodes) {
    if (child.nodeType === 1) node.children.push(adapt(child, node, readingColumn));
    else if (child.nodeType === 3) node.children.push({ text: child.data, parent: node });
  }
  return node;
}

// Findings as { rule, message, fix, snippet }, where snippet is the start of the element's markup.
// options.appPrefix is the prefix of the app's own classes, which the page itself cannot tell.
export function checkDom(rootElement, readingColumn, options = {}) {
  const root = { tag: "#document", attrs: {}, children: [], parent: null };
  root.children.push(adapt(rootElement, root, readingColumn));
  return runRules(root, options).map(({ node, ...finding }) => ({ ...finding, snippet: node.snippet }));
}

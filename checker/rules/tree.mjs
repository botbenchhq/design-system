// What the structural rules share: the class names they look for and ways to walk the document tree.
// A tree comes from parse-html.mjs for a static page, or from dom-entry.mjs for a rendered one.

export const PRIMARY_CLASS = "gw-button--primary";
export const CARD_CLASS = "gw-card";
export const BADGE_CLASS = "gw-badge";
export const CENTRE_CLASSES = ["text-center", "gw-text-center"];

const ROW_TAGS = ["li", "tr"];
const CONTROL_TAGS = ["button", "a", "input", "select", "textarea"];

export const isElement = (node) => node.tag !== undefined;
export const elements = (node) => node.children.filter(isElement);
export const has = (node, attribute) => node.attrs[attribute] !== undefined;
export const classesOf = (node) => (node.attrs.class ?? "").split(/\s+/).filter(Boolean);
export const hasClass = (node, name) => classesOf(node).includes(name);
export const isRow = (node) => ROW_TAGS.includes(node.tag);
export const isControl = (node) => CONTROL_TAGS.includes(node.tag) || node.attrs.role === "button";

export function* descendants(node) {
  for (const child of elements(node)) {
    yield child;
    yield* descendants(child);
  }
}

// Nearest first, ending with the document.
export function ancestors(node) {
  const found = [];
  for (let parent = node.parent; parent; parent = parent.parent) found.push(parent);
  return found;
}

export function textOf(node) {
  return node.text ?? node.children.map(textOf).join("");
}

// The name a control is known by: its label attribute, or else its text.
export function nameOf(node) {
  const name = node.attrs["aria-label"] ?? (textOf(node).trim() || node.attrs.value || node.attrs.title || "");
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

// A dialog or popover is a view of its own, open or not. Everything else belongs to the document.
const isViewRoot = (node) => node.tag === "dialog" || has(node, "popover") || node.attrs.role === "dialog" || node.parent === null;

export const viewOf = (node) => [node, ...ancestors(node)].find(isViewRoot);

// Each view's elements in document order, keyed by the view's root.
export function views(root) {
  const byRoot = new Map([[root, []]]);
  for (const node of descendants(root)) {
    const view = viewOf(node);
    if (!byRoot.has(view)) byRoot.set(view, []);
    byRoot.get(view).push(node);
  }
  return byRoot;
}

const signature = (node) => [node.tag, ...classesOf(node).sort()].join(".");

// A node's tag and classes, with those of everything inside it, in order.
export const structure = (node) => `${signature(node)}(${elements(node).map(structure).join(",")})`;

// One of two or more list or table rows, or of sibling elements with the same classes and the same structure.
export function isRepeatedItem(node) {
  if (!node.parent) return false;
  const siblings = elements(node.parent).filter((sibling) => sibling !== node);
  if (isRow(node)) return siblings.some((sibling) => sibling.tag === node.tag);
  return classesOf(node).length > 0 && siblings.some((sibling) => structure(sibling) === structure(node));
}

// Whether a node sits inside a repeated item of its own view.
export function inRepeatedItem(node) {
  const view = viewOf(node);
  const upToView = ancestors(node);
  return upToView.slice(0, upToView.indexOf(view)).some(isRepeatedItem);
}

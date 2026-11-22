// A small, tolerant HTML reader. It turns a page into the tree the structural rules walk:
//   element: { tag, attrs, children, parent, line }    text: { text, parent }
// The root is an element with the tag "#document".

const PIECE = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\/([a-zA-Z][^\s/>]*)[^>]*>|<([a-zA-Z][^\s/>]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTRIBUTE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW_TEXT = new Set(["script", "style"]);

// An opening tag on the left ends any open element on the right, as a browser does for omitted end tags.
const ENDS = {
  li: ["li"], dt: ["dt", "dd"], dd: ["dt", "dd"], option: ["option"],
  td: ["td", "th"], th: ["td", "th"], tr: ["tr", "td", "th"],
  tbody: ["thead", "tbody", "tr", "td", "th"], tfoot: ["thead", "tbody", "tr", "td", "th"],
};
const ENDS_SCOPE = new Set(["ul", "ol", "dl", "table", "select"]);
const ENDS_PARAGRAPH = new Set([
  "address", "article", "aside", "blockquote", "details", "div", "dl", "fieldset", "figure", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul",
]);
const FOREIGN = new Set(["svg", "math"]);

// The common named references. Any other is left as written.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
  rarr: "\u2192", larr: "\u2190", raquo: "\u00bb", laquo: "\u00ab", hellip: "\u2026", mdash: "\u2014", ndash: "\u2013",
};

function decode(text) {
  return text.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi, (whole, hex, decimal, name) => {
    if (name) return NAMED[name] ?? whole;
    const code = hex ? parseInt(hex, 16) : Number(decimal);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

export function parseHtml(source) {
  const root = { tag: "#document", attrs: {}, children: [], parent: null, line: 1 };
  let current = root;
  let line = 1;
  let at = 0;
  const advance = (to) => {
    for (let index = at; index < to; index++) if (source.charCodeAt(index) === 10) line++;
    at = to;
  };
  const addText = (to) => {
    if (to > at) current.children.push({ text: decode(source.slice(at, to)), parent: current });
  };
  const closeTo = (node) => {
    current = node.parent;
  };
  const openAncestors = function* () {
    for (let node = current; node !== root; node = node.parent) yield node;
  };

  PIECE.lastIndex = 0;
  for (let match; (match = PIECE.exec(source)); ) {
    addText(match.index);
    advance(match.index);
    const [whole, closing, opening, attributeText] = match;

    if (closing) {
      const tag = closing.toLowerCase();
      for (const node of openAncestors()) {
        if (node.tag === tag) {
          closeTo(node);
          break;
        }
      }
    } else if (opening) {
      const tag = opening.toLowerCase();
      if (current.tag === "p" && ENDS_PARAGRAPH.has(tag)) closeTo(current);
      if (ENDS[tag]) {
        let outermost = null;
        for (const node of openAncestors()) {
          if (ENDS_SCOPE.has(node.tag)) break;
          if (ENDS[tag].includes(node.tag)) outermost = node;
        }
        if (outermost) closeTo(outermost);
      }
      const attrs = {};
      for (const [, name, double, single, bare] of attributeText.matchAll(ATTRIBUTE)) {
        attrs[name.toLowerCase()] ??= decode(double ?? single ?? bare ?? "");
      }
      const node = { tag, attrs, children: [], parent: current, line };
      current.children.push(node);
      const foreign = FOREIGN.has(tag) || [...openAncestors()].some((ancestor) => FOREIGN.has(ancestor.tag));
      const selfClosed = VOID.has(tag) || (foreign && attributeText.trimEnd().endsWith("/"));
      if (RAW_TEXT.has(tag)) {
        // The content of a script or style block is not markup. Skip to its end tag.
        const end = new RegExp(`</${tag}\\s*>`, "gi");
        end.lastIndex = match.index + whole.length;
        const found = end.exec(source);
        PIECE.lastIndex = found ? found.index + found[0].length : source.length;
      } else if (!selfClosed) {
        current = node;
      }
    }
    advance(PIECE.lastIndex);
  }
  addText(source.length);
  return root;
}

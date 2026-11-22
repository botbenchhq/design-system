// A reader for JavaScript, TypeScript and JSX: enough to tell strings, template literals,
// comments, regular expressions and element attributes apart. It does not build a syntax tree.
//
// Tokens:
//   { type: "str", value, line }
//   { type: "tpl", quasis: [{ value, line }], exprs: [tokens], line }
//   { type: "id" | "num" | "regex" | "p", value, line }        ("p" is punctuation)
//   { type: "jsx", name, attrs: [{ name, line, value }], line } value is null, { str, line } or { expr: tokens }
//   { type: "jsx-expr", tokens, line }                          a {…} among an element's children

export class ScriptSyntaxError extends Error {
  constructor(message, line) {
    super(message);
    this.line = line;
  }
}

const PUNCTUATION = [
  "...", "===", "!==", "&&=", "||=", "??=", "=>", "==", "!=", "<=", ">=", "&&", "||", "??", "?.", "++", "--", "+=", "-=", "*=", "/=",
];
// After one of these words an expression starts, so `<` opens an element and `/` a regular expression.
const BEFORE_EXPRESSION = new Set(["return", "case", "yield", "else", "do", "default", "typeof", "void", "delete", "in", "of", "await", "throw"]);

const isIdentStart = (char) => /[A-Za-z_$]/.test(char ?? "");

export function lexScript(source, { jsx }) {
  const length = source.length;
  let i = 0;

  const lineStarts = [0];
  for (let at = 0; at < length; at++) if (source[at] === "\n") lineStarts.push(at + 1);
  const lineAt = (index) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle] <= index) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };
  const fail = (message, at) => {
    throw new ScriptSyntaxError(message, lineAt(Math.min(at, length - 1)));
  };
  const skipSpace = () => {
    while (i < length && /\s/.test(source[i])) i++;
  };

  function readString() {
    const start = i;
    const quote = source[i];
    for (i++; source[i] !== quote; i++) {
      if (i >= length || source[i] === "\n") fail("A string is never closed", start);
      if (source[i] === "\\") i++;
    }
    i++;
    return { type: "str", value: source.slice(start + 1, i - 1), line: lineAt(start) };
  }

  function readTemplate() {
    const start = i;
    const quasis = [];
    const exprs = [];
    let from = ++i;
    for (;;) {
      if (i >= length) fail("A template literal is never closed", start);
      if (source[i] === "\\") {
        i += 2;
      } else if (source[i] === "`") {
        quasis.push({ value: source.slice(from, i), line: lineAt(from) });
        i++;
        return { type: "tpl", quasis, exprs, line: lineAt(start) };
      } else if (source[i] === "$" && source[i + 1] === "{") {
        quasis.push({ value: source.slice(from, i), line: lineAt(from) });
        i += 2;
        exprs.push(readCode(true));
        from = i;
      } else {
        i++;
      }
    }
  }

  function readRegex() {
    const start = i;
    let inClass = false;
    for (i++; inClass || source[i] !== "/"; i++) {
      if (i >= length || source[i] === "\n") fail("A regular expression is never closed", start);
      if (source[i] === "\\") i++;
      else if (source[i] === "[") inClass = true;
      else if (source[i] === "]") inClass = false;
    }
    i++;
    while (/[a-z]/.test(source[i] ?? "")) i++;
    return { type: "regex", value: source.slice(start, i), line: lineAt(start) };
  }

  function expressionStarts(tokens) {
    const last = tokens.at(-1);
    if (!last) return true;
    if (last.type === "p") return ![")", "]", "}"].includes(last.value);
    return last.type === "id" && BEFORE_EXPRESSION.has(last.value);
  }

  // `<T,>(…)`, `<T extends …>` and `<T>(…)` with no closing tag are type parameters, not elements.
  function elementStarts() {
    const rest = source.slice(i, i + 200);
    if (/^<>/.test(rest)) return true;
    const name = rest.match(/^<([A-Za-z_$][\w$.:-]*)/)?.[1];
    if (!name) return false;
    const after = rest.slice(name.length + 1);
    if (/^\s*(?:,|extends\b)/.test(after)) return false;
    if (/^\s*>\s*\(/.test(after)) return source.includes(`</${name}>`, i);
    return true;
  }

  function readElement(out) {
    const start = i;
    i++;
    const name = source.slice(i).match(/^[\w$.:-]*/)[0];
    i += name.length;
    const attrs = [];
    for (;;) {
      skipSpace();
      if (i >= length) fail(`The tag <${name}> is never closed`, start);
      if (source[i] === "/" && source[i + 1] === ">") {
        i += 2;
        out.push({ type: "jsx", name, attrs, line: lineAt(start) });
        return;
      }
      if (source[i] === ">") {
        i++;
        break;
      }
      const line = lineAt(i);
      if (source[i] === "{") {
        i++;
        attrs.push({ name: "...", line, value: { expr: readCode(true) } });
        continue;
      }
      const attr = source.slice(i).match(/^[\w$:-]+/)?.[0];
      if (!attr) fail(`Unexpected "${source[i]}" in the tag <${name}>`, i);
      i += attr.length;
      skipSpace();
      let value = null;
      if (source[i] === "=") {
        i++;
        skipSpace();
        if (source[i] === '"' || source[i] === "'") {
          const end = source.indexOf(source[i], i + 1);
          if (end === -1) fail("An attribute value is never closed", i);
          value = { str: source.slice(i + 1, end), line: lineAt(i) };
          i = end + 1;
        } else if (source[i] === "{") {
          i++;
          value = { expr: readCode(true) };
        } else {
          fail(`The attribute ${attr} has no value`, i);
        }
      }
      attrs.push({ name: attr, line, value });
    }
    out.push({ type: "jsx", name, attrs, line: lineAt(start) });

    // Children: text is skipped, so a quote or apostrophe in it starts nothing.
    for (;;) {
      if (i >= length) fail(`The element <${name}> is never closed`, start);
      if (source[i] === "{") {
        const line = lineAt(i);
        i++;
        out.push({ type: "jsx-expr", tokens: readCode(true), line });
      } else if (source[i] === "<" && source[i + 1] === "/") {
        const end = source.indexOf(">", i);
        if (end === -1) fail(`The element <${name}> is never closed`, start);
        i = end + 1;
        return;
      } else if (source[i] === "<") {
        readElement(out);
      } else {
        i++;
      }
    }
  }

  // Reads code up to the end of the file, or up to the brace that closes an embedded expression.
  function readCode(embedded) {
    const out = [];
    const start = i;
    let depth = 0;
    while (i < length) {
      const char = source[i];
      if (/\s/.test(char)) {
        i++;
      } else if (char === "/" && source[i + 1] === "/") {
        while (i < length && source[i] !== "\n") i++;
      } else if (char === "/" && source[i + 1] === "*") {
        const end = source.indexOf("*/", i + 2);
        if (end === -1) fail("A comment is never closed", i);
        i = end + 2;
      } else if (char === '"' || char === "'") {
        out.push(readString());
      } else if (char === "`") {
        out.push(readTemplate());
      } else if (isIdentStart(char)) {
        const word = source.slice(i).match(/^[\w$]+/)[0];
        out.push({ type: "id", value: word, line: lineAt(i) });
        i += word.length;
      } else if (/[0-9]/.test(char)) {
        const number = source.slice(i).match(/^[\w.]+/)[0];
        out.push({ type: "num", value: number, line: lineAt(i) });
        i += number.length;
      } else if (char === "/" && expressionStarts(out)) {
        out.push(readRegex());
      } else if (char === "<" && jsx && expressionStarts(out) && elementStarts()) {
        readElement(out);
      } else {
        if (char === "{") depth++;
        if (char === "}") {
          if (depth === 0 && embedded) {
            i++;
            return out;
          }
          depth--;
        }
        const value = PUNCTUATION.find((operator) => source.startsWith(operator, i)) ?? char;
        out.push({ type: "p", value, line: lineAt(i) });
        i += value.length;
      }
    }
    if (embedded) fail("A brace is never closed", start);
    return out;
  }

  return readCode(false);
}

// Every token list in a file: the top level and each embedded expression.
export function* tokenLists(tokens) {
  yield tokens;
  for (const token of tokens) {
    if (token.type === "tpl") for (const expr of token.exprs) yield* tokenLists(expr);
    if (token.type === "jsx-expr") yield* tokenLists(token.tokens);
    if (token.type === "jsx") for (const attr of token.attrs) if (attr.value?.expr) yield* tokenLists(attr.value.expr);
  }
}

// A small CSS reader: enough structure to know each declaration, at-rule and selector and its line.

export class CssSyntaxError extends Error {
  constructor(message, line) {
    super(message);
    this.line = line;
  }
}

// Returns { nodes, error }. Nodes read before a syntax error are still returned.
//   { type: "declaration", property, value, line, ancestors }
//   { type: "at-rule", name, params, line, ancestors }
//   { type: "rule", selector, line, ancestors }
// `ancestors` is the list of enclosing block preludes, outermost first.
export function parseCss(text) {
  const nodes = [];
  try {
    read(text, nodes);
    return { nodes, error: null };
  } catch (error) {
    if (!(error instanceof CssSyntaxError)) throw error;
    return { nodes, error };
  }
}

function read(text, nodes) {
  const open = [];
  let line = 1;
  let buffer = "";
  let bufferLine = 1;
  let parens = 0;

  const ancestors = () => open.map((block) => block.prelude);
  const add = (char) => {
    if (buffer === "" && /\s/.test(char)) return;
    if (buffer === "") bufferLine = line;
    buffer += char;
  };
  const atRule = (statement) => {
    const [, name, params] = statement.match(/^@([\w-]+)\s*([\s\S]*)$/) ?? [];
    if (!name) throw new CssSyntaxError(`"${statement}" is not an at-rule`, bufferLine);
    nodes.push({ type: "at-rule", name: name.toLowerCase(), params: params.trim(), line: bufferLine, ancestors: ancestors() });
  };
  const endStatement = () => {
    const statement = buffer.trim();
    buffer = "";
    if (statement === "") return;
    if (statement.startsWith("@")) return atRule(statement);
    const [, property, value] = statement.match(/^((?:[\w-]|\\.)+)\s*:\s*([\s\S]*)$/) ?? [];
    if (!property || open.length === 0) {
      throw new CssSyntaxError(`Expected "property: value" but found "${statement.split("\n")[0]}"`, bufferLine);
    }
    nodes.push({ type: "declaration", property: property.toLowerCase(), value: value.trim(), line: bufferLine, ancestors: ancestors() });
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      if (end === -1) throw new CssSyntaxError("A comment is never closed", line);
      line += text.slice(i, end).split("\n").length - 1;
      i = end + 1;
    } else if (char === '"' || char === "'") {
      const start = i;
      for (i++; text[i] !== char; i++) {
        if (i >= text.length || text[i] === "\n") throw new CssSyntaxError("A string is never closed", line);
        if (text[i] === "\\") i++;
      }
      add(text.slice(start, i + 1));
    } else if (char === "(") {
      parens++;
      add(char);
    } else if (char === ")") {
      parens--;
      add(char);
    } else if (parens > 0) {
      // Inside url() and the like, braces and semicolons are plain text.
      if ((char === "{" || char === "}") && !/url\([^)]*$/i.test(buffer)) {
        throw new CssSyntaxError("A parenthesis is never closed", bufferLine);
      }
      add(char);
    } else if (char === "{") {
      const prelude = buffer.trim().replace(/\s+/g, " ");
      if (prelude === "") throw new CssSyntaxError("A block has no selector", line);
      if (prelude.startsWith("@")) atRule(prelude);
      else nodes.push({ type: "rule", selector: prelude, line: bufferLine, ancestors: ancestors() });
      open.push({ prelude, line: bufferLine });
      buffer = "";
    } else if (char === "}") {
      endStatement();
      if (open.length === 0) throw new CssSyntaxError("A closing brace matches no block", line);
      open.pop();
    } else if (char === ";") {
      endStatement();
    } else {
      add(char);
    }
    if (char === "\n") line++;
  }
  if (parens > 0) throw new CssSyntaxError("A parenthesis is never closed", bufferLine);
  if (buffer.trim() !== "") throw new CssSyntaxError(`Unexpected "${buffer.trim().split("\n")[0]}" at the end of the file`, bufferLine);
  if (open.length > 0) throw new CssSyntaxError(`The block "${open.at(-1).prelude}" is never closed`, open.at(-1).line);
}

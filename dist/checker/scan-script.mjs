// Class and inline-style rules on JavaScript, TypeScript and JSX.

import { OLD_PREFIX, classFindings, oldNames, unknownSystemClass } from "./classes.mjs";
import { ScriptSyntaxError, lexScript, tokenLists } from "./lex-script.mjs";

// Functions whose arguments are class names.
const CLASS_HELPERS = new Set(["clsx", "cn", "cx", "classNames", "classnames", "twMerge", "twJoin", "cva"]);
const CLASS_LIST_METHODS = new Set(["add", "remove", "toggle", "replace", "contains"]);
const COMPARISON = new Set(["===", "!==", "==", "!="]);
const CONDITION = new Set([...COMPARISON, "&&", "?", "<", ">", "<=", ">="]);
const STATEMENT_START = new Set(["const", "let", "var", "function", "export", "import", "return", "if", "for", "while", "class", "type", "interface"]);
const CLOSER = { "(": ")", "[": "]", "{": "}" };

const INLINE_STYLE_FIX = "Use a catalogue component or a class. Only a --ds- custom property may be set from script.";

const isPunct = (token, value) => token?.type === "p" && token.value === value;

// The index just past the bracket that closes the one opening at `from`.
function groupEnd(tokens, from) {
  const open = tokens[from].value;
  let depth = 0;
  for (let at = from; at < tokens.length; at++) {
    if (isPunct(tokens[at], open)) depth++;
    if (isPunct(tokens[at], CLOSER[open]) && --depth === 0) return at + 1;
  }
  return tokens.length;
}

export function scanScript(text, { file, jsx, vocabulary, appPrefix, gapClasses, appLocalFile, lineOffset = 0 }) {
  const findings = [];
  const add = (line, { rule, message, fix }) => findings.push({ file, line: line + lineOffset, rule, message, fix });
  const classOptions = { vocabulary, appPrefix, gapClasses, appLocalFile };
  // A system name after "#" is the fragment of a link to the icon sprite, such as icons.svg#ds-icon-check, not a class.
  const systemClass = new RegExp(`(?<![\\w-])(?!(?<=#)${vocabulary.classPrefix}icon-)${vocabulary.classPrefix}[\\w-]*`, "g");
  // A custom property the app may set inline: a system one, or one with the old prefix, which is reported as old-prefix instead.
  const settable = (name) => name.startsWith(`--${vocabulary.classPrefix}`) || name.startsWith(`--${OLD_PREFIX}-`);
  const addOld = (line, text) => {
    for (const finding of oldNames(text, vocabulary, appPrefix)) add(line, finding);
  };

  let tokens;
  try {
    tokens = lexScript(text, { jsx });
  } catch (error) {
    if (!(error instanceof ScriptSyntaxError)) throw error;
    add(error.line, { rule: "parse-error", message: `This file could not be read: ${error.message}.`, fix: "Fix the syntax. Nothing in this file was checked." });
    return findings;
  }
  const lists = [...tokenLists(tokens)];
  const resolved = new Set();
  // Strings and templates already read as class lists, so no token is reported twice.
  const readAsClasses = new WeakSet();

  for (const list of lists) {
    list.forEach((token, at) => {
      const previous = list[at - 1];
      const next = list[at + 1];
      if (token.type === "jsx") element(token);
      if (token.type !== "id") return;

      if (CLASS_HELPERS.has(token.value) && isPunct(next, "(") && !isPunct(previous, ".")) {
        classExpression(list.slice(at + 2, groupEnd(list, at + 1) - 1), { keysAreClasses: true });
      }
      if (token.value === "className" && isPunct(previous, ".") && isPunct(next, "=")) {
        classExpression(statementFrom(list, at + 2), {});
      }
      if (token.value === "classList" && isPunct(next, ".") && CLASS_LIST_METHODS.has(list[at + 2]?.value) && isPunct(list[at + 3], "(")) {
        classExpression(list.slice(at + 4, groupEnd(list, at + 3) - 1), {});
      }
      if (token.value === "style" && isPunct(previous, ".")) styleFromScript(list, at);
      if (token.value === "setAttribute" && isPunct(next, "(") && list[at + 2]?.type === "str" && list[at + 2].value === "style") {
        add(token.line, { rule: "inline-style", message: "This sets a style attribute from script.", fix: INLINE_STYLE_FIX });
      }
    });
  }
  for (const list of lists) {
    list.forEach((token, at) => {
      if (readAsClasses.has(token)) return;
      if (token.type === "str") looseString(token, list[at + 1]);
      if (token.type === "tpl") template(token, false);
    });
  }
  return findings.sort((a, b) => a.line - b.line);

  // A string anywhere may hold a system class: in a selector, a constant or a class list.
  function looseString(token, next) {
    addOld(token.line, token.value);
    for (const [name] of token.value.matchAll(systemClass)) {
      if (token.value.endsWith(name) && isPunct(next, "+")) {
        add(token.line, dynamicClass(`"${name}" + …`));
      } else if (!vocabulary.classes.has(name)) {
        add(token.line, unknownSystemClass(name, vocabulary));
      }
    }
  }

  function dynamicClass(shown) {
    return {
      rule: "dynamic-class",
      message: `${shown} builds a system class name at run time, so it cannot be checked.`,
      fix: "Write each class name in full, for example in a lookup table from value to class.",
    };
  }

  // The words of a template literal. A word touching an interpolation is a class built at run time.
  function template(token, asClasses) {
    token.quasis.forEach((quasi, at) => {
      for (const match of quasi.value.matchAll(/\S+/g)) {
        const word = match[0];
        const line = quasi.line + quasi.value.slice(0, match.index).split("\n").length - 1;
        const touchesBefore = at > 0 && match.index === 0;
        const touchesAfter = at < token.quasis.length - 1 && match.index + word.length === quasi.value.length;
        if (touchesBefore || touchesAfter) {
          systemClass.lastIndex = 0;
          if (systemClass.test(word)) add(line, dynamicClass(`${touchesBefore ? "${…}" : ""}${word}${touchesAfter ? "${…}" : ""}`));
        } else if (asClasses) {
          for (const finding of classFindings(word, classOptions)) add(line, finding);
        } else {
          addOld(line, word);
          for (const [name] of word.matchAll(systemClass)) {
            if (!vocabulary.classes.has(name)) add(line, unknownSystemClass(name, vocabulary));
          }
        }
      }
    });
    if (asClasses) for (const expr of token.exprs) classExpression(expr, {});
  }

  function element(token) {
    if (token.name?.startsWith(`${OLD_PREFIX}-`)) addOld(token.line, token.name);
    for (const attr of token.attrs) {
      if (attr.name.startsWith(`data-${OLD_PREFIX}-`)) addOld(attr.line, attr.name);
      if (attr.value?.str !== undefined && attr.name !== "className" && attr.name !== "class") addOld(attr.value.line, attr.value.str);
      if (attr.name === "className" || attr.name === "class") {
        if (attr.value?.str !== undefined) classList(attr.value.str, attr.value.line);
        else if (attr.value?.expr) classExpression(attr.value.expr, {});
      }
      if (attr.name === "style" && !setsOnlySystemProperties(attr.value?.expr)) {
        add(attr.line, { rule: "inline-style", message: "This element has an inline style.", fix: INLINE_STYLE_FIX });
      }
    }
  }

  // True for style={{ "--ds-progress": value }}: an object literal whose every key is a system custom property.
  function setsOnlySystemProperties(expr) {
    if (!expr || !isPunct(expr[0], "{")) return false;
    const end = groupEnd(expr, 0) - 1;
    let depth = 0;
    let keys = 0;
    for (let at = 1; at < end; at++) {
      const token = expr[at];
      if (token.type === "p" && token.value in CLOSER) depth++;
      if (token.type === "p" && Object.values(CLOSER).includes(token.value)) depth--;
      const startsEntry = depth === 0 && (at === 1 || isPunct(expr[at - 1], ","));
      if (!startsEntry) continue;
      if (token.type !== "str" || !settable(token.value) || !isPunct(expr[at + 1], ":")) return false;
      keys++;
    }
    return keys > 0;
  }

  function styleFromScript(list, at) {
    const line = list[at].line;
    const member = isPunct(list[at + 1], ".") ? list[at + 2] : null;
    if (member?.value === "setProperty" && isPunct(list[at + 3], "(")) {
      const name = list[at + 4];
      if (name?.type !== "str" || !settable(name.value)) {
        add(line, { rule: "inline-style", message: "This sets an inline style from script.", fix: INLINE_STYLE_FIX });
      }
    } else if (isPunct(list[at + 1], "=") || (member && isPunct(list[at + 3], "="))) {
      add(line, { rule: "inline-style", message: "This sets an inline style from script.", fix: INLINE_STYLE_FIX });
    }
  }

  // A class string joined to something with + ends in a class name built at run time.
  function classString(token, next) {
    const built = isPunct(next, "+") ? token.value.match(/\S+$/)?.[0] : undefined;
    systemClass.lastIndex = 0;
    if (built && systemClass.test(built)) {
      add(token.line, dynamicClass(`"${built}" + …`));
      classList(token.value.slice(0, -built.length), token.line);
    } else {
      classList(token.value, token.line);
    }
  }

  // The index of the comma or bracket that ends the object entry whose key is at `from`.
  function entryEnd(expr, from) {
    let depth = 0;
    for (let at = from; at < expr.length; at++) {
      const token = expr[at];
      if (token.type !== "p") continue;
      if (token.value in CLOSER) depth++;
      if (Object.values(CLOSER).includes(token.value) && --depth < 0) return at;
      if (depth === 0 && token.value === ",") return at;
    }
    return expr.length;
  }

  function classList(text, line) {
    text.split("\n").forEach((part, at) => {
      for (const finding of classFindings(part, classOptions)) add(line + at, finding);
    });
  }

  // The tokens of a statement's right-hand side, up to its semicolon or the start of the next statement.
  function statementFrom(list, from) {
    let depth = 0;
    for (let at = from; at < list.length; at++) {
      const token = list[at];
      if (token.type === "p" && token.value in CLOSER) depth++;
      if (token.type === "p" && Object.values(CLOSER).includes(token.value) && --depth < 0) return list.slice(from, at);
      if (depth > 0) continue;
      if (isPunct(token, ";")) return list.slice(from, at);
      if (at > from && token.type === "id" && STATEMENT_START.has(token.value) && token.line > list[at - 1].line) return list.slice(from, at);
    }
    return list.slice(from);
  }

  // An expression that yields class names: every string in it is a class list, except the ones that
  // are compared against, used as an index, or passed to a function that is not a class helper.
  function classExpression(expr, { keysAreClasses = false }) {
    for (let at = 0; at < expr.length; at++) {
      const token = expr[at];
      const previous = expr[at - 1];
      const next = expr[at + 1];
      const isKey = isPunct(next, ":") && (isPunct(previous, "{") || isPunct(previous, ","));
      if (token.type === "tpl") {
        if (!readAsClasses.has(token)) template(token, true);
        readAsClasses.add(token);
      } else if (token.type === "str") {
        const compared = COMPARISON.has(previous?.value) || COMPARISON.has(next?.value);
        if (!compared && !(isKey && !keysAreClasses) && !readAsClasses.has(token)) {
          readAsClasses.add(token);
          classString(token, next);
        }
        if (isKey && keysAreClasses) at = entryEnd(expr, at) - 1;
      } else if (token.type === "id") {
        if (isPunct(previous, ".")) {
          // A method call such as .join(" ") or .filter(Boolean): its arguments are not classes.
          if (isPunct(next, "(")) at = groupEnd(expr, at + 1) - 1;
          continue;
        }
        if (isKey) {
          if (keysAreClasses && !readAsClasses.has(token)) {
            readAsClasses.add(token);
            classList(token.value, token.line);
            at = entryEnd(expr, at) - 1;
          }
          continue;
        }
        if (isPunct(next, "(")) {
          const end = groupEnd(expr, at + 1);
          if (CLASS_HELPERS.has(token.value)) classExpression(expr.slice(at + 2, end - 1), { keysAreClasses: true });
          at = end - 1;
          continue;
        }
        // A name that is tested, not used as a value, holds no classes.
        const tested = CONDITION.has(next?.value) || COMPARISON.has(previous?.value) || isPunct(previous, "!");
        if (!tested) resolve(token.value);
        if (isPunct(next, "[")) at = groupEnd(expr, at + 1) - 1;
      }
    }
  }

  // Class strings are often held in a constant in the same file. Read the constant's value as classes too.
  function resolve(name) {
    if (resolved.has(name)) return;
    resolved.add(name);
    for (const list of lists) {
      list.forEach((token, at) => {
        if (token.type !== "id" || token.value !== name || !["const", "let", "var"].includes(list[at - 1]?.value)) return;
        let equals = at + 1;
        let depth = 0;
        for (; equals < list.length; equals++) {
          const current = list[equals];
          if (current.type === "p" && (current.value in CLOSER || current.value === "<")) depth++;
          if (current.type === "p" && (Object.values(CLOSER).includes(current.value) || current.value === ">")) depth--;
          if (depth === 0 && (isPunct(current, "=") || isPunct(current, ";"))) break;
        }
        if (isPunct(list[equals], "=")) classExpression(statementFrom(list, equals + 1), {});
      });
    }
  }
}

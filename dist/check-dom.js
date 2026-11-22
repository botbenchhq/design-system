// Generated from checker/. Defines dsCheckDom(root, { appPrefix }), which returns the structural findings of the rendered page.
(() => {
"use strict";
// rules/stock-phrases.mjs
// Calls to action that read as filler when repeated. Lower case, no punctuation.

const STOCK_PHRASES = [
  "get started",
  "learn more",
  "sign up free",
  "try it free",
  "start free trial",
  "book a demo",
  "explore now",
  "discover more",
];

// rules/tree.mjs
// What the structural rules share: the class names they look for and ways to walk the document tree.
// A tree comes from parse-html.mjs for a static page, or from dom-entry.mjs for a rendered one.

const PRIMARY_CLASS = "ds-button--primary";
const CARD_CLASS = "ds-card";
const BADGE_CLASS = "ds-badge";
const CENTRE_CLASSES = ["text-center", "ds-text-center"];

const ROW_TAGS = ["li", "tr"];
const CONTROL_TAGS = ["button", "a", "input", "select", "textarea"];

const isElement = (node) => node.tag !== undefined;
const elements = (node) => node.children.filter(isElement);
const has = (node, attribute) => node.attrs[attribute] !== undefined;
const classesOf = (node) => (node.attrs.class ?? "").split(/\s+/).filter(Boolean);
const hasClass = (node, name) => classesOf(node).includes(name);
const isRow = (node) => ROW_TAGS.includes(node.tag);
const isControl = (node) => CONTROL_TAGS.includes(node.tag) || node.attrs.role === "button";

function* descendants(node) {
  for (const child of elements(node)) {
    yield child;
    yield* descendants(child);
  }
}

// Nearest first, ending with the document.
function ancestors(node) {
  const found = [];
  for (let parent = node.parent; parent; parent = parent.parent) found.push(parent);
  return found;
}

function textOf(node) {
  return node.text ?? node.children.map(textOf).join("");
}

// The name a control is known by: its label attribute, or else its text.
function nameOf(node) {
  const name = node.attrs["aria-label"] ?? (textOf(node).trim() || node.attrs.value || node.attrs.title || "");
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}

// A dialog or popover is a view of its own, open or not. Everything else belongs to the document.
const isViewRoot = (node) => node.tag === "dialog" || has(node, "popover") || node.attrs.role === "dialog" || node.parent === null;

const viewOf = (node) => [node, ...ancestors(node)].find(isViewRoot);

// Each view's elements in document order, keyed by the view's root.
function views(root) {
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
const structure = (node) => `${signature(node)}(${elements(node).map(structure).join(",")})`;

// One of two or more list or table rows, or of sibling elements with the same classes and the same structure.
function isRepeatedItem(node) {
  if (!node.parent) return false;
  const siblings = elements(node.parent).filter((sibling) => sibling !== node);
  if (isRow(node)) return siblings.some((sibling) => sibling.tag === node.tag);
  return classesOf(node).length > 0 && siblings.some((sibling) => structure(sibling) === structure(node));
}

// Whether a node sits inside a repeated item of its own view.
function inRepeatedItem(node) {
  const view = viewOf(node);
  const upToView = ancestors(node);
  return upToView.slice(0, upToView.indexOf(view)).some(isRepeatedItem);
}

// rules/disclosure.mjs
// Limits on emphasis and on what a view may hide.


const primaries = (nodes) => nodes.filter((node) => hasClass(node, PRIMARY_CLASS));

const onePrimaryAction = {
  id: "one-primary-action",
  fix: "Keep one primary button in the view and give the others secondary emphasis.",
  check(root) {
    const findings = [];
    for (const nodes of views(root).values()) {
      const found = primaries(nodes).filter((node) => !inRepeatedItem(node));
      if (found.length < 2) continue;
      for (const node of found) findings.push({ node, message: `This is one of ${found.length} primary actions in the same view.` });
    }
    return findings;
  },
};

const repeatedItemPrimary = {
  id: "repeated-item-primary",
  fix: "Give an action repeated for each item secondary emphasis.",
  check(root) {
    return primaries([...descendants(root)])
      .filter(inRepeatedItem)
      .map((node) => ({ node, message: "This primary action sits inside a repeated item." }));
  },
};

const oneAdvancedDisclosure = {
  id: "one-advanced-disclosure",
  fix: "Put the advanced settings of a view in one disclosure.",
  check(root) {
    const findings = [];
    for (const nodes of views(root).values()) {
      const extra = nodes.filter((node) => has(node, "data-ds-advanced")).slice(1);
      for (const node of extra) findings.push({ node, message: "This view has more than one advanced-settings disclosure." });
    }
    return findings;
  },
};

const isDetails = (node) => node.tag === "details";

const disclosureDepth = {
  id: "disclosure-depth",
  fix: "Nest disclosures at most two levels. Move the deeper content to its own view.",
  check(root) {
    return [...descendants(root)]
      .filter((node) => isDetails(node) && ancestors(node).filter(isDetails).length === 2)
      .map((node) => ({ node, message: "This disclosure is nested three levels deep." }));
  },
};

const summaryWithoutText = {
  id: "summary-without-text",
  fix: "Write what the disclosure holds as text in its summary.",
  check(root) {
    return [...descendants(root)]
      .filter((node) => node.tag === "summary" && textOf(node).trim() === "")
      .map((node) => ({ node, message: "This summary has no text." }));
  },
};

// Inside a closed details, other than in its summary, which stays visible.
function isCollapsed(node) {
  for (let child = node; child.parent; child = child.parent) {
    const parent = child.parent;
    const visibleSummary = child.tag === "summary" && elements(parent)[0] === child;
    if (isDetails(parent) && !has(parent, "open") && !visibleSummary) return true;
  }
  return false;
}

const hiddenCriticalAction = {
  id: "hidden-critical-action",
  fix: "Show the action outside collapsed content as well, or open the disclosure by default.",
  check(root) {
    const byView = views(root);
    const findings = [];
    for (const node of descendants(root)) {
      if (!has(node, "data-ds-critical") || !isCollapsed(node)) continue;
      const name = nameOf(node);
      const shown = byView
        .get(viewOf(node))
        .some((other) => other !== node && isControl(other) && name !== "" && nameOf(other) === name && !isCollapsed(other));
      if (!shown) findings.push({ node, message: "This critical action is reachable only inside collapsed content." });
    }
    return findings;
  },
};

const DISCLOSURE_RULES = [
  onePrimaryAction, repeatedItemPrimary, oneAdvancedDisclosure, disclosureDepth, summaryWithoutText, hiddenCriticalAction,
];

// rules/tells.mjs
// Layout patterns that make a screen look generated.


const IDENTICAL_CARDS = 3;
const BADGE_LIMIT = 8;
const LONG_TEXT_WORDS = 20;

const isCard = (node) => hasClass(node, CARD_CLASS);

const nestedCards = {
  id: "nested-cards",
  fix: "Use one card. Separate what is inside it with a heading or a divider.",
  check(root) {
    return [...descendants(root)]
      .filter((node) => isCard(node) && ancestors(node).some(isCard))
      .map((node) => ({ node, message: "This card is inside another card." }));
  },
};

const identicalCardGrid = {
  id: "identical-card-grid",
  fix: "Use a list or a table for uniform items, or vary the layout by what each item holds.",
  check(root) {
    const findings = [];
    for (const parent of [root, ...descendants(root)]) {
      const groups = new Map();
      for (const card of elements(parent).filter((node) => isCard(node) && !isRow(node))) {
        const shape = structure(card);
        groups.set(shape, [...(groups.get(shape) ?? []), card]);
      }
      for (const cards of groups.values()) {
        if (cards.length >= IDENTICAL_CARDS) {
          findings.push({ node: cards[0], message: `This is the first of ${cards.length} sibling cards with identical structure.` });
        }
      }
    }
    return findings;
  },
};

const excessBadges = {
  id: "excess-badges",
  fix: "Keep a badge for a status the reader must act on, and write the rest as plain text.",
  check(root) {
    const findings = [];
    for (const nodes of views(root).values()) {
      const badges = nodes.filter((node) => hasClass(node, BADGE_CLASS) && !ancestors(node).some(isRow));
      if (badges.length >= BADGE_LIMIT) {
        findings.push({ node: badges[BADGE_LIMIT - 1], message: `This view shows ${badges.length} status badges outside list rows.` });
      }
    }
    return findings;
  },
};

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const hasOwnText = (node) => node.children.some((child) => !isElement(child) && child.text.trim() !== "");

// A rendered tree knows the computed alignment and width. A static one has only the centring classes.
const isCentred = (node) => node.centred ?? [node, ...ancestors(node)].some((at) => CENTRE_CLASSES.some((name) => hasClass(at, name)));

const centredBodyText = {
  id: "centred-body-text",
  fix: "Align body text to the start. Centre only a short line.",
  check(root) {
    const findings = [];
    const visit = (parent) => {
      for (const node of elements(parent)) {
        if (hasOwnText(node) && wordCount(textOf(node)) > LONG_TEXT_WORDS && isCentred(node) && node.wide !== false) {
          findings.push({ node, message: "This long text is centred across more than the reading column." });
        } else {
          visit(node);
        }
      }
    };
    visit(root);
    return findings;
  },
};

const TELL_RULES = [nestedCards, identicalCardGrid, excessBadges, centredBodyText];

// rules/copy.mjs
// Wording patterns that make a screen look generated.


const STOCK_PHRASE_LIMIT = 3;
const UI_TEXT_TAGS = ["button", "a", "h1", "h2", "h3", "h4", "h5", "h6", "label", "summary"];

// A character drawn as an emoji by default, or one made so by the variation selector.
const EMOJI = /\p{Emoji_Presentation}|\uFE0F/u;

const emojiAsIcon = {
  id: "emoji-as-icon",
  fix: "Use an icon from the icon set, or remove it.",
  check(root) {
    const found = new Set();
    for (const node of descendants(root)) {
      if (!node.children.some((child) => !isElement(child) && EMOJI.test(child.text))) continue;
      const around = [node, ...ancestors(node)];
      const label = around.find((at) => UI_TEXT_TAGS.includes(at.tag));
      if (label && !around.some((at) => has(at, "data-ds-content"))) found.add(label);
    }
    return [...found].map((node) => ({ node, message: "This interface text contains an emoji." }));
  },
};

const phraseOf = (node) => nameOf(node).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const stockPhrase = {
  id: "stock-phrase",
  fix: "Name what each control does, in the words of the task.",
  check(root) {
    const findings = [];
    for (const nodes of views(root).values()) {
      const controls = nodes.filter(isControl);
      for (const phrase of STOCK_PHRASES) {
        const using = controls.filter((node) => phraseOf(node) === phrase);
        if (using.length >= STOCK_PHRASE_LIMIT) {
          findings.push({ node: using[STOCK_PHRASE_LIMIT - 1], message: `"${phrase}" is on ${using.length} controls in this view.` });
        }
      }
    }
    return findings;
  },
};

const COPY_RULES = [emojiAsIcon, stockPhrase];

// rules/adoption.mjs
// Whether a view is built from the system at all.


const SYSTEM_PREFIX = "ds-";
const FORM_CONTROL_TAGS = ["button", "select", "textarea"];

// A button or a form control. A link is not counted, and neither is a hidden input.
const isFormControl = (node) =>
  FORM_CONTROL_TAGS.includes(node.tag) || (node.tag === "input" && (node.attrs.type ?? "").toLowerCase() !== "hidden");

const unstyledControls = {
  id: "unstyled-controls",
  fix: "Build the view from catalogue components. Look each control up in the component index and copy its example.",
  check(root, { appPrefix } = {}) {
    const prefixes = [SYSTEM_PREFIX, ...(appPrefix ? [`${appPrefix}-`] : [])];
    const fromSystem = (node) => classesOf(node).some((name) => prefixes.some((prefix) => name.startsWith(prefix)));
    const findings = [];
    for (const nodes of views(root).values()) {
      const controls = nodes.filter(isFormControl);
      if (controls.length === 0 || controls.some((control) => [control, ...ancestors(control)].some(fromSystem))) continue;
      const subject = controls.length === 1 ? "its one control does not carry" : `none of its ${controls.length} controls carries`;
      findings.push({ node: controls[0], message: `This view uses no component of the design system: ${subject} a system class or sits inside an element that does.` });
    }
    return findings;
  },
};

const ADOPTION_RULES = [unstyledControls];

// rules/index.mjs
// Every structural rule, and the one function that runs them over a document tree.


const RULES = [...DISCLOSURE_RULES, ...TELL_RULES, ...COPY_RULES, ...ADOPTION_RULES];

// Findings as { rule, message, fix, node }, where node is the element at fault.
// options.appPrefix is the prefix of the app's own classes, without the hyphen, when the app has one.
function runRules(root, options = {}) {
  return RULES.flatMap((rule) => rule.check(root, options).map(({ node, message }) => ({ rule: rule.id, message, fix: rule.fix, node })));
}

// dom-entry.mjs
// The structural rules on a rendered page. The build bundles this file and the rules into dist/check-dom.js.


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
function checkDom(rootElement, readingColumn, options = {}) {
  const root = { tag: "#document", attrs: {}, children: [], parent: null };
  root.children.push(adapt(rootElement, root, readingColumn));
  return runRules(root, options).map(({ node, ...finding }) => ({ ...finding, snippet: node.snippet }));
}

globalThis.dsCheckDom = (root = document.documentElement, options = {}) => checkDom(root, 480, options ?? {});
})();

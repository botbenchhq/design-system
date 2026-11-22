// Wording patterns that make a screen look generated.

import { STOCK_PHRASES } from "./stock-phrases.mjs";
import { ancestors, descendants, has, isControl, isElement, nameOf, views } from "./tree.mjs";

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

export const COPY_RULES = [emojiAsIcon, stockPhrase];

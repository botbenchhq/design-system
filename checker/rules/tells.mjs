// Layout patterns that make a screen look generated.

import { BADGE_CLASS, CARD_CLASS, CENTRE_CLASSES, ancestors, descendants, elements, hasClass, isElement, isRow, structure, textOf, views } from "./tree.mjs";

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

export const TELL_RULES = [nestedCards, identicalCardGrid, excessBadges, centredBodyText];

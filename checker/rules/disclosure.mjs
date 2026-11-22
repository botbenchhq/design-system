// Limits on emphasis and on what a view may hide.

import { PRIMARY_CLASS, ancestors, descendants, elements, has, hasClass, inRepeatedItem, isControl, nameOf, textOf, viewOf, views } from "./tree.mjs";

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
      const extra = nodes.filter((node) => has(node, "data-gw-advanced")).slice(1);
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
      if (!has(node, "data-gw-critical") || !isCollapsed(node)) continue;
      const name = nameOf(node);
      const shown = byView
        .get(viewOf(node))
        .some((other) => other !== node && isControl(other) && name !== "" && nameOf(other) === name && !isCollapsed(other));
      if (!shown) findings.push({ node, message: "This critical action is reachable only inside collapsed content." });
    }
    return findings;
  },
};

export const DISCLOSURE_RULES = [
  onePrimaryAction, repeatedItemPrimary, oneAdvancedDisclosure, disclosureDepth, summaryWithoutText, hiddenCriticalAction,
];

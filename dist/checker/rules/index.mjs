// Every structural rule, and the one function that runs them over a document tree.

import { COPY_RULES } from "./copy.mjs";
import { DISCLOSURE_RULES } from "./disclosure.mjs";
import { TELL_RULES } from "./tells.mjs";

export const RULES = [...DISCLOSURE_RULES, ...TELL_RULES, ...COPY_RULES];

// Findings as { rule, message, fix, node }, where node is the element at fault.
export function runRules(root) {
  return RULES.flatMap((rule) => rule.check(root).map(({ node, message }) => ({ rule: rule.id, message, fix: rule.fix, node })));
}

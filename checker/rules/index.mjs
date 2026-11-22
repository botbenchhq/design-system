// Every structural rule, and the one function that runs them over a document tree.

import { ADOPTION_RULES } from "./adoption.mjs";
import { COPY_RULES } from "./copy.mjs";
import { DISCLOSURE_RULES } from "./disclosure.mjs";
import { TELL_RULES } from "./tells.mjs";

export const RULES = [...DISCLOSURE_RULES, ...TELL_RULES, ...COPY_RULES, ...ADOPTION_RULES];

// Findings as { rule, message, fix, node }, where node is the element at fault.
// options.appPrefix is the prefix of the app's own classes, without the hyphen, when the app has one.
export function runRules(root, options = {}) {
  return RULES.flatMap((rule) => rule.check(root, options).map(({ node, message }) => ({ rule: rule.id, message, fix: rule.fix, node })));
}

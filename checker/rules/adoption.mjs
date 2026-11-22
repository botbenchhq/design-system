// Whether a view is built from the system at all.

import { ancestors, classesOf, views } from "./tree.mjs";

const SYSTEM_PREFIX = "gw-";
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

export const ADOPTION_RULES = [unstyledControls];

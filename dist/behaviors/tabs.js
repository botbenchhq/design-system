// Behaviours for the design system's components that native elements cannot provide.
// One ES module with no dependencies: <script type="module" src="behaviors/tabs.js"></script>
//
// <ds-tabs> wraps the markup of the tabs component, in the light DOM. It sets aria-selected and
// tabindex on each tab and hidden on each panel, and handles click, Left, Right, Home and End.
// It adds no class and no inline style: the stylesheet reads those attributes and nothing else.

const TAB = '[role="tab"]';

class DsTabs extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
  }

  connectedCallback() {
    const tabs = this.tabs;
    const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
    if (selected) this.select(selected);
  }

  // The tabs of this element, leaving out those of a ds-tabs nested in one of its panels.
  get tabs() {
    return [...this.querySelectorAll(TAB)].filter((tab) => tab.closest("ds-tabs") === this);
  }

  select(tab) {
    for (const each of this.tabs) {
      const selected = each === tab;
      each.setAttribute("aria-selected", String(selected));
      each.setAttribute("tabindex", selected ? "0" : "-1");
      const panel = document.getElementById(each.getAttribute("aria-controls"));
      if (panel) panel.hidden = !selected;
    }
  }

  handleEvent(event) {
    const tab = event.target.closest?.(TAB);
    if (!tab || tab.closest("ds-tabs") !== this) return;
    if (event.type === "click") {
      this.select(tab);
      return;
    }
    const tabs = this.tabs;
    const at = tabs.indexOf(tab);
    const next = {
      ArrowLeft: tabs[(at - 1 + tabs.length) % tabs.length],
      ArrowRight: tabs[(at + 1) % tabs.length],
      Home: tabs[0],
      End: tabs.at(-1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    this.select(next);
    next.focus();
  }
}

if (!customElements.get("ds-tabs")) customElements.define("ds-tabs", DsTabs);

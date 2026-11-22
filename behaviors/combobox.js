// The behaviour of the combobox component, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/combobox.js"></script>
//
// <gw-combobox> wraps the markup of the combobox component, in the light DOM. As the reader types it
// sets hidden on the options that do not match, aria-expanded on the input, aria-selected on the active
// option and aria-activedescendant on the input, and writes the result count into the element's
// role="status" line. It handles Down, Up, Home, End, Enter and Escape, and a press on an option.
// It adds no class and no inline style: the stylesheet reads those attributes and nothing else,
// so an app that sets them itself gets the same result and does not load this file.

const INPUT = '[role="combobox"]';
const OPTION = '[role="option"]';

class GwCombobox extends HTMLElement {
  constructor() {
    super();
    for (const type of ["input", "keydown", "click", "mousedown", "focusout"]) this.addEventListener(type, this);
  }

  get input() {
    return this.querySelector(INPUT);
  }

  get list() {
    return document.getElementById(this.input?.getAttribute("aria-controls"));
  }

  get options() {
    return [...(this.list?.querySelectorAll(OPTION) ?? [])];
  }

  // The options that match what was typed.
  get shown() {
    return this.options.filter((option) => !option.hidden);
  }

  get active() {
    return this.shown.find((option) => option.getAttribute("aria-selected") === "true");
  }

  // The message that stands in for the list when nothing matches: the list's next sibling.
  get message() {
    return this.list?.nextElementSibling;
  }

  get expanded() {
    return this.input.getAttribute("aria-expanded") === "true";
  }

  // Hides the options that do not hold the query, opens the list on what is left and reports the count.
  filter(query) {
    const { input, list, options, message } = this;
    const wanted = query.trim().toLowerCase();
    for (const option of options) option.hidden = !option.textContent.toLowerCase().includes(wanted);
    const count = this.shown.length;
    list.hidden = count === 0;
    if (message) message.hidden = count > 0;
    input.setAttribute("aria-expanded", String(count > 0));
    this.activate(null);

    const status = this.querySelector('[role="status"]');
    if (!status) return;
    const sentence = status.dataset.gwCount ?? "{count} of {total}";
    status.textContent =
      count === 0 && message
        ? message.textContent.trim()
        : sentence.replace("{count}", String(count)).replace("{total}", String(options.length));
  }

  // Marks one option, or none, as the active one and names it on the input.
  activate(option) {
    for (const each of this.options) each.setAttribute("aria-selected", String(each === option));
    if (option) {
      this.input.setAttribute("aria-activedescendant", option.id);
      option.scrollIntoView({ block: "nearest" });
    } else {
      this.input.removeAttribute("aria-activedescendant");
    }
  }

  close() {
    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
    if (this.message) this.message.hidden = true;
  }

  choose(option) {
    const { input } = this;
    input.value = option.dataset.value ?? option.textContent.trim();
    this.close();
    for (const each of this.options) each.setAttribute("aria-selected", String(each === option));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  handleEvent(event) {
    const { input } = this;
    if (!input || !this.list) return;
    const option = event.target.closest?.(OPTION);

    // A press on an option must not take focus from the input, or the list would close before the click arrives.
    if (event.type === "mousedown") {
      if (option) event.preventDefault();
      return;
    }
    if (event.type === "click") {
      if (option) this.choose(option);
      else if (event.target === input && !this.expanded) this.filter("");
      return;
    }
    if (event.type === "focusout") {
      if (!this.contains(event.relatedTarget)) this.close();
      return;
    }
    if (event.target !== input) return;
    if (event.type === "input") {
      this.filter(input.value);
      return;
    }

    const { key } = event;
    if (key === "Escape") {
      if (!this.expanded && this.message?.hidden !== false) return;
      event.preventDefault();
      this.close();
    } else if (key === "Enter") {
      const { active } = this;
      if (!this.expanded || !active) return;
      event.preventDefault();
      this.choose(active);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      // Opening with an arrow key shows every option, whatever the input holds.
      if (!this.expanded) this.filter("");
      const { shown, active } = this;
      if (shown.length === 0) return;
      const step = key === "ArrowDown" ? 1 : -1;
      const from = active ? shown.indexOf(active) : step === 1 ? -1 : 0;
      this.activate(shown[(from + step + shown.length) % shown.length]);
    } else if ((key === "Home" || key === "End") && this.expanded && this.shown.length > 0) {
      event.preventDefault();
      this.activate(key === "Home" ? this.shown[0] : this.shown.at(-1));
    }
  }
}

if (!customElements.get("gw-combobox")) customElements.define("gw-combobox", GwCombobox);

// The behaviour of the command palette component, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/command-palette.js"></script>
//
// <ds-command-palette> wraps the palette's dialog, in the light DOM. It finds its parts by role:
// the combobox input, the listbox, its options and groups, and the status message for no match.
//   - Typing hides the options that do not match every word typed, the groups left with no option and,
//     when nothing matches, the list itself. The text of a kbd is not matched.
//   - The status element is never hidden, so a screen reader hears what is written into it. When nothing matches
//     the element writes the app's sentence into it, from its data-ds-empty attribute, and empties it otherwise.
//     Markup with no data-ds-empty, whose status holds the sentence and the hidden attribute as before 0.7.2,
//     has the sentence moved into the attribute and the hidden attribute taken off.
//   - Down and Up move through the options that are shown and wrap at the ends. The option Enter would
//     run carries aria-selected="true", and the input's aria-activedescendant holds its id.
//   - Enter presses that option. A press on any option closes the dialog, after the app's own click
//     listener on the option has run. An option with aria-disabled="true" is never pressed.
//   - shortcut="k" opens the dialog with showModal() on Ctrl+K and Cmd+K. The dialog itself closes on
//     Escape and returns focus to where it was. Closing empties the input.
// It sets attributes, and the text of the status element, never a class or an inline style.
// A framework app sets the same attributes and writes the same sentence itself.

const INPUT = '[role="combobox"]';
const LIST = '[role="listbox"]';
const GROUP = '[role="group"]';
const OPTION = '[role="option"]';
const MESSAGE = '[role="status"]';

// What a command is matched on: its text without its shortcut hint.
const nameOf = (node) => (node.nodeName === "KBD" ? "" : node.firstChild ? [...node.childNodes].map(nameOf).join("") : node.textContent);

class DsCommandPalette extends HTMLElement {
  constructor() {
    super();
    for (const type of ["input", "keydown", "click"]) this.addEventListener(type, this);
    // A dialog's close event does not bubble, so it is caught on the way down.
    this.addEventListener("close", this, true);
  }

  connectedCallback() {
    document.addEventListener("keydown", this);
    this.filter();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this);
  }

  get dialog() {
    return this.querySelector("dialog");
  }

  get input() {
    return this.querySelector(INPUT);
  }

  // The options that match what is typed, in order.
  get shown() {
    return [...this.querySelectorAll(OPTION)].filter((option) => !option.hidden);
  }

  filter() {
    const input = this.input;
    if (!input) return;
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    for (const option of this.querySelectorAll(OPTION)) {
      const name = nameOf(option).toLowerCase();
      option.hidden = !words.every((word) => name.includes(word));
    }
    for (const group of this.querySelectorAll(GROUP)) group.hidden = !group.querySelector(`${OPTION}:not([hidden])`);
    const shown = this.shown;
    const list = this.querySelector(LIST);
    const message = this.querySelector(MESSAGE);
    if (list) list.hidden = shown.length === 0;
    if (message) {
      if (message.dataset.dsEmpty === undefined) message.dataset.dsEmpty = message.textContent.trim();
      message.hidden = false;
      const text = shown.length === 0 ? message.dataset.dsEmpty : "";
      if (message.textContent !== text) message.textContent = text;
    }
    input.setAttribute("aria-expanded", String(shown.length > 0));
    this.select(shown.find((option) => option.getAttribute("aria-selected") === "true") ?? shown[0]);
  }

  // Marks one option, or none, as the one Enter would run.
  select(option) {
    for (const each of this.querySelectorAll(OPTION)) each.setAttribute("aria-selected", String(each === option));
    if (option?.id) this.input.setAttribute("aria-activedescendant", option.id);
    else this.input.removeAttribute("aria-activedescendant");
  }

  handleEvent(event) {
    if (event.currentTarget === document) this.onShortcut(event);
    else if (event.type === "close") this.onClose(event);
    else if (event.type === "input") this.onInput(event);
    else if (event.type === "click") this.onClick(event);
    else this.onKey(event);
  }

  onShortcut(event) {
    const key = this.getAttribute("shortcut");
    const dialog = this.dialog;
    if (!key || !dialog || dialog.open) return;
    if (event.key.toLowerCase() !== key.toLowerCase() || !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    event.preventDefault();
    dialog.showModal();
  }

  onClose(event) {
    const input = this.input;
    if (event.target !== this.dialog || !input) return;
    input.value = "";
    for (const option of this.querySelectorAll(OPTION)) option.setAttribute("aria-selected", "false");
    this.filter();
  }

  onInput(event) {
    if (event.target !== this.input) return;
    for (const option of this.querySelectorAll(OPTION)) option.setAttribute("aria-selected", "false");
    this.filter();
  }

  onClick(event) {
    const option = event.target.closest?.(OPTION);
    if (!option || !this.contains(option) || option.getAttribute("aria-disabled") === "true") return;
    this.dialog?.close();
  }

  onKey(event) {
    if (event.target !== this.input || event.isComposing) return;
    const shown = this.shown;
    const at = shown.findIndex((option) => option.getAttribute("aria-selected") === "true");
    if (event.key === "Enter") {
      event.preventDefault();
      if (shown[at] && shown[at].getAttribute("aria-disabled") !== "true") shown[at].click();
      return;
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!step || shown.length === 0) return;
    event.preventDefault();
    const next = shown[(at + step + shown.length) % shown.length];
    this.select(next);
    next.scrollIntoView({ block: "nearest" });
  }
}

if (!customElements.get("ds-command-palette")) customElements.define("ds-command-palette", DsCommandPalette);

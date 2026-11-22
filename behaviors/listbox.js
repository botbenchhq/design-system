// The keyboard of a listbox, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/listbox.js"></script>
//
// <ds-listbox> wraps, in the light DOM, the markup of one or more listbox components: elements with role="listbox"
// holding elements with role="option". Focus is roving: one option of each listbox has tabindex="0", the selected one
// or else the first, and every other has tabindex="-1", so Tab enters and leaves a listbox in one stop.
//   - Down and Up move focus to the next and the previous option and stop at the ends. Home and End go to the
//     first and the last. A letter goes to the next option whose text starts with it.
//   - With one option to choose, Space or Enter selects the focused option: aria-selected="true" on it and "false"
//     on the rest. With aria-multiselectable="true" on the listbox, Space or Enter switches the focused option,
//     Shift with Down or Up switches the option moved to, and Ctrl or Cmd with A selects every option.
//   - A press on an option does what Space does on it.
//   - An option with aria-disabled="true" takes focus in its turn and is never selected or switched.
// After each change of selection the listbox fires a change event that bubbles. The app's own listeners run first,
// and a key or press whose default the app has prevented is left to the app. It sets aria-selected and tabindex and
// moves focus only, never a class or an inline style. A framework app loads nothing and does the same itself.

const LISTBOX = '[role="listbox"]';
const OPTION = '[role="option"]';

const isOn = (option) => option.getAttribute("aria-selected") === "true";
const isDisabled = (option) => option.getAttribute("aria-disabled") === "true";

class DsListbox extends HTMLElement {
  constructor() {
    super();
    for (const type of ["keydown", "click", "focusin"]) this.addEventListener(type, this);
  }

  connectedCallback() {
    for (const listbox of this.querySelectorAll(LISTBOX)) {
      const options = this.optionsOf(listbox);
      const stop = options.find(isOn) ?? options[0];
      if (stop) this.rove(listbox, stop);
    }
  }

  optionsOf(listbox) {
    return [...listbox.querySelectorAll(OPTION)].filter((option) => option.closest(LISTBOX) === listbox && !option.hidden);
  }

  rove(listbox, option) {
    for (const each of this.optionsOf(listbox)) each.setAttribute("tabindex", each === option ? "0" : "-1");
  }

  // Selects or switches one option, as Space would, and says so with a change event.
  choose(listbox, option, multiple) {
    if (isDisabled(option)) return;
    if (multiple) option.setAttribute("aria-selected", String(!isOn(option)));
    else for (const each of this.optionsOf(listbox)) each.setAttribute("aria-selected", String(each === option));
    listbox.dispatchEvent(new Event("change", { bubbles: true }));
  }

  handleEvent(event) {
    const option = event.target.closest?.(OPTION);
    const listbox = option?.closest(LISTBOX);
    if (!listbox || !this.contains(listbox) || event.defaultPrevented) return;
    const multiple = listbox.getAttribute("aria-multiselectable") === "true";
    if (event.type === "focusin") this.rove(listbox, option);
    else if (event.type === "click") this.choose(listbox, option, multiple);
    else this.onKey(event, listbox, option, multiple);
  }

  onKey(event, listbox, option, multiple) {
    const { key } = event;
    const options = this.optionsOf(listbox);
    const at = options.indexOf(option);
    if (key === " " || key === "Enter") {
      event.preventDefault();
      this.choose(listbox, option, multiple);
      return;
    }
    if (multiple && key.toLowerCase() === "a" && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      const chosen = options.filter((each) => !isDisabled(each));
      for (const each of chosen) each.setAttribute("aria-selected", "true");
      listbox.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next;
    if (key === "ArrowDown") next = options[Math.min(at + 1, options.length - 1)];
    else if (key === "ArrowUp") next = options[Math.max(at - 1, 0)];
    else if (key === "Home") next = options[0];
    else if (key === "End") next = options.at(-1);
    else if (key.length === 1) {
      const letter = key.toLowerCase();
      next = [...options.slice(at + 1), ...options.slice(0, at + 1)].find((each) => each.textContent.trim().toLowerCase().startsWith(letter));
    }
    if (!next) return;
    event.preventDefault();
    this.rove(listbox, next);
    next.focus();
    if (multiple && event.shiftKey && next !== option && (key === "ArrowDown" || key === "ArrowUp")) this.choose(listbox, next, true);
  }
}

if (!customElements.get("ds-listbox")) customElements.define("ds-listbox", DsListbox);

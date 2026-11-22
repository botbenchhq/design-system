// The keyboard inside a menu, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/menu.js"></script>
//
// <ds-menu> wraps, in the light DOM, the markup of a menu and its button, a split button or a context menu,
// or a whole list of rows that each end in one. It looks after every element with role="menu" and the popover
// attribute inside it. The button still opens and closes the menu with no script, and the browser still closes it
// on Escape and on a press outside, and returns focus to the button.
//   - When a menu opens, focus moves to its first item. Every item has tabindex="-1" except the one with focus.
//   - Down and Up move to the next and the previous item and wrap at the ends. Home and End go to the first and the last.
//   - A letter goes to the next item whose label starts with it.
//   - Tab closes the menu, and focus moves on from its button.
//   - An item with aria-disabled="true" takes focus in its turn, and Enter and Space do nothing on it.
// A menu the app shows as a manual popover is one it keeps open itself, such as an example drawn open, and opening
// it moves no focus. The element sets tabindex and moves focus only, never a class or an inline style.
// A framework app loads nothing and does the same itself.

const MENU = '[role="menu"][popover]';
const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

const label = (item) => item.textContent.trim().toLowerCase();

class DsMenu extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("keydown", this);
    // A popover's toggle event does not bubble, so it is caught on the way down.
    this.addEventListener("toggle", this, true);
  }

  // The items of one menu that can take focus, in order. An item with aria-disabled stays in; a disabled button cannot.
  itemsOf(menu) {
    return [...menu.querySelectorAll(ITEM)].filter((item) => item.closest(MENU) === menu && !item.disabled && item.checkVisibility());
  }

  focusItem(menu, item) {
    for (const each of this.itemsOf(menu)) each.setAttribute("tabindex", each === item ? "0" : "-1");
    item.focus();
  }

  handleEvent(event) {
    const menu = event.target.closest?.(MENU);
    if (!menu || !this.contains(menu)) return;
    if (event.type === "toggle") this.onToggle(event, menu);
    else this.onKey(event, menu);
  }

  onToggle(event, menu) {
    // The event arrives after the change, so the menu is asked whether it is open now.
    if (event.target !== menu || !menu.matches(":popover-open") || menu.popover === "manual") return;
    const [first] = this.itemsOf(menu);
    if (first) this.focusItem(menu, first);
  }

  onKey(event, menu) {
    const item = event.target.closest(ITEM);
    if (!item || item.closest(MENU) !== menu || event.defaultPrevented || event.isComposing) return;
    const { key } = event;
    if (key === "Tab") {
      // Closing gives focus back to the button, and the key then moves it on from there.
      menu.hidePopover();
      return;
    }
    if ((key === "Enter" || key === " ") && item.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const items = this.itemsOf(menu);
    const at = items.indexOf(item);
    let next;
    if (key === "ArrowDown") next = items[(at + 1) % items.length];
    else if (key === "ArrowUp") next = items[(at - 1 + items.length) % items.length];
    else if (key === "Home") next = items[0];
    else if (key === "End") next = items.at(-1);
    else if (key.length === 1 && key !== " ") {
      const letter = key.toLowerCase();
      next = [...items.slice(at + 1), ...items.slice(0, at + 1)].find((each) => label(each).startsWith(letter));
    }
    if (!next) return;
    event.preventDefault();
    this.focusItem(menu, next);
  }
}

if (!customElements.get("ds-menu")) customElements.define("ds-menu", DsMenu);

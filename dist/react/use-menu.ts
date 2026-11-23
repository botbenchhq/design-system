// The keyboard inside a menu, for a React app: the same model as <ds-menu> in behaviors/menu.js, so change the two
// together. Copy it into the app, or import it from the vendored folder. It needs React 19.
//
// The button opens and closes the menu with popovertarget and no script, and the browser closes it on Escape and on
// a press outside and gives focus back to the button. The hook adds the rest:
//   - When the menu opens, focus moves to its first item. Every item has tabindex="-1" except the one with focus.
//   - Down and Up move to the next and the previous item and wrap at the ends. Home and End go to the first and the last.
//   - A letter goes to the next item whose label starts with it.
//   - Tab closes the menu, and focus moves on from its button.
//   - An item with aria-disabled="true" takes focus in its turn, and Enter and Space do nothing on it.
// A menu the app shows as a manual popover is one it keeps open itself, and opening it moves no focus. Like the
// module it reads the items from the page when a key arrives, and sets tabindex and moves focus only.
//
// Spread buttonProps on the button, menuProps on the element with the class ds-menu, and itemProps on each item,
// then give the menu its aria-label and each item its classes and label. After an item's action, call close().

import { useCallback, useId, useMemo, useRef } from "react";
import type { KeyboardEvent, ToggleEvent } from "react";

const MENU = '[role="menu"][popover]';
const ITEM = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

export interface MenuButtonProps {
  ref: (element: HTMLElement | null) => void;
  popoverTarget: string;
  "aria-haspopup": "menu";
}

export interface MenuProps {
  ref: (element: HTMLElement | null) => void;
  id: string;
  popover: "auto";
  role: "menu";
  onToggle: (event: ToggleEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface MenuItemProps {
  type: "button";
  role: "menuitem";
  tabIndex: -1;
}

export interface Menu {
  /** For the button that opens the menu. */
  buttonProps: MenuButtonProps;
  /** For the element with the class ds-menu. Give it an aria-label too. */
  menuProps: MenuProps;
  /** For each item. A checkbox or radio item overrides role with menuitemcheckbox or menuitemradio. */
  itemProps: MenuItemProps;
  /** Opens the menu below its button, as from a right-click or Shift+F10 on the row it acts on. */
  open: () => void;
  /** Closes the menu, after an item's action, and focus goes back to the button. */
  close: () => void;
}

// showPopover takes the element it is opened from, so the menu hangs below it; the DOM types do not have it yet.
type ShowPopover = (options?: { source?: HTMLElement }) => void;

const label = (item: Element) => (item.textContent ?? "").trim().toLowerCase();

// The items of one menu that can take focus, in order. An item with aria-disabled stays in; a disabled button cannot.
function itemsOf(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>(ITEM)].filter((item) => item.closest(MENU) === menu && !item.matches(":disabled") && item.checkVisibility());
}

function focusItem(menu: HTMLElement, item: HTMLElement) {
  for (const each of itemsOf(menu)) each.setAttribute("tabindex", each === item ? "0" : "-1");
  item.focus();
}

export function useMenu(): Menu {
  const id = useId();
  const button = useRef<HTMLElement | null>(null);
  const menu = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const popover = menu.current;
    if (!popover || popover.matches(":popover-open")) return;
    (popover.showPopover as ShowPopover).call(popover, button.current ? { source: button.current } : undefined);
  }, []);
  const close = useCallback(() => {
    if (menu.current?.matches(":popover-open")) menu.current.hidePopover();
  }, []);

  const props = useMemo(() => {
    const onToggle = (event: ToggleEvent<HTMLElement>) => {
      const popover = event.currentTarget;
      // The event arrives after the change, so the menu is asked whether it is open now.
      if (event.target !== popover || !popover.matches(":popover-open") || popover.popover === "manual") return;
      const [first] = itemsOf(popover);
      if (first) focusItem(popover, first);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target instanceof Element ? event.target : null;
      const popover = target?.closest<HTMLElement>(MENU);
      const item = target?.closest<HTMLElement>(ITEM);
      if (!popover || popover !== event.currentTarget || !item || item.closest(MENU) !== popover) return;
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
      const { key } = event;
      if (key === "Tab") {
        // Closing gives focus back to the button, and the key then moves it on from there.
        popover.hidePopover();
        return;
      }
      if ((key === "Enter" || key === " ") && item.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const items = itemsOf(popover);
      const at = items.indexOf(item);
      let next: HTMLElement | undefined;
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
      focusItem(popover, next);
    };

    const buttonProps: MenuButtonProps = {
      ref: (element) => {
        button.current = element;
      },
      popoverTarget: id,
      "aria-haspopup": "menu",
    };
    const menuProps: MenuProps = {
      ref: (element) => {
        menu.current = element;
      },
      id,
      popover: "auto",
      role: "menu",
      onToggle,
      onKeyDown,
    };
    const itemProps: MenuItemProps = { type: "button", role: "menuitem", tabIndex: -1 };
    return { buttonProps, menuProps, itemProps };
  }, [id]);

  return { ...props, open, close };
}

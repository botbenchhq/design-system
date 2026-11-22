// A button with a busy state, on the system's button classes and attributes. Copy it into the app, or import it
// from the vendored folder. It needs React 19 and nothing else.
//
// While busy it carries aria-busy="true", shows busyLabel in place of its label, and ignores presses from the
// pointer and the keyboard, as the button's metadata asks. It stays enabled, so focus stays on it while the
// action runs. The stylesheet draws the spinner in place of the leading icon.

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "default" | "small";

// A button that can be busy says what is happening while it is.
type BusyState = { busy: true; busyLabel: string } | { busy?: false; busyLabel?: string };

export type BusyButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | "aria-busy"> &
  BusyState & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** The name of an icon in the sprite, such as "plus". */
    icon?: string;
    /** Where the app serves the sprite. */
    spriteHref?: string;
    children: ReactNode;
  };

// Written in full, so the checker can see each class.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "ds-button--primary",
  secondary: "",
  quiet: "ds-button--quiet",
  danger: "ds-button--danger",
};
const SIZE_CLASS: Record<ButtonSize, string> = { default: "", small: "ds-button--small" };

export function BusyButton({
  variant = "secondary",
  size = "default",
  busy = false,
  busyLabel,
  icon,
  spriteHref = "icons.svg",
  type = "button",
  className,
  onClick,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: BusyButtonProps) {
  const classes = ["ds-button", VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(" ");

  // Enter, Space and the implicit submit of a form all arrive as a click, so this one handler ignores them all.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // While busy the visible words are the name, so a label that names the idle action is left off.
  return (
    <button
      {...rest}
      type={type}
      className={classes}
      onClick={handleClick}
      aria-busy={busy || undefined}
      aria-label={busy ? undefined : ariaLabel}
      aria-labelledby={busy ? undefined : ariaLabelledBy}
    >
      {icon !== undefined && (
        <svg className="ds-button__icon" aria-hidden="true">
          <use href={`${spriteHref}#ds-icon-${icon}`} />
        </svg>
      )}
      {busy ? busyLabel : children}
    </button>
  );
}

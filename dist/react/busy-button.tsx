// A button with a busy state, on the system's button classes and attributes. Copy it into the app, or import it
// from the vendored folder. It needs React 19 and nothing else.
//
// While busy it carries aria-busy="true" and ignores presses from the pointer and the keyboard, as the button's
// metadata asks. It stays enabled, so focus stays on it while the action runs. The stylesheet draws the spinner in
// place of the leading icon. What it says while busy depends on its label:
//   - A button with words shows busyLabel in place of them.
//   - An icon-only button (an icon and an aria-label, no children) takes busyLabel as its name and shows no words,
//     as the icon button's metadata asks. It carries ds-icon-button.
//   - An icon-only toggle (with aria-pressed) keeps its name while busy, because a toggle's name never changes. It
//     takes no busyLabel: the app says what is happening in a status line of its own.

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
/** The sizes of a button with words. Small and large are fixed heights; the default is shorter in a compact container and taller on a coarse pointer. */
export type ButtonSize = "default" | "small" | "large";
/** The sizes of an icon-only button: xsmall is for the one action inside a dense row. */
export type IconButtonSize = "default" | "small" | "xsmall";
type Pressed = boolean | "true" | "false" | "mixed";

// A button that can be busy says what is happening while it is.
type BusyState = { busy: true; busyLabel: string } | { busy?: false; busyLabel?: string };

/** A label in words, which busyLabel replaces while busy. */
type WordsLabel = BusyState & {
  children: ReactNode;
  size?: ButtonSize;
  /** The name of an icon in the sprite, such as "plus". */
  icon?: string;
  "aria-label"?: string;
  "aria-pressed"?: Pressed;
};

/** An icon and an aria-label, with no children, that is never busy. */
type IconOnly = {
  children?: null;
  size?: IconButtonSize;
  icon: string;
  "aria-label": string;
  "aria-pressed"?: Pressed;
  busy?: false;
  busyLabel?: never;
};

/** An icon and an aria-label, with no children, that can be busy. While busy, busyLabel is the name. */
type IconAction = {
  children?: null;
  size?: IconButtonSize;
  icon: string;
  "aria-label": string;
  "aria-pressed"?: never;
  busy?: boolean;
  busyLabel: string;
};

/** An icon-only toggle. Its name stays the same while busy, so it takes no busyLabel. */
type IconToggle = {
  children?: null;
  size?: IconButtonSize;
  icon: string;
  "aria-label": string;
  "aria-pressed": Pressed;
  busy?: boolean;
  busyLabel?: never;
};

export type BusyButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | "aria-busy" | "aria-label" | "aria-pressed"> & {
  variant?: ButtonVariant;
  /** Where the app serves the sprite. */
  spriteHref?: string;
} & (WordsLabel | IconOnly | IconAction | IconToggle);

// Written in full, so the checker can see each class.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "ds-button--primary",
  secondary: "",
  quiet: "ds-button--quiet",
  danger: "ds-button--danger",
};
const SIZE_CLASS: Record<ButtonSize | IconButtonSize, string> = { default: "", small: "ds-button--small", large: "ds-button--large", xsmall: "" };
// An icon-only button takes its size from the icon button's own classes, never from ds-button--small.
const ICON_SIZE_CLASS: Record<ButtonSize | IconButtonSize, string> = { default: "", small: "ds-icon-button--small", xsmall: "ds-icon-button--xsmall", large: "" };

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
  // No words of its own: the name lives in aria-label in every state.
  const iconOnly = icon !== undefined && (children === undefined || children === null);
  const classes = [...new Set(["ds-button", VARIANT_CLASS[variant], iconOnly ? "ds-icon-button" : SIZE_CLASS[size], iconOnly ? ICON_SIZE_CLASS[size] : "", ...(className ?? "").split(/\s+/)])]
    .filter(Boolean)
    .join(" ");

  // Enter, Space and the implicit submit of a form all arrive as a click, so this one handler ignores them all.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  // While busy the visible words are the name, so a label that names the idle action is left off. An icon-only
  // button has no visible words: busyLabel becomes its name, and a toggle, which has none, keeps its own.
  let label = ariaLabel;
  let labelledBy = ariaLabelledBy;
  if (busy && iconOnly) {
    if (busyLabel !== undefined) [label, labelledBy] = [busyLabel, undefined];
  } else if (busy) label = labelledBy = undefined;

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      onClick={handleClick}
      aria-busy={busy || undefined}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      {icon !== undefined && (
        <svg className="ds-button__icon" aria-hidden="true">
          <use href={`${spriteHref}#ds-icon-${icon}`} />
        </svg>
      )}
      {iconOnly ? null : busy ? busyLabel : children}
    </button>
  );
}

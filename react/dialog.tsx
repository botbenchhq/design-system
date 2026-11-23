// The dialog, the confirm dialog and the sheet, for a React app: the markup of each component's examples, opened
// and closed from a prop. Copy it into the app, or import it from the vendored folder. It needs React 19.
//
// `open` decides. When it turns true the dialog element is opened with showModal(), which traps focus, makes the
// page behind inert and moves focus into the dialog; when it turns false, or the dialog leaves the page while open,
// it is closed and focus goes back to the element that had it before. The reader closes it too, with Escape, the
// sheet's Close button or a footer button that submits the form with method="dialog": then `onClose` is called
// with the dialog's returnValue (the pressed button's value, or "" for Escape), and the app sets `open` to false.
// Like the behaviour modules it decides from the page as it is when the close event arrives: a dialog the app closed
// itself, or one that is open again by then, calls nothing.

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef, FormEventHandler, ReactNode, Ref } from "react";

type DialogElementProps = Omit<ComponentPropsWithRef<"dialog">, "open" | "onClose" | "onSubmit" | "title" | "children" | "role" | "aria-labelledby">;

interface ModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** The reader closed it. `returnValue` is the value of the button that closed it, or "" for Escape. */
  onClose: (returnValue: string) => void;
  /** The heading, an h2 that names the dialog. */
  title: ReactNode;
  /** The body. */
  children: ReactNode;
  /** The submit event of the form that holds the buttons. Call preventDefault() to validate or save before closing. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

// The open state, from the prop, on the dialog element. Returns the ref for the element.
function useModal({ open, onClose, ref }: { open: boolean; onClose: (returnValue: string) => void; ref: Ref<HTMLDialogElement> | undefined }) {
  const [node, setNode] = useState<HTMLDialogElement | null>(null);
  const latest = useRef({ open, onClose });
  // Where focus was when the dialog opened, in case the browser does not give it back on close.
  const opener = useRef<Element | null>(null);

  useLayoutEffect(() => {
    latest.current = { open, onClose };
  });

  const giveFocusBack = useCallback(() => {
    const was = opener.current;
    opener.current = null;
    const now = document.activeElement;
    if (was instanceof HTMLElement && was.isConnected && (now === null || now === document.body)) was.focus();
  }, []);

  useLayoutEffect(() => {
    if (!node) return;
    if (open && !node.open) {
      opener.current = document.activeElement;
      // Escape leaves returnValue as it was, so a value from the last time it closed must not be read again.
      node.returnValue = "";
      node.showModal();
    } else if (!open && node.open) {
      node.close();
      giveFocusBack();
    }
  }, [node, open, giveFocusBack]);

  useLayoutEffect(() => {
    if (!node) return;
    const closed = () => {
      // The app closed it, it has left the page, or it is open again: none of these is the reader closing it.
      if (node.open || !node.isConnected || !latest.current.open) return;
      giveFocusBack();
      latest.current.onClose(node.returnValue);
    };
    node.addEventListener("close", closed);
    return () => {
      node.removeEventListener("close", closed);
      // Leaving the page while open: close it first, so the page behind is no longer inert and focus goes back.
      if (node.open) {
        node.close();
        giveFocusBack();
      }
    };
  }, [node, giveFocusBack]);

  return useCallback(
    (element: HTMLDialogElement | null) => {
      setNode(element);
      setRef(ref, element);
    },
    [ref],
  );
}

type DialogVariant =
  /** The dialog grows with its content. */
  | { variant?: "default"; bodyLabel?: never }
  /** The title and footer stay and the body scrolls. A body with no control in it takes a label, so the keyboard can scroll it. */
  | { variant: "scroll"; bodyLabel?: string }
  /** The confirm dialog of a step that loses something: an alert dialog, described by its body, Cancel first. */
  | { variant: "confirm"; bodyLabel?: never };

export type DialogProps = DialogElementProps &
  ModalProps &
  DialogVariant & {
    /** The buttons: the primary first and Cancel second, or for a confirm dialog Cancel first and the destructive one second. */
    footer: ReactNode;
  };

/** The dialog, on ds-dialog, or the confirm dialog with variant="confirm". */
export function Dialog({ open, onClose, title, children, footer, onSubmit, variant = "default", bodyLabel, className, ref, ...rest }: DialogProps) {
  const id = useId();
  const dialogRef = useModal({ open, onClose, ref });
  const confirm = variant === "confirm";
  const classes = ["ds-dialog", variant === "scroll" ? "ds-dialog--scroll" : "", confirm ? "ds-confirm-dialog" : "", className].filter(Boolean).join(" ");
  const scrollable = bodyLabel === undefined ? {} : { tabIndex: 0, role: "group", "aria-label": bodyLabel };

  return (
    <dialog
      {...rest}
      ref={dialogRef}
      className={classes}
      role={confirm ? "alertdialog" : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={confirm ? `${id}-body` : rest["aria-describedby"]}
    >
      <form className="ds-dialog__panel" method="dialog" onSubmit={onSubmit}>
        <h2 className="ds-dialog__title" id={`${id}-title`}>
          {title}
        </h2>
        <div className="ds-dialog__body" id={confirm ? `${id}-body` : undefined} {...scrollable}>
          {children}
        </div>
        <div className={confirm ? "ds-dialog__footer ds-confirm-dialog__actions" : "ds-dialog__footer"}>{footer}</div>
      </form>
    </dialog>
  );
}

export type SheetProps = DialogElementProps &
  ModalProps & {
    /** The Close button's name, which says what it closes, such as "Close filters". */
    closeLabel: string;
    /** The footer, with the sheet's one primary button first. With a footer, the body and the footer are one form. */
    footer?: ReactNode;
    /** For a body with no control in it that may scroll, so the keyboard can scroll it. */
    bodyLabel?: string;
    /** Where the app serves the sprite, for the Close icon. */
    spriteHref?: string;
  };

/** The sheet, on ds-sheet: a bottom sheet on a phone and a side panel from 768px. */
export function Sheet({ open, onClose, title, children, footer, onSubmit, closeLabel, bodyLabel, spriteHref = "icons.svg", className, ref, ...rest }: SheetProps) {
  const id = useId();
  const dialogRef = useModal({ open, onClose, ref });
  const scrollable = bodyLabel === undefined ? {} : { tabIndex: 0, role: "group", "aria-label": bodyLabel };
  const body = (
    <div className="ds-sheet__body" {...scrollable}>
      {children}
    </div>
  );

  return (
    <dialog {...rest} ref={dialogRef} className={["ds-sheet", className].filter(Boolean).join(" ")} aria-labelledby={`${id}-title`}>
      <form className="ds-sheet__header" method="dialog">
        <h2 className="ds-sheet__title" id={`${id}-title`}>
          {title}
        </h2>
        <button type="submit" className="ds-button ds-button--quiet" value="close" aria-label={closeLabel}>
          <svg className="ds-button__icon" aria-hidden="true">
            <use href={`${spriteHref}#ds-icon-x`} />
          </svg>
        </button>
      </form>
      {footer === undefined ? (
        body
      ) : (
        <form className="ds-sheet__form" method="dialog" onSubmit={onSubmit}>
          {body}
          <div className="ds-sheet__footer">{footer}</div>
        </form>
      )}
    </dialog>
  );
}

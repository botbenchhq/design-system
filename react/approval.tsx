// The approval card, for a React app: one request from an agent, what it would run, where and why, with Allow and
// Decline. The markup of the approval component's examples. Copy it into the app, or import it from the vendored
// folder. It needs React 19 and busy-button.tsx beside it.
//
// Allow comes first and Decline at the far end of the row. Both are always shown and carry data-ds-critical. While
// an answer is sent (`sending`), the pressed button is a busy button, which says Allowing or Declining, keeps focus
// and ignores presses, and the other is disabled. An optional note goes in a disclosure before the actions, and the
// one Decline sends it: the card never has a second decline button. The app removes the card once the request is
// answered, and moves focus to the next card or the view's heading.

import { useId } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { BusyButton } from "./busy-button.tsx";

/** A risk line, which always starts with the words of its level. An elevated request always has one. */
export type ApprovalRisk = { level: "normal"; line: `Normal risk${string}` } | { level: "elevated"; line: `Elevated risk${string}` };

export interface ApprovalFact {
  /** What the fact is, such as Role. */
  term: string;
  value: ReactNode;
}

export interface ApprovalNote {
  /** The field's label, which says Allow does not send it, or a description that does. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  /** The disclosure's summary. */
  summary?: string;
  maxLength?: number;
}

export interface ApprovalLabels {
  allow?: string;
  allowing?: string;
  decline?: string;
  declining?: string;
}

type Heading = "h2" | "h3" | "h4" | "h5" | "h6";

export type ApprovalProps = Omit<ComponentPropsWithRef<"article">, "children" | "title" | "aria-labelledby"> & {
  /** Who asks and for what, such as "Claude Code asks to run a command". */
  title: ReactNode;
  /** The heading's level: one below the heading the card sits under. h2 by default. */
  heading?: Heading;
  risk?: ApprovalRisk;
  /** Exactly what would run. Characters that cannot be seen are written out by code point. */
  command: string;
  /** Where it would run, under the term Directory. */
  folder?: ReactNode;
  /** The agent's reason, under the term Its reason. */
  reason?: ReactNode;
  /** Further facts, between the folder and the reason, such as Role and Task. */
  facts?: readonly ApprovalFact[];
  /** The terms for the folder and the reason, in the app's words. */
  terms?: { folder?: string; reason?: string };
  /** Supporting detail in a disclosure, such as the full request. It holds no control needed to answer. */
  details?: { summary: string; content: ReactNode };
  /** A note the one Decline sends. */
  note?: ApprovalNote;
  /** More of the card, after the facts, such as a line about where the request comes from. */
  children?: ReactNode;
  /** Why the last answer was not sent, saying that nothing was allowed. */
  error?: ReactNode;
  /** The answer being sent. */
  sending?: "allow" | "decline" | null;
  /** Whether Allow is the view's primary action: a view that shows this one request. False in a list or a queue. */
  primary?: boolean;
  labels?: ApprovalLabels;
  onAllow: () => void;
  /** Called with the note as typed, or "" when there is no note. */
  onDecline: (note: string) => void;
};

/** Text with the characters that cannot be seen, or that reorder what is read, written out by code point. */
export function visibleText(text: string): string {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]/g, (c) => `\\u{${(c.codePointAt(0) ?? 0).toString(16)}}`);
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <li className="ds-approval__fact">
      <span className="ds-approval__term">{term}</span> <span className="ds-approval__value">{children}</span>
    </li>
  );
}

export function Approval({
  title,
  heading: Title = "h2",
  risk,
  command,
  folder,
  reason,
  facts = [],
  terms,
  details,
  note,
  children,
  error,
  sending = null,
  primary = true,
  labels,
  onAllow,
  onDecline,
  className,
  ...rest
}: ApprovalProps) {
  const id = useId();
  const classes = ["ds-approval", risk?.level === "elevated" ? "ds-approval--elevated" : "", className].filter(Boolean).join(" ");
  const shown: ApprovalFact[] = [
    ...(folder === undefined ? [] : [{ term: terms?.folder ?? "Directory", value: folder }]),
    ...facts,
    ...(reason === undefined ? [] : [{ term: terms?.reason ?? "Its reason", value: reason }]),
  ];

  return (
    <article {...rest} className={classes} aria-labelledby={`${id}-title`}>
      {risk && <p className="ds-approval__risk">{risk.line}</p>}
      <Title className="ds-approval__title" id={`${id}-title`}>
        {title}
      </Title>
      <pre className="ds-approval__command">{visibleText(command)}</pre>
      {shown.length > 0 && (
        <ul className="ds-approval__facts">
          {shown.map((fact) => (
            <Fact key={fact.term} term={fact.term}>
              {fact.value}
            </Fact>
          ))}
        </ul>
      )}
      {children}
      {details && (
        <details className="ds-approval__details">
          <summary className="ds-approval__summary">{details.summary}</summary>
          {details.content}
        </details>
      )}
      {note && (
        <details className="ds-approval__details">
          <summary className="ds-approval__summary">{note.summary ?? "Add a note for the agent"}</summary>
          <div className="ds-approval__note">
            <div className="ds-field">
              <label className="ds-field__label" htmlFor={`${id}-note`}>
                {note.label}
              </label>
              <input
                className="ds-field__control"
                id={`${id}-note`}
                type="text"
                name="note"
                autoComplete="off"
                maxLength={note.maxLength ?? 2000}
                value={note.value}
                onChange={(event) => note.onChange(event.target.value)}
                aria-describedby={note.description === undefined ? undefined : `${id}-note-description`}
              />
              {note.description !== undefined && (
                <p className="ds-field__description" id={`${id}-note-description`}>
                  {note.description}
                </p>
              )}
            </div>
          </div>
        </details>
      )}
      {error !== undefined && error !== null && error !== false && (
        <p className="ds-approval__error" role="alert">
          {error}
        </p>
      )}
      <div className="ds-approval__actions">
        <BusyButton
          variant={primary ? "primary" : "secondary"}
          data-ds-critical=""
          busy={sending === "allow"}
          busyLabel={labels?.allowing ?? "Allowing"}
          disabled={sending === "decline"}
          onClick={onAllow}
        >
          {labels?.allow ?? "Allow"}
        </BusyButton>
        <BusyButton
          data-ds-critical=""
          busy={sending === "decline"}
          busyLabel={labels?.declining ?? "Declining"}
          disabled={sending === "allow"}
          onClick={() => onDecline(note?.value ?? "")}
        >
          {labels?.decline ?? "Decline"}
        </BusyButton>
      </div>
    </article>
  );
}

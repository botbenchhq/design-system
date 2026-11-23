// A screen built from the dialog, sheet, menu, approval and icon-only busy buttons of the React source, for the
// browser tests, under StrictMode. Each test drives it by keyboard and reads what the app was told from window.

import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Approval } from "../../../dist/react/approval.tsx";
import { BusyButton } from "../../../dist/react/busy-button.tsx";
import { Dialog, Sheet } from "../../../dist/react/dialog.tsx";
import { useMenu } from "../../../dist/react/use-menu.ts";

type Open = "rename" | "delete" | "filters" | null;

declare global {
  interface Window {
    closes: string[];
    chosen: string[];
    answers: string[];
    dictated: number;
    copied: number;
    setOpen: (open: Open) => void;
    setShown: (shown: boolean) => void;
    setSending: (sending: "allow" | "decline" | null) => void;
    setError: (error: string | null) => void;
    setTranscribing: (busy: boolean) => void;
  }
}

window.closes = [];
window.chosen = [];
window.answers = [];
window.dictated = 0;
window.copied = 0;

const SPRITE = "/icons.svg";

function TaskMenu() {
  const menu = useMenu();
  const choose = (action: string) => () => {
    window.chosen.push(action);
    menu.close();
  };
  return (
    <div className="ds-cluster">
      <button type="button" className="ds-button" {...menu.buttonProps}>
        Task actions
        <svg className="ds-button__icon" aria-hidden="true">
          <use href={`${SPRITE}#ds-icon-chevron-down`} />
        </svg>
      </button>
      <div className="ds-menu" {...menu.menuProps} aria-label="Task actions">
        <div className="ds-menu__section" role="group" aria-labelledby="menu-branch">
          <div className="ds-menu__label" id="menu-branch" role="presentation">
            Branch fix/login-timeout
          </div>
          <button className="ds-menu__item" {...menu.itemProps} onClick={choose("copy")}>
            <svg className="ds-menu__icon" aria-hidden="true">
              <use href={`${SPRITE}#ds-icon-copy`} />
            </svg>
            Copy branch name
          </button>
          <button className="ds-menu__item" {...menu.itemProps} aria-disabled="true" onClick={() => window.chosen.push("pull request")}>
            Open pull request (push the branch first)
          </button>
          <button className="ds-menu__item" {...menu.itemProps} onClick={choose("rebase")}>
            Rebase onto main
          </button>
          <button className="ds-menu__item" {...menu.itemProps} onClick={choose("terminal")}>
            Open a terminal in the worktree
          </button>
        </div>
        <hr className="ds-menu__divider" />
        <button className="ds-menu__item ds-menu__item--danger" {...menu.itemProps} onClick={choose("delete")}>
          Delete task 41
        </button>
      </div>
      <button type="button" className="ds-button" onContextMenu={(event) => (event.preventDefault(), menu.open())}>
        After the menu
      </button>
    </div>
  );
}

function Screen() {
  const [open, setOpen] = useState<Open>(null);
  const [shown, setShown] = useState(true);
  const [sending, setSending] = useState<"allow" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [listening, setListening] = useState(false);
  window.setOpen = (next) => flushSync(() => setOpen(next));
  window.setShown = (next) => flushSync(() => setShown(next));
  window.setSending = (next) => flushSync(() => setSending(next));
  window.setError = (next) => flushSync(() => setError(next));
  window.setTranscribing = (next) => flushSync(() => setTranscribing(next));

  const closed = (which: string) => (value: string) => {
    window.closes.push(`${which}:${value}`);
    setOpen(null);
  };

  return (
    <main className="ds-container ds-stack">
      <h1>Task 41</h1>
      <div className="ds-cluster">
        <button type="button" className="ds-button" aria-haspopup="dialog" onClick={() => setOpen("rename")}>
          Rename branch
        </button>
        <button type="button" className="ds-button ds-button--danger" aria-haspopup="dialog" onClick={() => setOpen("delete")}>
          Delete workspace
        </button>
        <button type="button" className="ds-button" aria-haspopup="dialog" onClick={() => setOpen("filters")}>
          Filter runs
        </button>
      </div>

      {shown && (
        <Dialog
          open={open === "rename"}
          onClose={closed("rename")}
          title="Rename the branch"
          footer={
            <>
              <button type="submit" className="ds-button ds-button--primary" value="rename">
                Rename branch
              </button>
              <button type="submit" className="ds-button" value="cancel" formNoValidate>
                Cancel
              </button>
            </>
          }
        >
          <div className="ds-field">
            <label className="ds-field__label" htmlFor="branch-name">
              Branch name
            </label>
            <input className="ds-field__control" id="branch-name" type="text" name="branch" required autoComplete="off" defaultValue="fix/login-timeout" />
          </div>
        </Dialog>
      )}
      <Dialog
        variant="confirm"
        open={open === "delete"}
        onClose={closed("delete")}
        title="Delete the workspace api-refactor?"
        footer={
          <>
            <button type="submit" className="ds-button" value="cancel">
              Cancel
            </button>
            <button type="submit" className="ds-button ds-button--danger" value="delete">
              Delete workspace
            </button>
          </>
        }
      >
        <p>This removes the workspace from this machine and cannot be undone. You will lose:</p>
        <ul className="ds-confirm-dialog__losses">
          <li className="ds-confirm-dialog__loss">3 changed files that were never committed</li>
        </ul>
      </Dialog>
      <Sheet
        open={open === "filters"}
        onClose={closed("filters")}
        title="Filter runs"
        closeLabel="Close filters"
        spriteHref={SPRITE}
        footer={
          <>
            <button type="submit" className="ds-button ds-button--primary" value="apply">
              Apply filters
            </button>
            <button type="submit" className="ds-button" value="clear">
              Clear filters
            </button>
          </>
        }
      >
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="filter-branch">
            Branch name contains
          </label>
          <input className="ds-field__control" id="filter-branch" type="text" name="branch" autoComplete="off" defaultValue="fix/" />
        </div>
      </Sheet>

      <TaskMenu />

      <Approval
        title="Claude Code asks to run a command"
        risk={{ level: "elevated", line: "Elevated risk: deletes files outside the task's worktree" }}
        command={"rm -rf ../shared-config/.cache​"}
        folder="../shared-config (outside the task's worktree)"
        facts={[{ term: "Role", value: "Implementer" }]}
        reason="The old cache holds a stale session-store build that makes the tests fail."
        note={{ label: "Note to the agent", value: note, onChange: setNote, description: "Sent when you decline. Allow does not send it." }}
        error={error}
        sending={sending}
        onAllow={() => window.answers.push("allow")}
        onDecline={(typed) => window.answers.push(`decline:${typed}`)}
      />

      <div className="ds-cluster">
        <BusyButton
          icon="mic"
          variant="quiet"
          spriteHref={SPRITE}
          aria-label="Dictate"
          aria-pressed={listening}
          busy={transcribing}
          onClick={() => {
            window.dictated += 1;
            setListening((was) => !was);
          }}
        />
        <BusyButton icon="copy" spriteHref={SPRITE} aria-label="Copy branch name" busy={transcribing} busyLabel="Copying branch name" onClick={() => (window.copied += 1)} />
      </div>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Screen />
    </StrictMode>,
  );
}

// Both pieces used as an app would, under the strictest settings an app is likely to have.

import { useRef, useState } from "react";
import { BusyButton } from "../../../dist/react/busy-button.tsx";
import type { BusyButtonProps } from "../../../dist/react/busy-button.tsx";
import { useTranscript } from "../../../dist/react/use-transcript.ts";
import type { Transcript } from "../../../dist/react/use-transcript.ts";

export function Composer({ rows }: { rows: string[] }) {
  const [sending, setSending] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const transcript: Transcript = useTranscript({ rowCount: rows.length });
  const { scrollerRef, logRef, newCount, jumpButtonProps, jumpToLatest, following } = transcript;
  const shared: BusyButtonProps = { busy: sending, busyLabel: "Sending", children: "Send" };

  return (
    <form onSubmit={() => setSending(true)}>
      <div ref={scrollerRef} data-following={following}>
        <ol ref={logRef} role="log" aria-live="off" aria-label="Transcript">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ol>
      </div>
      <div className="ds-jump-to-latest" hidden={newCount === 0}>
        <button type="button" className="ds-jump-to-latest__button" {...jumpButtonProps}>
          <span className="ds-jump-to-latest__count">{newCount === 1 ? "1 new step" : `${newCount} new steps`}</span> Jump to latest
        </button>
      </div>
      <BusyButton ref={button} type="submit" variant="primary" busy={sending} busyLabel="Sending" icon="plus" spriteHref="/icons.svg">
        Send
      </BusyButton>
      <BusyButton {...shared} />
      <BusyButton size="small" variant="quiet" onClick={jumpToLatest} aria-label="Jump to the newest row" data-testid="plain">
        Latest
      </BusyButton>
      <BusyButton busy busyLabel="Deleting workspace" variant="danger" disabled={false}>
        Delete workspace
      </BusyButton>
    </form>
  );
}

// The dialog, the sheet, the menu hook, the approval card and the icon-only busy buttons, as an app would use them.

import { Dialog, Sheet } from "../../../dist/react/dialog.tsx";
import type { DialogProps } from "../../../dist/react/dialog.tsx";
import { useMenu } from "../../../dist/react/use-menu.ts";
import { Approval, visibleText } from "../../../dist/react/approval.tsx";
import type { ApprovalRisk } from "../../../dist/react/approval.tsx";

export function Layer({ transcribing, listening }: { transcribing: boolean; listening: boolean }) {
  const [renaming, setRenaming] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<"allow" | "decline" | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menu = useMenu();
  const risk: ApprovalRisk = { level: "elevated", line: "Elevated risk: deletes files outside the task's worktree" };
  const confirm: DialogProps = {
    variant: "confirm",
    open: false,
    onClose: (value) => value === "delete" && setRenaming(false),
    title: "Delete the workspace api-refactor?",
    footer: null,
    children: <p>This cannot be undone.</p>,
  };

  return (
    <>
      <Dialog ref={dialogRef} open={renaming} onClose={() => setRenaming(false)} title="Rename the branch" footer={<BusyButton type="submit" value="rename" variant="primary">Rename branch</BusyButton>} onSubmit={(event) => event.currentTarget.reset()} data-testid="rename">
        <p>The open pull request follows the new name.</p>
      </Dialog>
      <Dialog variant="scroll" bodyLabel="Changed files" open={false} onClose={() => {}} title="Commit 12 changed files?" footer={null}>
        <ul />
      </Dialog>
      <Dialog {...confirm} />
      <Sheet open={filtering} onClose={(value) => value === "apply" && setFiltering(false)} title="Filter runs" closeLabel="Close filters" spriteHref="/icons.svg" footer={<button type="submit" className="ds-button ds-button--primary" value="apply">Apply filters</button>}>
        <p>Filters</p>
      </Sheet>
      <Sheet open={false} onClose={() => {}} title="Run 7" closeLabel="Close run details" bodyLabel="Run details">
        <p>Finished.</p>
      </Sheet>

      <button type="button" className="ds-button" {...menu.buttonProps}>Task actions</button>
      <div className="ds-menu" {...menu.menuProps} aria-label="Task actions">
        <button className="ds-menu__item" {...menu.itemProps} onClick={menu.close}>Copy branch name</button>
        <button className="ds-menu__item" {...menu.itemProps} role="menuitemcheckbox" aria-checked="true">Wrap lines</button>
      </div>
      <a href="#row" onContextMenu={(event) => (event.preventDefault(), menu.open())}>Row</a>

      <Approval
        title="Claude Code asks to run a command"
        heading="h3"
        risk={risk}
        command={visibleText("rm -rf ../shared-config/.cache")}
        folder="../shared-config (outside the task's worktree)"
        reason="The old cache holds a stale build."
        facts={[{ term: "Role", value: "Implementer" }]}
        terms={{ reason: "Claude Code's reason" }}
        details={{ summary: "Show the full request", content: <pre className="ds-approval__command">{"{}"}</pre> }}
        note={{ label: "Note to the agent", value: note, onChange: setNote, description: "Sent when you decline. Allow does not send it." }}
        error={null}
        sending={sending}
        primary={false}
        labels={{ allow: "Allow once", decline: "Deny", declining: "Denying" }}
        onAllow={() => setSending("allow")}
        onDecline={(typed) => setSending(typed === "" ? "decline" : null)}
      />
      <Approval title="Claude Code asks to read a file" command="docs/runbooks/session-store.md" risk={{ level: "normal", line: "Normal risk: reads one file" }} onAllow={() => {}} onDecline={() => {}} />

      <BusyButton icon="mic" variant="quiet" aria-label="Dictate" aria-pressed={listening} busy={transcribing} spriteHref="/icons.svg" />
      <BusyButton icon="copy" aria-label="Copy branch name" busy={transcribing} busyLabel="Copying branch name" />
      {/* As callers before the icon-only forms wrote them. */}
      <BusyButton icon="plus" spriteHref="/icons.svg" className="ds-icon-button" aria-label="Add context" aria-haspopup="dialog">
        {null}
      </BusyButton>
      <BusyButton type="submit" variant="primary" busy={transcribing} busyLabel={listening ? "Sending" : "Starting"} disabled={false} aria-describedby="reason" {...(listening ? { "aria-label": "Send to 2 agents" } : {})}>
        Send
      </BusyButton>
      <BusyButton size="small" className="ds-composer__chip" aria-haspopup="dialog" aria-describedby="reason">
        <span className="ds-composer__value">Repository</span>
      </BusyButton>
    </>
  );
}

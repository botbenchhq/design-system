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

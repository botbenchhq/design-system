// A small screen built from the shipped React source, for the browser tests: a transcript that follows its
// newest row, its jump-to-latest control and a composer with a busy Send button, all under StrictMode.

import { StrictMode, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { BusyButton } from "../../../dist/react/busy-button.tsx";
import { useTranscript } from "../../../dist/react/use-transcript.ts";

declare global {
  interface Window {
    addRows: (count: number) => void;
    setBusy: (busy: boolean) => void;
    sent: number;
    renders: number;
  }
}

window.sent = 0;
window.renders = 0;

function Run() {
  const [rows, setRows] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { scrollerRef, logRef, newCount, jumpButtonProps } = useTranscript({ rowCount: rows.length });
  window.renders += 1;
  // Synchronous, so a test can change the scroll position and add rows before any scroll event arrives.
  window.addRows = (count) =>
    flushSync(() => setRows((have) => [...have, ...Array.from({ length: count }, (_, at) => `Row ${have.length + at + 1}. `.repeat(6))]));
  window.setBusy = (next) => flushSync(() => setBusy(next));

  const send = (event: FormEvent) => {
    event.preventDefault();
    window.sent += 1;
  };

  return (
    <main className="ds-container ds-stack">
      <h1>Run 4182</h1>
      <div id="scroller" ref={scrollerRef}>
        <div ref={logRef} role="log" aria-live="off" aria-label="Transcript of run 4182">
          <ol>
            {rows.map((row) => (
              <li key={row} className="ds-message">
                {row}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="ds-jump-to-latest" hidden={newCount === 0}>
        <button type="button" className="ds-jump-to-latest__button" {...jumpButtonProps}>
          <span className="ds-jump-to-latest__count">{newCount === 1 ? "1 new step" : newCount > 1 ? `${newCount} new steps` : ""}</span> Jump to latest
        </button>
      </div>
      <form onSubmit={send} className="ds-stack">
        <label htmlFor="prompt">Prompt</label>
        <textarea id="prompt" name="prompt" />
        <BusyButton type="submit" variant="primary" busy={busy} busyLabel="Sending prompt">
          Send prompt
        </BusyButton>
      </form>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Run />
    </StrictMode>,
  );
}

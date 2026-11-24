// Each line after an expect-error comment must fail to type check. If one starts to pass, tsc reports the comment as unused.

import { BusyButton } from "../../../dist/react/busy-button.tsx";
import { useTranscript } from "../../../dist/react/use-transcript.ts";

export function Misuse({ busy }: { busy: boolean }) {
  // @ts-expect-error a hook without the row count
  const transcript = useTranscript({});
  // @ts-expect-error the count is a number
  const newCount: string = transcript.newCount;
  return (
    <>
      {newCount}
      {/* @ts-expect-error busy without the words shown while busy */}
      <BusyButton busy>Send</BusyButton>
      {/* @ts-expect-error a busy state that can be true, without the words shown while busy */}
      <BusyButton busy={busy}>Send</BusyButton>
      {/* @ts-expect-error an unknown variant */}
      <BusyButton variant="ghost">Send</BusyButton>
      {/* @ts-expect-error an unknown size */}
      <BusyButton size="huge">Send</BusyButton>
      {/* @ts-expect-error the smallest size is for an icon-only button */}
      <BusyButton size="xsmall">Send</BusyButton>
      {/* @ts-expect-error an icon-only button has no large size */}
      <BusyButton icon="copy" aria-label="Copy branch name" size="large" />
      {/* @ts-expect-error a button needs a label */}
      <BusyButton />
    </>
  );
}

import { Dialog, Sheet } from "../../../dist/react/dialog.tsx";
import { Approval } from "../../../dist/react/approval.tsx";

export function LayerMisuse({ busy }: { busy: boolean }) {
  return (
    <>
      {/* @ts-expect-error an icon-only toggle keeps its name, so it takes no busyLabel */}
      <BusyButton icon="mic" aria-label="Dictate" aria-pressed={false} busy={busy} busyLabel="Transcribing" />
      {/* @ts-expect-error an icon-only button that can be busy, without the name it has while busy */}
      <BusyButton icon="copy" aria-label="Copy branch name" busy={busy} />
      {/* @ts-expect-error an icon-only button without a name */}
      <BusyButton icon="copy" />
      {/* @ts-expect-error a dialog without its title */}
      <Dialog open onClose={() => {}} footer={null}>Body</Dialog>
      {/* @ts-expect-error open and closed from a prop, so the open state is required */}
      <Dialog onClose={() => {}} title="Rename" footer={null}>Body</Dialog>
      {/* @ts-expect-error a body label is for the scrolling dialog */}
      <Dialog variant="confirm" bodyLabel="Files" open onClose={() => {}} title="Delete?" footer={null}>Body</Dialog>
      {/* @ts-expect-error a sheet's Close button needs a name */}
      <Sheet open onClose={() => {}} title="Filters">Body</Sheet>
      {/* @ts-expect-error an elevated risk line starts with Elevated risk */}
      <Approval title="Asks" command="rm" risk={{ level: "elevated", line: "Normal risk: fine" }} onAllow={() => {}} onDecline={() => {}} />
      {/* @ts-expect-error an answer is Allow or Decline */}
      <Approval title="Asks" command="rm" sending="grant" onAllow={() => {}} onDecline={() => {}} />
      {/* @ts-expect-error a card needs Decline */}
      <Approval title="Asks" command="rm" onAllow={() => {}} />
    </>
  );
}

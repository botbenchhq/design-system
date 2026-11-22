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
      <BusyButton size="large">Send</BusyButton>
      {/* @ts-expect-error a button needs a label */}
      <BusyButton />
    </>
  );
}

// Following the latest row of a transcript, for a React app: the same rule as <ds-transcript> in
// behaviors/transcript.js. Copy it into the app, or import it from the vendored folder. It needs React 19.
//
// While the reader is within 60px of the bottom it keeps the bottom in view as rows arrive and as a row grows.
// When the reader scrolls up it stops and counts the rows added since. A press on the jump-to-latest button, or
// scrolling back to the bottom, starts it following again. It never moves focus.
//
// Put scrollerRef on the element that scrolls and logRef on the element with role="log" inside it, and pass
// the number of rows the log shows. Render the jump-to-latest block with hidden={newCount === 0}, the count in
// the app's own words, and spread jumpButtonProps on its button.

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

const NEAR = 60;

export interface TranscriptOptions {
  /** How many rows the log shows now. Rows added while the reader is away are counted from it. */
  rowCount: number;
}

export interface JumpButtonProps {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLElement>) => void;
}

export interface Transcript {
  /** A callback ref for the element that scrolls. */
  scrollerRef: (element: HTMLElement | null) => void;
  /** A callback ref for the element with role="log" that holds the rows. */
  logRef: (element: HTMLElement | null) => void;
  /** Rows added since the reader left the bottom. The jump-to-latest block is hidden when it is 0. */
  newCount: number;
  /** Whether the bottom is followed, as of the last scroll or growth. */
  following: boolean;
  /** Scrolls to the newest row and follows again, for the app's own use, such as after sending a prompt. */
  jumpToLatest: () => void;
  /** For the jump-to-latest button. */
  jumpButtonProps: JumpButtonProps;
}

interface Follower {
  rows: (count: number) => void;
  jump: (button?: HTMLElement) => void;
}

export function useTranscript({ rowCount }: TranscriptOptions): Transcript {
  const [scroller, scrollerRef] = useState<HTMLElement | null>(null);
  const [log, logRef] = useState<HTMLElement | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [following, setFollowing] = useState(true);
  const rowCountRef = useRef(rowCount);
  const followerRef = useRef<Follower | null>(null);

  useLayoutEffect(() => {
    if (!scroller || !log) return;
    const maxTop = () => scroller.scrollHeight - scroller.clientHeight;
    // The furthest the scroller could scroll when layout was last handled. Whether the reader is at the bottom
    // is always judged against it, never against the height the log has grown to since.
    let end = maxTop();
    let rows = rowCountRef.current;
    let added = 0;
    // Set while the jump button keeps focus after a press from the keyboard: hiding it would drop focus.
    let holding: (() => void) | null = null;
    // What React was last told, so a scroll event that changes nothing sets no state.
    let shownCount = 0;
    let shownFollowing = true;

    const publish = (count: number) => {
      if (count === shownCount || (count === 0 && holding)) return;
      shownCount = count;
      setNewCount(count);
    };
    const report = (atBottom: boolean) => {
      if (atBottom === shownFollowing) return;
      shownFollowing = atBottom;
      setFollowing(atBottom);
    };
    const toBottom = () => scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });

    // The one place that decides, as in the custom element. The scroll event, the resize entry and the commit of
    // new rows may come in any order, but scrollTop is current at once. So the reader was at the bottom if
    // scrollTop is near the end as it was before any growth not yet handled; then the growth is followed and the
    // end updated. A late or duplicate call finds the same answer, and the scroll event of its own scroll to the
    // bottom reads as at the bottom. Only growth scrolls: a reader who moves up by less than NEAR stays there.
    const sync = (count = rows) => {
      const grown = Math.max(0, count - rows);
      rows = count;
      const next = maxTop();
      const atBottom = end - scroller.scrollTop <= NEAR;
      if (atBottom) {
        if (next !== end) toBottom();
        added = 0;
        publish(0);
      } else if (grown > 0) {
        added += grown;
        publish(added);
      }
      end = next;
      report(atBottom);
    };

    const jump = (button?: HTMLElement) => {
      toBottom();
      end = maxTop();
      added = 0;
      report(true);
      if (button && !holding && button.contains(document.activeElement)) {
        const release = () => {
          holding = null;
          publish(added);
        };
        button.addEventListener("focusout", release, { once: true });
        holding = () => button.removeEventListener("focusout", release);
      }
      publish(0);
    };

    const onScroll = () => sync();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // A row that grows in place, as a streamed reply does, changes only the size of the log.
    const sizes = new ResizeObserver(() => sync());
    sizes.observe(log);
    if (scroller !== log) sizes.observe(scroller);
    followerRef.current = { rows: sync, jump };

    return () => {
      followerRef.current = null;
      scroller.removeEventListener("scroll", onScroll);
      sizes.disconnect();
      holding?.();
      // A new scroller or log starts from the bottom, as the next attach assumes.
      setNewCount(0);
      setFollowing(true);
    };
  }, [scroller, log]);

  // After React has put the new rows in the page and before the browser paints, with scrollTop as the reader left it.
  useLayoutEffect(() => {
    rowCountRef.current = rowCount;
    followerRef.current?.rows(rowCount);
  }, [rowCount]);

  const jumpToLatest = useCallback(() => followerRef.current?.jump(), []);
  const jumpButtonProps = useMemo<JumpButtonProps>(
    () => ({
      onClick: (event) => followerRef.current?.jump(event.currentTarget),
      // A press with the pointer leaves focus where it was, which is usually the composer.
      onMouseDown: (event) => event.preventDefault(),
    }),
    [],
  );

  return { scrollerRef, logRef, newCount, following, jumpToLatest, jumpButtonProps };
}

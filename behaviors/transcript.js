// Following the latest row of a transcript, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/transcript.js"></script>
//
// <ds-transcript> wraps a transcript in the light DOM: the element with role="log" that holds the rows and,
// optionally, the jump-to-latest control. While the reader is at the bottom, within 60px, it keeps the bottom
// in view as rows arrive and as a row grows. When the reader scrolls up it stops, counts the rows added since
// and shows the control. A press on the control, or scrolling back to the bottom, starts it following again.
//
// What it reads:
//   [data-ds-scroller]  the element that scrolls, inside the element or the element itself. Without one, the page.
//   [role="log"]        the rows. Every li added under it while the reader is away counts as one.
//   [data-ds-jump]      the jump-to-latest control. Its button is pressed to jump.
//   [data-ds-count]     inside the control: the sentence for the count, with {count} where the number goes,
//                       such as data-ds-count="{count} new steps". data-ds-count-one holds the wording for one.
// What it sets: the hidden attribute on the control, the text of the count, and the scroll position.
// It never moves focus, and it adds no class and no inline style. It leaves the control as the markup has it
// until the reader scrolls or a row arrives. A framework app loads nothing and does the same itself.

const NEAR = 60;

class DsTranscript extends HTMLElement {
  connectedCallback() {
    if (this.rows) return;
    this.added = 0;
    // The furthest the scroller could scroll when layout was last handled. Whether the reader is at the
    // bottom is always judged against it, never against the height the log has grown to since.
    this.end = this.maxTop;

    // The page scrolls on the window, and an element on itself.
    this.source = this.scroller === document.scrollingElement ? window : this.scroller;
    this.source.addEventListener("scroll", this, { passive: true });
    this.addEventListener("click", this);
    this.addEventListener("mousedown", this);

    this.rows = new MutationObserver((records) => {
      const atBottom = this.sync();
      if (atBottom) return;
      const rows = records.flatMap((record) => [...record.addedNodes]).filter((node) => node.nodeType === 1 && node.matches("li"));
      if (rows.length === 0) return;
      this.added += rows.length;
      this.show();
    });
    this.rows.observe(this.log, { childList: true, subtree: true });

    // A row that grows in place changes no child list, only the size of the log.
    this.sizes = new ResizeObserver(() => this.sync());
    this.sizes.observe(this.log);
    if (this.scroller !== this.log) this.sizes.observe(this.scroller);
  }

  disconnectedCallback() {
    this.rows?.disconnect();
    this.sizes?.disconnect();
    this.rows = this.sizes = undefined;
    this.source?.removeEventListener("scroll", this);
    this.removeEventListener("click", this);
    this.removeEventListener("mousedown", this);
  }

  get scroller() {
    return this.closest("[data-ds-scroller]") ?? this.querySelector("[data-ds-scroller]") ?? document.scrollingElement;
  }

  get log() {
    return this.querySelector('[role="log"]') ?? this;
  }

  get jump() {
    return this.querySelector("[data-ds-jump]");
  }

  get maxTop() {
    const { scrollHeight, clientHeight } = this.scroller;
    return scrollHeight - clientHeight;
  }

  // The one place that decides. Every observer and the scroll event call it, in whatever order they come.
  // The reader's scrollTop is current at once, but its scroll event, the mutation record and the resize
  // entry may each arrive before or after the others. So the reader was at the bottom if scrollTop is near
  // the end as it was before any growth not yet handled; then the growth is followed and the end updated.
  // A call with nothing new to handle finds the same answer, so a late duplicate changes nothing, and the
  // scroll event of its own scroll to the bottom reads as at the bottom. Only growth scrolls: a reader who
  // moves up by less than NEAR is left there, or a slow scroll up could never leave the bottom.
  sync() {
    const end = this.maxTop;
    const atBottom = this.end - this.scroller.scrollTop <= NEAR;
    if (atBottom) {
      if (end !== this.end) this.toBottom();
      this.follow();
    }
    this.end = end;
    return atBottom;
  }

  // Without a transition, whatever scroll-behavior the page sets.
  toBottom() {
    const { scroller } = this;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
  }

  follow() {
    this.added = 0;
    const { jump } = this;
    if (!jump || jump.hidden || this.leaving) return;
    // Hiding the element that holds focus would drop focus to the page. It is hidden once focus leaves it.
    if (jump.contains(document.activeElement)) {
      this.leaving = true;
      jump.addEventListener("focusout", () => {
        this.leaving = false;
        if (this.added === 0) jump.hidden = true;
      }, { once: true });
    } else {
      jump.hidden = true;
    }
  }

  // Writes the count in the app's own words and shows the control.
  show() {
    const { jump } = this;
    if (!jump) return;
    const count = jump.querySelector("[data-ds-count]");
    if (count) {
      const one = count.dataset.dsCountOne;
      count.textContent = this.added === 1 && one ? one : count.dataset.dsCount.replace("{count}", String(this.added));
    }
    jump.hidden = false;
  }

  handleEvent(event) {
    if (event.type === "scroll") {
      this.sync();
      return;
    }
    const button = event.target.closest?.("[data-ds-jump] button");
    if (!button || !this.contains(button)) return;
    // A press with the pointer leaves focus where it was, which is usually the composer.
    if (event.type === "mousedown") {
      event.preventDefault();
      return;
    }
    this.toBottom();
    this.end = this.maxTop;
    this.follow();
  }
}

if (!customElements.get("ds-transcript")) customElements.define("ds-transcript", DsTranscript);

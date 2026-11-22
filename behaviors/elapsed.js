// Elapsed time that counts up by itself, for an app without a framework.
// One ES module with no dependencies: <script type="module" src="behaviors/elapsed.js"></script>
//
// <ds-elapsed datetime="2026-11-22T09:59:18Z">42 s</ds-elapsed> shows the time since its datetime attribute
// and writes it again once a second: 42 s, then 1 min 5 s, then 1 h 4 min. The text in the markup is what the
// reader sees until the module loads. It stops counting, and keeps what it shows, when its data-state attribute
// becomes anything but "running". With a duration attribute, an ISO 8601 duration such as PT2.4S, it shows that
// length and never counts: 380 ms, 2.4 s, 48 s, 4 min 12 s.
// It carries aria-live="off", and role="timer" while it counts, so assistive technology reads the time when the
// reader gets to it and never announces a tick. It adds no class and no inline style.
// A framework app loads nothing: it renders the same text into a span with aria-live="off" and updates it itself.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// An ISO 8601 duration of days, hours, minutes and seconds, in milliseconds. Null when it is not one.
function parseDuration(text) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(text.trim());
  if (!match || match.slice(1).every((part) => part === undefined)) return null;
  const [days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0));
  return days * DAY + hours * HOUR + minutes * MINUTE + seconds * SECOND;
}

// A length of time in the two largest units that matter. A length that is counting keeps its seconds under an
// hour, so the text changes on every tick. A finished one drops a zero and shows a short one more exactly.
function format(ms, finished) {
  if (finished && ms < SECOND) return `${Math.round(ms)} ms`;
  if (finished && ms < 10 * SECOND && ms % SECOND !== 0) return `${(ms / SECOND).toFixed(1)} s`;
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);
  if (days > 0) return finished && hours === 0 ? `${days} d` : `${days} d ${hours} h`;
  if (hours > 0) return finished && minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
  if (minutes > 0) return finished && seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
  return `${seconds} s`;
}

class DsElapsed extends HTMLElement {
  static observedAttributes = ["datetime", "duration", "data-state"];

  connectedCallback() {
    if (!this.hasAttribute("aria-live")) this.setAttribute("aria-live", "off");
    this.update();
  }

  disconnectedCallback() {
    this.stop();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.update();
  }

  // Counting: no fixed duration, and a state that is absent or says running.
  get counting() {
    return !this.hasAttribute("duration") && (this.dataset.state ?? "running") === "running";
  }

  stop() {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  update() {
    const fixed = parseDuration(this.getAttribute("duration") ?? "");
    if (fixed !== null) this.textContent = format(fixed, true);
    if (!this.counting) {
      // A state that has ended keeps the time it last showed.
      this.stop();
      if (this.getAttribute("role") === "timer") this.removeAttribute("role");
      return;
    }
    this.setAttribute("role", "timer");
    this.tick();
    this.timer ??= setInterval(() => this.tick(), SECOND);
  }

  tick() {
    const since = Date.parse(this.getAttribute("datetime") ?? "");
    if (Number.isNaN(since)) return;
    const text = format(Math.max(0, Date.now() - since), false);
    if (this.textContent !== text) this.textContent = text;
  }
}

if (!customElements.get("ds-elapsed")) customElements.define("ds-elapsed", DsElapsed);

import "../vendor/design-system/design-system.css";
// ds-waive raw-color: the partner logo colour is fixed by contract
const icon = "/vendor/design-system/icons.svg#ds-icon-check";
const config = "design-system.config.json";

export function Screen({ count }: { count: number }) {
  const status = document.querySelector("[data-ds-count]") as HTMLElement;
  status.dataset.dsCount = String(count);
  status.dataset.dsCountOne = "One new row";
  const findings = (globalThis as any).dsCheckDom?.();
  const Tabs = customElements.get("ds-tabs") as typeof DsTabs;
  return (
    <ds-transcript data-ds-scroller="">
      <button type="button" className="ds-button ds-button--primary" data-ds-critical style={{ "--ds-progress": "40%" }}>Stop</button>
      <svg aria-hidden="true"><use href={icon} /></svg>
    </ds-transcript>
  );
}

// None of these is the prefix.
const logwriter = "https://example.com/gwen/logs";
const reports = "https://example.com/gw-reports/today";
const gap = "--gwx-gap";
const word = "my-gw-thing";

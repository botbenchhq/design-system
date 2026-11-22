import "../vendor/groundwork/groundwork.css";
// gw-waive raw-color: the partner logo colour is fixed by contract
const icon = "/vendor/groundwork/icons.svg#gw-icon-check";
const config = "groundwork.config.json";

export function Screen({ count }: { count: number }) {
  const status = document.querySelector("[data-gw-count]") as HTMLElement;
  status.dataset.gwCount = String(count);
  status.dataset.gwCountOne = "One new row";
  const findings = (globalThis as any).gwCheckDom?.();
  const Tabs = customElements.get("gw-tabs") as typeof GwTabs;
  return (
    <gw-transcript data-gw-scroller="">
      <button type="button" className="gw-button gw-button--primary" data-gw-critical style={{ "--gw-progress": "40%" }}>Stop</button>
      <svg aria-hidden="true"><use href={icon} /></svg>
    </gw-transcript>
  );
}

// None of these is the prefix.
const logwriter = "https://example.com/gwen/logs";
const reports = "https://example.com/gw-reports/today";
const gap = "--gwx-gap";
const word = "my-gw-thing";

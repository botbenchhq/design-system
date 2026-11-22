export function Screen() {
  const card = document.querySelector(".gw-card__title");
  // gw-waive raw-color: an old waiver
  card?.style.setProperty("--gw-progress", "40%");
  return (
    <gw-transcript data-gw-scroller="">
      <button type="button" className="gw-button gw-button--small ds-stack">Go</button>
    </gw-transcript>
  );
}

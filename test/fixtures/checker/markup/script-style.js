export function setProgress(bar, fraction) {
  bar.style.setProperty("--gw-progress", `${fraction * 100}%`);
}

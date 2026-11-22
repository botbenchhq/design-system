// The two output forms of a run.

const count = (amount, noun) => `${amount} ${noun}${amount === 1 ? "" : "s"}`;

export function jsonReport(result) {
  return `${JSON.stringify({ ok: result.findings.length === 0, ...result }, null, 2)}\n`;
}

export function textReport({ findings, waivers, gaps, filesScanned }) {
  const lines = [];
  for (const finding of findings) {
    lines.push(`${finding.file}:${finding.line}  ${finding.rule}  ${finding.message}${finding.fix ? ` ${finding.fix}` : ""}`);
  }
  if (findings.length > 0) lines.push("");
  if (waivers.length > 0) {
    lines.push(`Waivers (${waivers.length}):`);
    for (const waiver of waivers) lines.push(`  ${waiver.file}:${waiver.line}  ${waiver.rule}  ${waiver.reason}`);
  }
  if (gaps.length > 0) {
    lines.push(`Declared gaps (${gaps.length}):`);
    for (const gap of gaps) lines.push(`  ${gap.name}  ${gap.classes.join(" ")}  ${gap.reason}`);
  }
  lines.push(
    `${count(findings.length, "finding")}, ${count(waivers.length, "waiver")}, ${count(gaps.length, "declared gap")}, ${count(filesScanned, "file")} scanned`,
  );
  return `${lines.join("\n")}\n`;
}

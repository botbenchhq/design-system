// An inline waiver is a comment holding `gw-waive <rule-id>: <reason>`.
// It covers findings of that rule on its own line and on the next line.

const WAIVER = /gw-waive\b[ \t]*([a-z][a-z-]*)?[ \t]*(?::(.*))?/;

// Findings that say the run itself cannot be trusted. No waiver covers them.
const NOT_WAIVABLE = new Set(["vendored-file-changed", "parse-error", "waiver-without-reason", "unused-waiver"]);

export function parseWaivers(text) {
  const waivers = [];
  text.split("\n").forEach((content, at) => {
    const match = content.match(WAIVER);
    if (!match) return;
    const reason = (match[2] ?? "").replace(/(\*\/\}?|-->)\s*$/, "").trim();
    waivers.push({ line: at + 1, rule: match[1] ?? "", reason });
  });
  return waivers;
}

// Splits findings into those that stand and those a waiver covers, and reports bad and unused waivers.
export function applyWaivers(findings, waiversByFile) {
  const invalid = [];
  const unused = [];
  const used = [];
  const waived = new Set();
  for (const [file, waivers] of waiversByFile) {
    for (const waiver of waivers) {
      if (waiver.rule === "" || waiver.reason === "") {
        invalid.push({
          file,
          line: waiver.line,
          rule: "waiver-without-reason",
          message: waiver.rule === "" ? "This waiver names no rule, so it is ignored." : `This waiver of ${waiver.rule} gives no reason, so it is ignored.`,
          fix: "Write it as: gw-waive <rule-id>: <reason>",
        });
        continue;
      }
      const covered = findings.filter(
        (finding) =>
          finding.file === file &&
          finding.rule === waiver.rule &&
          !NOT_WAIVABLE.has(finding.rule) &&
          (finding.line === waiver.line || finding.line === waiver.line + 1),
      );
      if (covered.length === 0) {
        unused.push({
          file,
          line: waiver.line,
          rule: "unused-waiver",
          message: `This waiver of ${waiver.rule} matches no finding on its line or the next.`,
          fix: "Remove the waiver.",
        });
        continue;
      }
      for (const finding of covered) waived.add(finding);
      used.push({ file, ...waiver });
    }
  }
  return { invalid, unused, used, standing: findings.filter((finding) => !waived.has(finding)) };
}

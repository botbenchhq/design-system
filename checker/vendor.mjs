// A consumer's copy of the system is read-only. hashes.json inside it lists the SHA-256 of every file.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const HASH_FILE = "hashes.json";

export function verifyVendored(vendorDir) {
  const changed = (name, message) => ({
    file: join(vendorDir, name),
    line: 1,
    rule: "vendored-file-changed",
    message,
    fix: "Restore the vendored copy from the design system. Change the system in its own repo, not here.",
  });
  const hashPath = join(vendorDir, HASH_FILE);
  if (!existsSync(hashPath)) return [changed(HASH_FILE, "The hash list of the vendored copy is missing.")];
  const { files } = JSON.parse(readFileSync(hashPath, "utf8"));
  const findings = [];
  for (const [name, expected] of Object.entries(files)) {
    const path = join(vendorDir, name);
    if (!existsSync(path)) {
      findings.push(changed(name, "This vendored file is missing."));
    } else if (createHash("sha256").update(readFileSync(path)).digest("hex") !== expected) {
      findings.push(changed(name, "This vendored file does not match its recorded hash."));
    }
  }
  return findings;
}

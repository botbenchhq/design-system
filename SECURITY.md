# Security policy

## Reporting a problem

Please report a security problem privately, through GitHub's private vulnerability reporting: open the repository's
**Security** tab and choose **Report a vulnerability**, or go to
<https://github.com/jon-lange/design-system/security/advisories/new>. Do not open a public issue, pull request or
discussion for it.

Say what you found, how to reproduce it, and what someone could do with it. The design system is maintained by one
person, so there is no fixed time for an answer, but every report is read, and you are credited in the advisory unless
you ask not to be.

## Supported versions

Only the latest version, the `version` in `package.json` on `main` (each has a section in
[`CHANGELOG.md`](CHANGELOG.md)). Fixes land on `main` in a new version; an app gets one by syncing a newer `dist/`.

## What the system is

Read a report in light of this:

- **An app copies `dist/` into its own repository** and uses nothing else from here. The system has no runtime
  dependencies and no server; it is CSS, fonts, icons and JSON, with optional code beside them.
- **The code it ships runs in an app's pages:** the behaviour modules in `behaviors/` (one custom element each) and the
  React source in `react/`. They set attributes, move focus and, for four modules, write text the app gave them in its
  markup.
- **The code it ships runs on a developer's computer or in an app's CI:** the checker (`checker/`, which reads the
  app's files and the built page), `scripts/sync.mjs` (which copies `dist/` into an app and writes `hashes.json`),
  `scripts/migrate-prefix.mjs` (a codemod over an app's files) and the optional Claude Code hook in `hooks/`.
- **The development tools in `package.json`** (Playwright, esbuild, React, Tailwind, TypeScript) are for this
  repository's build and tests only and are never shipped.

In scope, for example:

- A behaviour module or React file that turns text or attribute values from the page into markup or script, or that
  can be made to act on elements outside its own.
- The checker, the hook, the sync script or the codemod reading, writing or running anything outside the paths it was
  given, or running code found in the files it reads.
- A stylesheet that loads anything from outside the app's own copy.
- A `dist/` that does not match its source, or a sync that writes a copy whose files differ from `hashes.json`.

Out of scope:

- An app's own markup, scripts and server, including words the app puts into a component.
- Problems in a browser, or in a development tool listed above. Report those to the vendor.

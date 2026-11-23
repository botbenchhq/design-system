## What and why

<!-- What does this change, and why? Link the issue: "Fixes #123" or "Part of #123". -->

## How it was checked

<!-- The tests added or changed, and their counts from the run. The screenshots rewritten, if any, and that you
looked at each. Say what was not checked, and why. -->

## Checklist

- [ ] `npm run build` then `npm test` pass, and the regenerated `dist/` is committed with the source.
- [ ] After a component or gallery change: `npm run test:visual` passes. For a visual change you mean,
      `npm run test:visual:update` rewrote the screenshots, and each one was looked at and committed.
- [ ] After a change to a component a phone user meets, or to a behaviour module: `npm run test:visual:webkit` passes.
- [ ] A component or pattern follows `docs/authoring.md`; a new rule ID has its row in `rules/checker-rules.md`.
- [ ] No new token name, no runtime dependency, no class without `ds-` and no custom property without `--ds-`.
- [ ] A release raises `version` in `package.json` and adds its `## X.Y.Z` section to `CHANGELOG.md`, saying
      what an app must do.
- [ ] No secrets or personal details: no tokens, keys, email addresses or `/Users/<name>` paths other than the
      placeholders (`acme.example`, `/Users/mira`).
- [ ] Files copied from another project are listed in `NOTICE`.

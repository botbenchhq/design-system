# Contributing to the design system

Fixes, new components and better rules are welcome. The system is early and maintained by one person, so for anything
larger than a fix, open an issue first and say what you want to change. A component an app is missing is best asked for
with the entry from that app's gaps file ([consumer guide, step 3](docs/consumer-guide.md#3-add-the-config-file-and-the-gaps-file)).

## What to read first

- [`AGENTS.md`](AGENTS.md): the rules for this repository. `dist/` is generated, `tokens/tokens.css` is the one source
  of tokens, the token vocabulary is closed, every name starts with `ds-` or `--ds-`, there are no runtime
  dependencies, and what each folder holds.
- [`docs/authoring.md`](docs/authoring.md): the contract for a component or a page pattern, its stylesheet, examples
  and metadata, and what the build checks. Read it before adding or changing one.

## Run it and its tests

You need Node 24 or later and git. `npm install` fetches development tools only.

```sh
npm install
npm run build                # regenerates dist/ and prints the contrast report
npm test                     # unit tests, the checker over every example, and dist/ against a fresh build
npm run test:visual          # browser tests in the installed Google Chrome, against the committed screenshots
```

The gates, in this order:

- **Every change:** `npm run build`, then `npm test`. Commit the source and the regenerated `dist/` together; never
  edit a file in `dist/` by hand. `git status` must show no change in `dist/` you have not accounted for.
- **After changing a component, a pattern or the gallery:** `npm run test:visual`. It needs Google Chrome installed,
  and compares every gallery page with its screenshot in `test/visual/screenshots/`.
- **For a visual change you mean to make:** `npm run test:visual:update` rewrites the screenshots that differ. Look at
  every rewritten file and commit them with the change: they are what the review looks at.
- **After changing a component a phone user meets, or a behaviour module:** `npm run test:visual:webkit` as well
  (`npx playwright install webkit firefox` the first time). `npm run test:visual:firefox` runs the same tests in
  Firefox.

The screenshot baselines come from Google Chrome on the maintainer's Mac and its fonts, so on another platform
`npm run test:visual` can report differences that are not yours. Say so in the pull request rather than rewriting the
screenshots.

## What CI checks

Every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): the build, the committed `dist/`
against it, `npm audit`, `npm test`, the WebKit and Firefox projects, a gitleaks scan of the whole history and CodeQL.
The Chrome screenshot suite does not run in CI, for the reason above; run it yourself.

## Releases

A release raises `version` in `package.json` and adds a `## X.Y.Z` section to [`CHANGELOG.md`](CHANGELOG.md) in the
same change: what that version of `dist/` holds and what an app must do when it syncs it. When that change reaches
`main`, [`.github/workflows/release.yml`](.github/workflows/release.yml) tags `vX.Y.Z` and makes a GitHub Release
whose notes are that section.

## Reporting a security problem

Please do not open an issue. Use GitHub's private vulnerability reporting: the Security tab, then Report a
vulnerability. [`SECURITY.md`](SECURITY.md) says what is in scope.

## Conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

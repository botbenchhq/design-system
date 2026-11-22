# Blind-build trial brief

You are building three screens for a small web app that runs coding agents. The app is plain HTML and CSS with no build step. A design system is vendored at `vendor/design-system/`. Everything you may know about it is in that folder; start with `vendor/design-system/rules/core.md`.

Build these as three static HTML files in the app's root:

1. `approvals.html` — an approval queue. Three agents are each waiting for permission to run a command. For each: what it wants to run, in which directory, for which task, and why. The owner can allow or decline each one.
2. `settings.html` — settings for one repository: the base branch, whether to run tests before opening a pull request, notifications, a handful of rarely changed options, and a way to disconnect the repository.
3. `runs.html` — a runs board: what needs the owner, what is running, and what finished today, with enough detail to decide what to open.

Each file links `vendor/design-system/design-system.css` and loads nothing from another host. Write real content, not placeholder text.

When you are done, run the checker and fix what it reports:

    node vendor/design-system/checker/check.mjs --config design-system.config.json

Do not edit anything inside `vendor/design-system/`. Report the checker's final summary line and anything in the system that was missing or unclear.

# Security notes

The live site is plain static files: **no dependencies, no build step, nothing from npm is ever shipped.**

## Dev tooling (lint only) lives in `dev-tools/`
- Exact-pinned versions + committed `package-lock.json`; install with `npm ci` (never `npm install` for routine use).
- `.npmrc`: official registry only, `ignore-scripts=true` (no install-time code runs), `engine-strict`.
- `.vercelignore` + `"installCommand": ""` in `vercel.json` keep Vercel from installing or serving it.
- Run: `cd dev-tools && npm ci && npm run lint`; check advisories with `npm audit`.
- Updating a dependency: change the exact version, review the lockfile diff (only `registry.npmjs.org` URLs), run lint, commit.

## Checklist for the claude.ai network setting (account level)
1. Choose the narrowest option: **package managers only**, not "all domains". Add no extra domains.
2. Turn it off when you aren't installing anything; turn it on only for the task that needs it.
3. Never put secrets or API keys in the session environment.
4. Ask for new packages by name and version; skim what gets added to `package.json` and the lockfile.
5. Prefer no new dependency at all. This site needs none.
6. Review commits before merging; deploys come only from `main`.

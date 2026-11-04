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

## Audit log
**2026-11-04 full audit** (client code, service worker, hosting headers, worksheet API, Supabase database/storage, dependencies, secrets).
- Fixed: parallel guesses could skip the passcode lock-out (now an atomic database counter, `supabase/migrations/20261104_security_hardening.sql`);
  non-object JSON bodies returned a 500; new passcodes now need 8+ characters; the public database roles lost all table privileges;
  the site now sends CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and COOP headers.
- Verified OK: no secrets in the repo or git history; private storage bucket with file-type and size limits; row security on every table;
  signed URLs expire in 1 hour; stored values are never injected as HTML; tokens are HMAC-signed and expire; CORS allows only this site.
- Known and accepted: the passcode hash uses 100k PBKDF2 rounds; tokens last 30 days and the Lock button only clears the local copy
  (changing the passcode signs out every device); Google Fonts is loaded from Google, so a visitor's IP reaches Google.

# Contributing

Quick guide for anyone (human or agent) opening a PR.

## Project shape

psa-templates is a **static, no-build site** — plain HTML, vanilla JS
(`app.js`), and CSS, served as-is by Vercel. The only server-side piece is
`api/share.js` (a Vercel serverless function backed by Upstash Redis).
There is intentionally **no bundler, no framework, and no lint/test
toolchain** — keep changes in that spirit unless there's a deliberate
decision to add tooling.

## Code style

- Match the surrounding style in the file you touch. `app.js` is
  hand-formatted — don't reformat unrelated lines.
- **No `console.log`** in committed code. Remove debug prints before opening
  the PR.
- No secrets in the repo. Runtime config (Upstash credentials etc.) comes
  from Vercel env vars; only `.env.example` is committed.

## Commits

This repo uses **Conventional Commits** because release-please reads them
to generate the CHANGELOG and pick the next version number.

| Prefix      | Meaning                     | Bumps  |
| ----------- | --------------------------- | ------ |
| `feat:`     | New feature                 | minor  |
| `fix:`      | Bug fix                     | patch  |
| `perf:`     | Performance improvement     | patch  |
| `refactor:` | Behaviour-preserving change | patch  |
| `docs:`     | Documentation only          | none   |
| `test:`     | Tests only                  | none   |
| `ci:`       | CI / workflow changes       | none   |
| `chore:`    | Tooling / housekeeping      | hidden |
| `feat!:`    | Breaking change (or footer) | major  |

Always add a **scope** when a clear area is touched
(`feat(text):`, `fix(ui):`, `chore(deps):`). Keep messages concise — the
subject is the _what_, the body is the _why_.

## Branches

- Branch off `main`. Use a short, scoped name like `feat/plaintext-export`
  or `fix/share-link-expiry`.
- One topic per branch. Two unrelated changes → two branches.

## PRs

- Fill in what changed and why. Link the issue if there is one.
- Keep PRs small. Anything > ~400 changed lines should probably split.
- For UI changes, verify in a browser before marking ready.
- **Squash-merge by default** — keeps `main` linear and keeps Conventional
  Commit titles intact for release-please.

## Releases

You don't release manually. release-please opens (and keeps updated) a
release PR on every merge to `main`. Merging that PR cuts a `vX.Y.Z` tag
and updates `CHANGELOG.md`.

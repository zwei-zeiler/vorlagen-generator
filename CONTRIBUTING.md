# Contributing

Quick guide for anyone (human or agent) opening a PR.

## Project shape

psa-templates is a **static, no-build site** — plain HTML, vanilla JS
(`app.js`), and CSS, served as-is by Vercel. There is no server-side code
and no runtime dependency; share links carry the configuration in the URL
fragment. There is intentionally **no bundler, no framework, and no
lint/test toolchain** — keep changes in that spirit unless there's a
deliberate decision to add tooling.

## Code style

- Match the surrounding style in the file you touch. `app.js` is
  hand-formatted — don't reformat unrelated lines.
- **No `console.log`** in committed code. Remove debug prints before opening
  the PR.
- No secrets in the repo — the site has no backend and no runtime
  configuration to keep secret.

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

## License and contributions

psa-templates is **source-available, not open source** — see
[`LICENSE`](./LICENSE) (Business Source License 1.1) for what you may and may
not do with the code.

Erwins Enkel GmbH grants individual commercial licenses to companies that want
to offer the project to third parties. That only works if we hold sufficient
rights to the whole codebase, so contributions need a broader grant than the
license itself provides:

> By submitting a contribution, you grant Erwins Enkel GmbH a perpetual,
> worldwide, non-exclusive, royalty-free, irrevocable license — **including the
> right to sublicense** — to use, reproduce, modify, distribute, and otherwise
> exploit your contribution, under the Business Source License 1.1, under its
> Change License, and under separate commercial license terms. You confirm that
> you are entitled to grant this license for the contribution you submit.
>
> You keep the copyright in your contribution. This grant does not transfer
> ownership and does not stop you from using your own work elsewhere.

No signatures, no CLA bot — opening a PR is the agreement. If you cannot make
that grant (for example because your employer owns the code), say so in the PR
and we'll find another way.

Third-party material in the repo is listed in [`NOTICE.md`](./NOTICE.md) and is
excluded from the above.

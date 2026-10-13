# Contributing to Recomend

Thanks for your interest in contributing! This project is open source under the [AGPL-3.0-or-later](./LICENSE) license.

## Reporting issues

- Search existing issues before opening a new one.
- Include steps to reproduce, expected vs. actual behavior, and relevant environment details (platform: web/mobile, OS, app version).

## Submitting a pull request

1. Fork the repository and create your branch from `main`.
2. Follow the existing code style and conventions in the file(s) you touch.
3. Keep pull requests focused on a single change.
4. Make sure the project builds and lints locally (`bun run lint`, `bun run test`) before opening the PR.
5. PR titles must follow [Conventional Commits](https://www.conventionalcommits.org/) (checked automatically, see `.github/workflows/pr-title.yml`).

## Versioning

Releases are cut by [Release Please](https://github.com/googleapis/release-please) from the commits
on `main`, and the version they carry is the one the mobile app ships to the stores. Only commits
that touch `apps/mobile/` count towards it -- Release Please splits the history per package path, so
a change confined to the web app or to a library releases nothing.

The type in the pull request title is what decides the bump:

| Title                                      | Bump                        |
| ------------------------------------------ | --------------------------- |
| `fix:`, `perf:`, `revert:`                 | patch -- `1.8.0` -> `1.8.1` |
| `feat:`                                    | minor -- `1.8.0` -> `1.9.0` |
| `feat!:`, or a `BREAKING CHANGE:` footer   | major -- `1.8.0` -> `2.0.0` |
| `chore:`, `ci:`, `docs:`, `refactor:`, ... | nothing is released         |

Which makes the type a release decision, not a label. `feat` is for a capability a user would notice
and that belongs in the release notes; `fix` for everything else that ships; `!` only when old builds
stop working, or should -- an API contract they can no longer honour, a forced update through the
minimum-version gate.

Two things that bite:

- The `!` has to reach the **squash subject**. Squashing uses the pull request title when the branch
  has several commits, but the commit's own subject when it has exactly one -- so on a single-commit
  pull request, put the `!` in the commit too, or fix the title in the merge dialog.
- `bump-minor-pre-major` and `bump-patch-for-minor-pre-major` in `release-please-config.json` only
  apply **below 1.0.0**. They are there for a package that would start at `0.x`, and have no effect
  on mobile.

To force an exact version, add a `Release-As:` footer to the squash commit -- in the merge dialog, or
as the branch's last commit, since the pull request description is dropped when squashing:

```
Release-As: 2.0.0
```

## License of contributions

By submitting a pull request, you agree that your contribution is licensed under the project's [AGPL-3.0-or-later](./LICENSE) license.

## Questions

Open an issue or reach out at hello@recomend.app.

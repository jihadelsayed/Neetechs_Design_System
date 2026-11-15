# Changelog

All notable changes to `@neetechs/ui` are documented here. The project follows
[Semantic Versioning](https://semver.org/); while on `0.x`, minor versions may
add features and patch versions fix bugs. Breaking changes are always called
out explicitly and ship with compatibility aliases where feasible.

Releases are cut by `semantic-release` from Conventional Commits, but only
when the package owner manually runs the release workflow with `publish: true`.

## 0.1.0 — unreleased (release candidate)

### Added
- Soft navy dark palette with blue as the default brand accent (`--nt-bg-app: #202d42`,
  `--nt-accent: #528ef5`). Orange, green, purple, and neutral accents remain selectable.
- `NEETECHS_UI_VERSION` is generated from `package.json` at build time (`src/version.ts`).
- `npm run check:package`: packs the tarball, rejects development artifacts, installs it
  into a clean temporary consumer, resolves every export, and enforces a size budget.

### Fixed
- Dark theme + purple accent focus ring now meets non-text contrast requirements.
- `NEETECHS_UI_VERSION` reported `0.0.2` in the published `0.0.4` package; it now always
  matches the published version.
- Broken regular expressions in the brand-palette unit test that failed CI and blocked
  every release since `0.0.4`.
- Arabic heading browser test no longer treats harmless font-metric overflow (installed
  Noto Sans Arabic) as clipping.

### Changed
- CI: pushes to `main` run the full verification gate (static contracts, build, unit tests,
  Playwright, package check) but no longer publish automatically. Publishing requires a
  manual `workflow_dispatch` run with `publish: true`.

## 0.0.4 — 2026-07-14
- Responsive and page-pattern updates.

## 0.0.3 — 2026-07-13
- Automated npm release configuration.

## 0.0.2 — 2026-06-26
- Initial public package.

# Unified header release runbook — manual only

Status: release preparation. No publication, tag, consumer upgrade or deployment has been performed by this runbook. Use main; do not create branches or rely on GitHub Actions.

## 1. Verify source and local package

From a clean checkout of the design-system main:

```bash
git switch main
git pull --ff-only
git status --short
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run check:package
npm pack --dry-run
```

Stop on any failing command. Install any other browsers required by the actual Playwright configuration. Record the tested commit, Node/npm versions, browser results, tarball size and package API report. Do not run check:api --update merely to silence missing exports. Review additions intentionally. The isolated checks recorded in the roadmap are not a replacement for these gates.

Create the local tarball with npm pack only after the build and tests pass. Test the Angular and React adapters against that tarball; run MyAccount AOT, localization, SSR and browser regressions before release. Use a disposable checkout of main, not a new branch. Do not commit filesystem-based dependencies, tarballs or generated secrets.

## 2. Confirm version and npm access

```bash
npm config get registry
npm view @neetechs/ui versions --json --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
npm pkg get version
```

Source package.json, lockfile root and src/version.ts currently agree on 0.3.0. This does not establish that 0.3.0 is available for publication or that the current npm release includes header APIs. If 0.3.0 is already published, select the next available appropriate semver after inspecting the existing release; never overwrite a published version. Update version, lockfile and generated version together, and rerun all release gates against that exact commit. Do not create a tag or bump version before the owner approves the verified release.

## 3. Manual publication (only after approval and all gates)

Publish the exact locally validated tarball, not an untested rebuild. Replace the placeholder with its real filename:

```bash
npm publish ./neetechs-ui-VERSION.tgz --access public --registry=https://registry.npmjs.org/
```

Follow npm's authentication prompts locally. Never put credentials or OTPs in documentation or commit them. Do not invoke semantic-release or a workflow as well; that can create competing releases. Record the published version and integrity with npm view, install it into a clean consumer and verify the six root header functions and CSS/asset exports. Confirm the release's source commit and update the release notes.

## 4. MyAccount pilot and deployment

Read MyAccount docs/unified-header/README.md. Install the exact published version, commit the matching manifest and lockfile only after the pilot gate, keep the app-header selector and preserve the legacy components for rollback. Verify both CV document routes, overlay layering, locales, auth, settings and profile routes, mobile/desktop, SSR, and production build. Deploy only through the application's established deployment process after the owner approves.

Rollback: restore the prior known-good manifest/lockfile and revert the cutover changes without discarding unrelated work; rebuild and redeploy the previous verified release. Do not unpublish a package to force consumers to roll back.

No other application is migrated until the MyAccount pilot passes.

# Angular 20 unified header integration

Status: reference adapter source and test fixture; not yet a separately compiled Angular entry point. Do not use with @neetechs/ui 0.2.0 or 0.3.0 from npm unless that release actually exports ntRenderHeader and ntMountHeader. The current implementation is on main and awaits package verification and release.

## Adoption

1. Build and test the design system from main, then create a local npm tarball containing the new root exports.
2. In a disposable integration environment for the Angular application, install the tarball and copy nt-header.component.ts and its spec into the application's shared layout folder. The adapter contains no header markup, CSS theme or business rules: those remain in @neetechs/ui.
3. Import NtGlobalHeaderComponent into the consuming standalone component. Bind a typed NtHeaderConfig snapshot, a synchronous navigate callback that returns true only if it accepts a link, and the headerAction output. Keep existing authentication, localization, theme and workspace services.
4. Run the application build, Angular tests, SSR and browser tests before replacing the existing header. Use the shared styles import already required by @neetechs/ui.
5. When packaging the Angular adapter as its own optional entry point, keep Angular dependencies separate from the framework-independent library; validate Angular compiler compatibility. Do not duplicate header markup across frameworks.

Example template:

```html
<nt-global-header
  [config]="headerConfig()"
  [navigate]="navigateHeader"
  (headerAction)="handleHeaderAction($event)"
/>
```

The application must provide real routes and action handlers. Route callbacks must be bound to the host context (e.g. an arrow-function property), return a boolean synchronously, and use the application's existing router. Unknown actions should not change state. Replace config snapshots when user, locale, theme or navigation state changes; do not mutate them in place.

## Rendering lifecycle

The adapter initially binds the escaped output of ntRenderHeader, then uses afterNextRender to attach the shared controller in the browser. Angular hydration is deliberately skipped on this component because its child DOM is managed by the controller. The rest of the application's hydration stays unchanged. This is a scoped hydration opt-out, not proof of full Angular SSR/hydration compatibility. The adapter trusts only the design-system renderer's validated output; never substitute arbitrary API HTML. The shared controller handles menus, events, avatar recovery and cleanup. Router and action callbacks re-enter Angular's zone. The initial HTML binding is left unchanged after mounting, so Angular does not overwrite the managed DOM. The wrapper uses display: contents to avoid constraining sticky layout; verify layout and accessibility in real browsers.

## MyAccount pilot requirements

- Use the existing AuthStore ready/user signals: loading must not display a stale cached identity or guest actions until session verification completes.
- Preserve current profile, products, settings, sign-in/sign-up and sign-out behavior, existing RuntimeConfigService domains, localized path normalization and theme toggle. Do not invent new routes or auth services.
- Preserve header absence on CV document preview and the existing sidebar, Resume Studio and overlays.
- Do not change MyAccount package.json or legacy components until a tested local package and migration are available.
- Angular 14/15 and other older consumers need a separate lifecycle compatibility review; afterNextRender is not available in those versions.

## Verification

The companion Jasmine spec covers rendering, delegated actions, latest navigation callback, config updates and teardown. Run it with the actual Angular application's existing Karma/Jasmine configuration, for example `ng test --watch=false --browsers=ChromeHeadless --include='**/nt-header.component.spec.ts'` after installing the local package. The exact command may vary by app. Full Angular AOT, SSR/hydration, responsive layout and browser execution remain required. The source adapter was checked in isolation with TypeScript 5.8.3 and narrow Angular API declarations; this is not a real Angular compiler test.

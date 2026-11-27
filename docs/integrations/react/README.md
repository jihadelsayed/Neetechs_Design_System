# React 18 unified header integration

Status: reference adapter source, not a compiled React package entry. The adapter requires the new ntRenderHeader and ntMountHeader exports on design-system main. Existing published package versions may not include these APIs. Do not upgrade or deploy a consumer until the local package has passed validation.

## Adoption

1. Build, test and pack the design system from main. Install the local tarball in an isolated consumer checkout.
2. Copy nt-header.tsx and its companion tests into the consumer's shared layout folder. Use React 18.3, React DOM and the consumer's existing TypeScript/JSX configuration.
3. Import NtGlobalHeader and pass a typed immutable config snapshot, navigation callback and action callback. The shared renderer owns the markup; the controller owns interactions. The app owns routes, permissions, translations and state.
4. Import @neetechs/ui/styles.css at the app's existing stylesheet entry. Run the actual consumer build, unit and browser tests before replacing its header.

Example:

```tsx
<NtGlobalHeader
  config={headerConfig}
  onNavigate={({ href }) => {
    navigate(href);
    return true;
  }}
  onAction={handleHeaderAction}
/>
```

The navigate callback is invoked only for unmodified same-origin links explicitly marked internal. Return true only when the router handled the destination; otherwise allow normal browser navigation. Use actual application routes and existing permission checks. Do not pass arbitrary HTML or sensitive auth tokens.

## Lifecycle and SSR

The adapter renders the escaped ntRenderHeader result into a dedicated host. Initial HTML is stable for the component instance; subsequent immutable config snapshots update the shared controller rather than resetting its DOM. Committed callback refs avoid stale handlers and avoid mutating refs from abandoned React renders. A browser layout effect mounts the controller and releases it on cleanup, including StrictMode effect replay. Changing the configured instance ID remounts the host. On the server the adapter uses useEffect, so no DOM or controller is accessed during rendering. The first server and client snapshots must match; use a loading account state if authentication is not verified. Hydration mismatches are not suppressed.

The host uses display: contents to avoid constraining sticky positioning; test this with the actual app shell. The adapter trusts only the shared escaped renderer, not raw HTML from application data.

## Consumer-specific gates

- Neetechs Tools: React 18.3.1, React Router 6, @neetechs/ui 0.2.0 as declared on main. Preserve Explore, authenticated Create Tool/My Tools/Favorites, staff-only Reviews, Developer Settings, profile link, sign-in/sign-out, skip link, Outlet and footer. Do not infer permissions from the header configuration or remove the backend authorization checks.
- Neetechs AI (Neenee): its ChatHeader contains company/model selection and chat/sidebar controls; it is not automatically equivalent to a global site header. Preserve those controls and avoid adding a second header until the app's shell architecture is verified.
- Keep React optional; the existing generic package must not acquire a mandatory React dependency. A future compiled React entry requires a separate peer-dependency and packaging review.

## Verification

The reference tests include five jsdom cases (StrictMode, callbacks and modified navigation, state replacement, ID change/unmount, hydration) and one Node server-rendering case. Run them in a real React consumer with Vitest and Testing Library after installing the local design-system tarball:

```sh
npx vitest run nt-header.test.tsx nt-header.ssr.test.tsx
```

The adapter source passed an isolated strict TypeScript 5.8.3 check using narrow React/JSX and shared-header declarations. This is not a real React type-package build or executed integration test. Full consumer build, actual React test run, browser layout and accessibility verification remain pending.

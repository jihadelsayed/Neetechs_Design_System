/**
 * Viewport range contract shared with `src/styles/tokens/breakpoints.css`.
 *
 * Reusable components respond to their container; these helpers exist for
 * app-shell-level behavior (e.g. switching the sidebar to the mobile
 * navigation drawer) where viewport ranges are the correct signal.
 *
 * All values are rem-based so browser text scaling shifts the ranges the
 * same way the CSS media queries shift.
 */

/** Upper bounds of the named viewport ranges, in rem. */
export const NT_VIEWPORTS = Object.freeze({
  /** Small phone upper bound (480px at 16px root). */
  xs: 30,
  /** Large phone upper bound (640px). */
  sm: 40,
  /** Tablet upper bound (768px). */
  md: 48,
  /** The shell collapses its sidebar below this bound (1024px). */
  lg: 64,
  /** Wide desktop lower bound (1280px). */
  xl: 80,
} as const);

export type NtViewportName = keyof typeof NT_VIEWPORTS;

/**
 * Builds the canonical `max-width` media query for a named range bound.
 * Mirrors the literal queries used in production CSS.
 */
export function ntViewportQuery(name: NtViewportName): string {
  return `(max-width: ${NT_VIEWPORTS[name]}rem)`;
}

export interface NtViewportWatchOptions {
  /** Called immediately with the current match state and again on change. */
  onChange: (matches: boolean) => void;
}

/**
 * SSR-safe matchMedia subscription for a named viewport bound.
 * Returns a cleanup function; on the server it is a no-op that reports
 * `false` once so hydration produces the desktop-first markup.
 */
export function ntWatchViewport(
  name: NtViewportName,
  { onChange }: NtViewportWatchOptions,
): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false);
    return () => {};
  }

  const query = window.matchMedia(ntViewportQuery(name));
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);

  onChange(query.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

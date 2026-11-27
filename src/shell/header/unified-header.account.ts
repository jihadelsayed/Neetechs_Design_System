import type { NtHeaderAccount, NtHeaderEntry, NtHeaderIdentity, NtHeaderLink, NtHeaderAction } from './unified-header.types.js';

/** Auth readiness is supplied by the host; this helper never reads a session or token. */
export type NtHeaderAccountSnapshot =
  | { readonly state: 'loading' }
  | { readonly state: 'guest' }
  | { readonly state: 'authenticated'; readonly identity: NtHeaderIdentitySource };

export interface NtHeaderIdentitySource {
  readonly displayName?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly username?: string | null;
  readonly email?: string | null;
  readonly avatarUrl?: string | null;
}

export type NtHeaderAccountDestination =
  | Pick<NtHeaderLink, 'kind' | 'href' | 'internal' | 'current'>
  | Pick<NtHeaderAction, 'kind' | 'action'>;

export interface NtHeaderAccountOptions {
  readonly labels: {
    readonly account: string;
    readonly login: string;
    readonly signup: string;
    readonly myAccount: string;
    readonly myProducts: string;
    readonly settings: string;
  };
  /** Host-owned localized destinations, including login return URL and router semantics. */
  readonly destinations: {
    readonly login?: NtHeaderAccountDestination;
    readonly signup?: NtHeaderAccountDestination;
    readonly myAccount?: NtHeaderAccountDestination;
    readonly myProducts?: NtHeaderAccountDestination;
    readonly settings?: NtHeaderAccountDestination;
  };
  /** Optional host-owned sign-out action. Never invoked by the configuration helper. */
  readonly signOut?: { readonly label: string; readonly action: string; readonly disabled?: boolean };
  readonly fallbackAvatarUrl?: string;
  /** Email is optional in SSR markup; do not expose unless explicitly requested. */
  readonly showEmail?: boolean;
  readonly guestItems?: readonly NtHeaderEntry[];
  readonly authenticatedItems?: readonly NtHeaderEntry[];
}

function nonblank(value: string | null | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function resolveIdentity(source: NtHeaderIdentitySource, options: NtHeaderAccountOptions): NtHeaderIdentity {
  const fullName = [nonblank(source.firstName), nonblank(source.lastName)].filter(Boolean).join(' ');
  const email = nonblank(source.email);
  const name = nonblank(source.displayName) ?? (fullName || nonblank(source.username) || options.labels.account);
  const avatarUrl = nonblank(source.avatarUrl);
  const fallbackAvatarUrl = nonblank(options.fallbackAvatarUrl);
  return { name,
    ...(options.showEmail && email ? { email } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
    ...(fallbackAvatarUrl ? { fallbackAvatarUrl } : {}) };
}

function makeItem(id: string, label: string, destination: NtHeaderAccountDestination | undefined, icon?: NtHeaderEntry['icon']): NtHeaderEntry[] {
  if (!destination || !label.trim()) return [];
  const base = { id, label, ...(icon ? { icon } : {}) };
  return destination.kind === 'link'
    ? [{ ...destination, ...base, kind: 'link' }]
    : [{ kind: 'action', action: destination.action, ...base }];
}

/** Produces a fresh account snapshot. No stale identity or authenticated actions survive loading or sign-out. */
export function ntCreateHeaderAccount(snapshot: NtHeaderAccountSnapshot, options: NtHeaderAccountOptions): NtHeaderAccount {
  if (snapshot.state === 'loading') return { state: 'loading' };
  const { labels, destinations } = options;
  if (snapshot.state === 'guest') return { state: 'guest', items: [
    ...makeItem('account-login', labels.login, destinations.login),
    ...makeItem('account-signup', labels.signup, destinations.signup),
    ...(options.guestItems ?? []),
  ] };
  return { state: 'authenticated', identity: resolveIdentity(snapshot.identity, options), items: [
    ...makeItem('account-profile', labels.myAccount, destinations.myAccount, 'account'),
    ...makeItem('account-products', labels.myProducts, destinations.myProducts, 'apps'),
    ...makeItem('account-settings', labels.settings, destinations.settings, 'settings'),
    ...(options.authenticatedItems ?? []),
    ...(options.signOut && options.signOut.label.trim() && options.signOut.action.trim() ? [{ kind: 'action' as const, id: 'account-signout', label: options.signOut.label, action: options.signOut.action, icon: 'logout' as const, danger: true, ...(options.signOut.disabled === undefined ? {} : { disabled: options.signOut.disabled }) }] : []),
  ] };
}

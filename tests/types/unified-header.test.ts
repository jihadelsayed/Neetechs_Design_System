import type { NtHeaderAccount, NtHeaderConfig, NtHeaderMountOptions, NtHeaderNavItem } from '../../src/shell/header/unified-header.types.js';

const config: NtHeaderConfig = {
  id: 'myaccount-header',
  brand: { label: 'Neetechs', href: 'https://neetechs.com' },
  navigation: [{ id: 'tools', kind: 'link', label: 'Tools', href: 'https://neetechs.com/tools' }],
  labels: { primaryNavigation: 'Primary', mobileNavigation: 'Site', openNavigation: 'Open', closeNavigation: 'Close', account: 'Account', accountLoading: 'Checking account' },
  account: { state: 'authenticated', identity: { name: 'Example' }, items: [{ id: 'logout', kind: 'action', label: 'Sign out', action: 'logout', danger: true }] },
};
const guest: NtHeaderAccount = { state: 'guest', items: [] };
const loading: NtHeaderAccount = { state: 'loading' };
const options: NtHeaderMountOptions = { onNavigate: ({ href }) => href.startsWith('/'), onAction: ({ action }) => { void action; } };
// @ts-expect-error authenticated state must carry identity
const invalidAccount: NtHeaderAccount = { state: 'authenticated', items: [] };
// @ts-expect-error links require a destination
const invalidLink: NtHeaderNavItem = { id: 'broken', kind: 'link', label: 'Broken' };
// @ts-expect-error actions require an action identifier
const invalidAction: NtHeaderNavItem = { id: 'broken', kind: 'action', label: 'Broken' };
// @ts-expect-error loading state cannot carry account actions
const invalidLoading: NtHeaderAccount = { state: 'loading', items: [] };
void [config, guest, loading, options, invalidAccount, invalidLink, invalidAction, invalidLoading];

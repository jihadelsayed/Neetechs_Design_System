import type { NtHeaderConfig, NtHeaderNotifications } from '../../src/shell/header/unified-header.types.js';
import { ntCreateHeaderAccount, type NtHeaderAccountOptions, type NtHeaderAccountSnapshot } from '../../src/shell/header/unified-header.account.js';
import { ntCreateHeaderPreference } from '../../src/shell/header/unified-header.preferences.js';
import { ntRenderHeader } from '../../src/shell/header/unified-header.js';

const options: NtHeaderAccountOptions = {
  labels: { account: 'Account', login: 'Login', signup: 'Sign up', myAccount: 'MyAccount', myProducts: 'Products', settings: 'Settings' },
  destinations: { settings: { kind: 'link', href: '/settings', internal: true } },
  signOut: { label: 'Logout', action: 'auth.logout', disabled: false },
};
const account = ntCreateHeaderAccount({ state: 'authenticated', identity: { displayName: 'Example' } }, options);
const appearance = ntCreateHeaderPreference({ label: 'Theme', selectedId: 'dark', choices: [{ id: 'dark', label: 'Dark', action: 'theme.dark' }] });
const notifications: NtHeaderNotifications = { label: 'Notifications', emptyLabel: 'No notifications', unreadCount: 0, items: [] };
const config: NtHeaderConfig = {
  id: 'feature-header', brand: { label: 'Neetechs', href: '/' }, navigation: [],
  labels: { primaryNavigation: 'Primary', mobileNavigation: 'Mobile', openNavigation: 'Open', closeNavigation: 'Close', account: 'Account', accountLoading: 'Loading' },
  account, notifications, ...(appearance ? { appearance } : {}),
};
void ntRenderHeader(config);
// @ts-expect-error authenticated snapshot needs identity
const missingIdentity: NtHeaderAccountSnapshot = { state: 'authenticated' };
// @ts-expect-error loading snapshot cannot contain cached identity
const staleIdentity: NtHeaderAccountSnapshot = { state: 'loading', identity: { displayName: 'Old' } };
// @ts-expect-error the notification count is numeric
const invalidCount: NtHeaderNotifications = { ...notifications, unreadCount: '3' };
// @ts-expect-error sign-out must delegate to an action identifier, not an href
const invalidLogout: NtHeaderAccountOptions = { ...options, signOut: { label: 'Logout', href: '/logout' } };
// @ts-expect-error preference choices need a host action identifier
const invalidChoice = ntCreateHeaderPreference({ label: 'Theme', selectedId: 'dark', choices: [{ id: 'dark', label: 'Dark' }] });
void [missingIdentity, staleIdentity, invalidCount, invalidLogout, invalidChoice];

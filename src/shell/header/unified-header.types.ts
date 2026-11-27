import type { NtHeaderIcon } from './unified-header.icons.js';

/** Framework-independent configuration for the Neetechs global header.
 * All labels and destinations are supplied by the application. No auth tokens,
 * permission decisions, router objects or raw HTML belong in this contract.
 */
export interface NtHeaderBrand {
  readonly label: string;
  readonly href: string;
  readonly logoUrl?: string;
  readonly appName?: string;
  readonly subtitle?: string;
  /** Allow the application router to handle unmodified internal link clicks. */
  readonly internal?: boolean;
}

interface NtHeaderItemBase {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: NtHeaderIcon;
  readonly disabled?: boolean;
}

export interface NtHeaderLink extends NtHeaderItemBase {
  readonly kind: 'link';
  readonly href: string;
  readonly internal?: boolean;
  readonly current?: boolean;
}

export interface NtHeaderAction extends NtHeaderItemBase {
  readonly kind: 'action';
  /** Stable action identifier handled by the application, not a URL. */
  readonly action: string;
  readonly danger?: boolean;
}

export type NtHeaderEntry = NtHeaderLink | NtHeaderAction;

export interface NtHeaderGroup extends NtHeaderItemBase {
  readonly kind: 'group';
  readonly children: readonly NtHeaderEntry[];
  readonly current?: boolean;
}

export type NtHeaderNavItem = NtHeaderEntry | NtHeaderGroup;

export interface NtHeaderIdentity {
  readonly name: string;
  readonly email?: string;
  readonly avatarUrl?: string;
  readonly fallbackAvatarUrl?: string;
}

/** Loading is deliberately distinct from guest to avoid flashing login actions. */
export type NtHeaderAccount =
  | { readonly state: 'loading' }
  | { readonly state: 'guest'; readonly items: readonly NtHeaderEntry[] }
  | { readonly state: 'authenticated'; readonly identity: NtHeaderIdentity; readonly items: readonly NtHeaderEntry[] };

export interface NtHeaderLabels {
  readonly primaryNavigation: string;
  readonly mobileNavigation: string;
  readonly openNavigation: string;
  readonly closeNavigation: string;
  readonly account: string;
  readonly accountLoading: string;
}

export interface NtHeaderChoice {
  readonly id: string;
  readonly label: string;
  /** Action identifier handled by the host (theme or language, for example). */
  readonly action: string;
  readonly disabled?: boolean;
}

export interface NtHeaderChoiceMenu {
  readonly label: string;
  readonly selectedId: string;
  readonly choices: readonly NtHeaderChoice[];
}

/** Optional host-owned notification summary. No fetching or read-state mutation in UI. */
export interface NtHeaderNotifications {
  readonly label: string;
  /** Localized accessible summary, e.g. "Notifications, 3 unread". */
  readonly accessibleLabel?: string;
  readonly unreadCount?: number;
  readonly emptyLabel: string;
  readonly items: readonly NtHeaderEntry[];
}

/** Structured application extension slots; no raw HTML or executable configuration. */
export interface NtHeaderSlots {
  /** App-owned workspace selector, visible in desktop navigation and mobile drawer. */
  readonly workspace?: NtHeaderGroup;
  /** Additional app-owned links/actions, shown in desktop chrome and mobile drawer. */
  readonly contextualActions?: readonly NtHeaderEntry[];
}

export interface NtHeaderConfig {
  /** Unique, stable within the document, identical on server and client. */
  readonly id: string;
  readonly brand: NtHeaderBrand;
  readonly navigation: readonly NtHeaderNavItem[];
  readonly labels: NtHeaderLabels;
  /** Omit the account control entirely for public or auth-only layouts. */
  readonly account?: NtHeaderAccount;
  readonly appearance?: NtHeaderChoiceMenu;
  readonly language?: NtHeaderChoiceMenu;
  readonly appSwitcher?: NtHeaderGroup;
  readonly notifications?: NtHeaderNotifications;
  readonly actions?: readonly NtHeaderEntry[];
  readonly slots?: NtHeaderSlots;
  readonly presentation?: 'standard' | 'sticky' | 'embedded';
  readonly direction?: 'ltr' | 'rtl';
}

export interface NtHeaderActivation {
  readonly id: string;
  readonly action: string;
}

export interface NtHeaderNavigation {
  readonly id: string;
  readonly href: string;
}

/** Trusted host integration; kept separate from serializable SSR config. */
export interface NtHeaderMountOptions {
  /** Handle action identifiers (logout, theme, etc.) in the host. */
  readonly onAction?: (activation: NtHeaderActivation) => void;
  /** Return true only when an unmodified internal navigation was handled. */
  readonly onNavigate?: (navigation: NtHeaderNavigation) => boolean;
}

export interface NtHeaderController {
  readonly root: HTMLElement;
  /** Replace the full snapshot, including auth state. Instance ID is immutable. */
  update(config: NtHeaderConfig): void;
  closeMenus(): void;
  /** Release all listeners and owned overlay resources. Safe to call twice. */
  destroy(): void;
}

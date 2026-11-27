import type { NtHeaderGroup, NtHeaderLink, NtHeaderNavItem } from './unified-header.types.js';

/** Optional Neetechs ecosystem data; the generic renderer does not import this module. */
export const NT_ECOSYSTEM_LINKS = Object.freeze({
  products: 'https://neetechs.com/digital-products',
  tools: 'https://neetechs.com/tools',
  company: 'https://neetechs.com/company',
  billing: 'https://billing.neetechs.com/',
});

export interface NtEcosystemApp {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly description?: string;
}

export interface NtEcosystemNavigationOptions {
  readonly labels: { readonly products: string; readonly tools: string; readonly company: string; readonly billing?: string; readonly apps?: string };
  /** Caller supplies the already-visible catalog, never tokens or permission rules. */
  readonly apps?: readonly NtEcosystemApp[];
  readonly currentAppId?: string;
  readonly includeBilling?: boolean;
  /** Preserve the existing Products link unless the host explicitly enables the catalog. */
  readonly productDropdown?: boolean;
}

function appLinks(apps: readonly NtEcosystemApp[], currentAppId: string | undefined, prefix: string): NtHeaderLink[] {
  const seen = new Set<string>();
  const links: NtHeaderLink[] = [];
  for (const app of apps) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(app.id) || seen.has(app.id) || !app.label.trim()) continue;
    // Ecosystem entries are external HTTPS links. Environment-specific hosts are supplied by the caller.
    try {
      const url = new URL(app.href);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
    } catch { continue; }
    seen.add(app.id);
    links.push({ kind: 'link', id: prefix + app.id, label: app.label, href: app.href,
      current: app.id === currentAppId, ...(app.description === undefined ? {} : { description: app.description }) });
  }
  return links;
}

export function ntCreateEcosystemNavigation(options: NtEcosystemNavigationOptions): {
  readonly navigation: readonly NtHeaderNavItem[];
  readonly appSwitcher?: NtHeaderGroup;
} {
  const { labels } = options;
  const products: NtHeaderLink = { kind: 'link', id: 'ecosystem-products', label: labels.products, href: NT_ECOSYSTEM_LINKS.products };
  const children = appLinks(options.apps ?? [], options.currentAppId, 'ecosystem-product-');
  const navigation: NtHeaderNavItem[] = [
    { kind: 'link', id: 'ecosystem-tools', label: labels.tools, href: NT_ECOSYSTEM_LINKS.tools, icon: 'tools' },
    options.productDropdown && children.length
      ? { kind: 'group', id: 'ecosystem-products-menu', label: labels.products, icon: 'apps', children: [products, ...children] }
      : products,
    { kind: 'link', id: 'ecosystem-company', label: labels.company, href: NT_ECOSYSTEM_LINKS.company },
  ];
  if (options.includeBilling && labels.billing) navigation.push({ kind: 'link', id: 'ecosystem-billing', label: labels.billing, href: NT_ECOSYSTEM_LINKS.billing, icon: 'billing' });
  const switcherLinks = appLinks(options.apps ?? [], options.currentAppId, 'ecosystem-switch-');
  return labels.apps && switcherLinks.length
    ? { navigation, appSwitcher: { kind: 'group', id: 'ecosystem-switcher', label: labels.apps, icon: 'apps', children: switcherLinks } }
    : { navigation };
}

import type { NtHeaderBrand } from './unified-header.types.js';

/** Canonical identity from the main Neetechs website. */
export const NT_HEADER_BRAND_NAME = 'Neetechs';
export const NT_HEADER_LOGO_URL = 'https://neetechs.com/logo%20-%20128.png';

export interface NtHeaderBrandOptions {
  readonly href?: string;
  /** Product suffix, for example MyAccount or Apply. Omit for the main site. */
  readonly appName?: string;
  readonly subtitle?: string;
  /** Override with a deployed local asset URL, or null for text-only branding. */
  readonly logoUrl?: string | null;
  readonly internal?: boolean;
}

/** Construct the common brand without relying on browser globals or app routing. */
export function ntCreateHeaderBrand(options: NtHeaderBrandOptions = {}): NtHeaderBrand {
  const logoUrl = options.logoUrl === undefined ? NT_HEADER_LOGO_URL : options.logoUrl;
  return {
    label: NT_HEADER_BRAND_NAME,
    href: options.href ?? 'https://neetechs.com/',
    ...(logoUrl === null ? {} : { logoUrl }),
    ...(options.appName === undefined ? {} : { appName: options.appName }),
    ...(options.subtitle === undefined ? {} : { subtitle: options.subtitle }),
    ...(options.internal === undefined ? {} : { internal: options.internal }),
  };
}

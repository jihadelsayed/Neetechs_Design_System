export const NEETECHS_UI_PACKAGE = '@neetechs/ui';
export { NEETECHS_UI_VERSION } from './version.js';

export * from './types/index.js';
export * from './behaviors/index.js';
export * from './appearance/index.js';
export * from './localization/index.js';

export type {
  NtHeaderBrand,
  NtHeaderLink,
  NtHeaderAction,
  NtHeaderEntry,
  NtHeaderGroup,
  NtHeaderNavItem,
  NtHeaderIdentity,
  NtHeaderAccount,
  NtHeaderLabels,
  NtHeaderChoice,
  NtHeaderChoiceMenu,
  NtHeaderConfig,
  NtHeaderSlots,
  NtHeaderActivation,
  NtHeaderNavigation,
  NtHeaderMountOptions,
  NtHeaderController,
} from './shell/header/unified-header.types.js';

export { ntRenderHeader } from './shell/header/unified-header.js';

export { ntMountHeader } from './shell/header/unified-header.controller.js';

export { ntCreateHeaderBrand, NT_HEADER_BRAND_NAME, NT_HEADER_LOGO_URL, type NtHeaderBrandOptions } from './shell/header/unified-header.brand.js';

export { ntRenderHeaderIcon, type NtHeaderIcon } from './shell/header/unified-header.icons.js';

export { NT_ECOSYSTEM_LINKS, ntCreateEcosystemNavigation, type NtEcosystemApp, type NtEcosystemNavigationOptions } from './shell/header/unified-header.ecosystem.js';

export { ntCreateHeaderAccount, type NtHeaderAccountSnapshot, type NtHeaderIdentitySource, type NtHeaderAccountDestination, type NtHeaderAccountOptions } from './shell/header/unified-header.account.js';

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
  NtHeaderActivation,
  NtHeaderNavigation,
  NtHeaderMountOptions,
  NtHeaderController,
} from './shell/header/unified-header.types.js';

export { ntRenderHeader } from './shell/header/unified-header.js';

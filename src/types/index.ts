export type NtThemeName = 'dark' | 'light' | 'high-contrast';

export type NtAccentName =
  | 'orange'
  | 'blue'
  | 'green'
  | 'purple'
  | 'neutral';

export type NtDensityName = 'compact' | 'comfortable' | 'spacious';

export type NtSizeName = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type NtToneName =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type NtPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

export type NtSide = 'top' | 'right' | 'bottom' | 'left';
export type NtLogicalSide = 'inline-start' | 'inline-end';

export type NtAlign = 'start' | 'center' | 'end';

export type NtOpenState = 'open' | 'closed';

export type NtSelectionState = 'selected' | 'unselected' | 'indeterminate';

export type NtLoadingState = 'idle' | 'loading' | 'success' | 'error';

export type NtCalendarEventTone =
  | 'busy'
  | 'free'
  | 'focus'
  | 'blocked'
  | 'tentative'
  | 'private';

export type NtBillingStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'active'
  | 'overdue'
  | 'rejected'
  | 'cancelled';

export type NtCompanyRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface NtThemeConfig {
  theme?: NtThemeName;
  accent?: NtAccentName;
  density?: NtDensityName;
}

export interface NtDomTarget {
  element: HTMLElement;
}

export interface NtDisposable {
  destroy(): void;
}

export interface NtController extends NtDisposable {
  readonly element: HTMLElement;
}

export interface NtFocusOptions {
  preventScroll?: boolean;
}

export interface NtOverlayOptions {
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
}

export interface NtDisclosureOptions extends NtOverlayOptions {
  trigger?: HTMLElement | null;
  content: HTMLElement;
  initialOpen?: boolean;
}

export interface NtDisclosureController extends NtController {
  readonly trigger: HTMLElement | null;
  readonly content: HTMLElement;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

export interface NtRovingFocusOptions {
  root: HTMLElement;
  itemSelector: string;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  initialIndex?: number;
}

export interface NtRovingFocusController extends NtDisposable {
  readonly root: HTMLElement;
  readonly currentIndex: number;
  focusFirst(): void;
  focusLast(): void;
  focusNext(): void;
  focusPrevious(): void;
}

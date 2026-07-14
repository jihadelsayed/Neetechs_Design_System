import type { NtDisposable, NtLogicalSide, NtSide } from '../types/index.js';

export type NtDrawerSide = NtSide | NtLogicalSide;
import {
  ntCreateFocusTrap,
  type NtFocusTrapController,
  type NtFocusTrapOptions,
} from './focus-trap.js';
import {
  ntCreateOverlay,
  type NtCreateOverlayOptions,
  type NtOverlayController,
} from './overlay.js';
import {
  ntSetAriaControls,
  ntSetAriaDescribedBy,
  ntSetAriaLabelledBy,
} from './ids.js';

export interface NtDrawerOptions {
  trigger?: HTMLElement | null;
  drawer: HTMLElement;
  backdrop?: HTMLElement | null;
  title?: HTMLElement | null;
  description?: HTMLElement | null;
  /** Modal drawers trap focus; nonmodal drawers behave as a region/navigation landmark. */
  modal?: boolean;
  role?: 'dialog' | 'region' | 'navigation';
  /** Canonical logical/physical placement. Prefer inline-start or inline-end. */
  placement?: NtDrawerSide;
  /** @deprecated Use `placement`. Retained for existing consumers. */
  side?: NtDrawerSide;
  initialOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
  restoreFocus?: boolean;
  initialFocus?: NtFocusTrapOptions['initialFocus'];
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NtDrawerController extends NtDisposable {
  readonly drawer: HTMLElement;
  readonly trigger: HTMLElement | null;
  readonly backdrop: HTMLElement | null;
  readonly placement: NtDrawerSide;
  /** @deprecated Use `placement`. */
  readonly side: NtDrawerSide;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

export function ntCreateDrawer(options: NtDrawerOptions): NtDrawerController {
  const {
    trigger = null,
    drawer,
    backdrop = null,
    title = null,
    description = null,
    modal = true,
    role = modal ? 'dialog' : 'region',
    placement,
    side,
    initialOpen = false,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    lockScroll = modal,
    restoreFocus = true,
    initialFocus = null,
    onOpen,
    onClose,
  } = options;

  const resolvedPlacement = placement ?? side ?? 'inline-end';

  let isOpen = false;

  const overlayOptions: NtCreateOverlayOptions = {
    closeOnEscape,
    closeOnOutsideClick,
    lockScroll,
    outsideElements: trigger ? [trigger] : [],
    inertBackground: modal,
    inertExcludeElements: [backdrop],
    onClose: () => {
      close();
    },
  };

  const overlay: NtOverlayController = ntCreateOverlay(drawer, overlayOptions);

  const focusTrap: NtFocusTrapController = ntCreateFocusTrap(drawer, {
    initialFocus,
    fallbackFocus: drawer,
    restoreFocus,
    escapeDeactivates: false,
  });

  function syncAttributes(): void {
    drawer.setAttribute('role', role);
    if (modal) drawer.setAttribute('aria-modal', 'true');
    else drawer.removeAttribute('aria-modal');
    drawer.dataset.state = isOpen ? 'open' : 'closed';
    drawer.dataset.side = resolvedPlacement;
    drawer.dataset.placement = resolvedPlacement;

    if (!drawer.classList.contains(`nt-drawer--${resolvedPlacement}`)) {
      drawer.classList.add(`nt-drawer--${resolvedPlacement}`);
    }

    if (backdrop) {
      backdrop.dataset.state = isOpen ? 'open' : 'closed';
    }

    if (trigger) {
      trigger.setAttribute('aria-expanded', String(isOpen));
      ntSetAriaControls(trigger, drawer, 'nt-drawer');
    }

    if (title) {
      ntSetAriaLabelledBy(drawer, title, 'nt-drawer-title');
    }

    if (description) {
      ntSetAriaDescribedBy(drawer, description, 'nt-drawer-description');
    }

    if (isOpen) {
      drawer.removeAttribute('hidden');
      backdrop?.removeAttribute('hidden');
      return;
    }

    drawer.setAttribute('hidden', '');
    backdrop?.setAttribute('hidden', '');
  }

  function open(): void {
    if (isOpen) {
      return;
    }

    isOpen = true;
    syncAttributes();
    overlay.activate();
    if (modal) focusTrap.activate();
    onOpen?.();
  }

  function close(): void {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    overlay.deactivate();
    if (modal) focusTrap.deactivate();
    syncAttributes();
    onClose?.();
  }

  function toggle(): void {
    if (isOpen) {
      close();
      return;
    }

    open();
  }

  const triggerListener = () => {
    toggle();
  };

  trigger?.addEventListener('click', triggerListener);

  syncAttributes();

  if (initialOpen) {
    open();
  }

  return {
    drawer,
    trigger,
    backdrop,
    placement: resolvedPlacement,
    side: resolvedPlacement,

    get isOpen() {
      return isOpen;
    },

    open,
    close,
    toggle,

    destroy() {
      trigger?.removeEventListener('click', triggerListener);
      focusTrap.destroy();
      overlay.destroy();
    },
  };
}

/** Unprefixed compatibility export; canonical Neetechs code uses `ntCreateDrawer`. */
export const createDrawer = ntCreateDrawer;

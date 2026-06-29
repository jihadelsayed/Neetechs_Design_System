import type { NtDisposable, NtSide } from '../types/index.js';
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
import { ntSetAriaControls, ntSetAriaLabelledBy } from './ids.js';

export interface NtDrawerOptions {
  trigger?: HTMLElement | null;
  drawer: HTMLElement;
  backdrop?: HTMLElement | null;
  title?: HTMLElement | null;
  side?: NtSide;
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
  readonly side: NtSide;
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
    side = 'right',
    initialOpen = false,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    lockScroll = true,
    restoreFocus = true,
    initialFocus = null,
    onOpen,
    onClose,
  } = options;

  let isOpen = false;

  const overlayOptions: NtCreateOverlayOptions = {
    closeOnEscape,
    closeOnOutsideClick,
    lockScroll,
    outsideElements: trigger ? [trigger] : [],
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
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.dataset.state = isOpen ? 'open' : 'closed';
    drawer.dataset.side = side;

    if (!drawer.classList.contains(`nt-drawer--${side}`)) {
      drawer.classList.add(`nt-drawer--${side}`);
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
    focusTrap.activate();
    onOpen?.();
  }

  function close(): void {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    focusTrap.deactivate();
    overlay.deactivate();
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
    side,

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
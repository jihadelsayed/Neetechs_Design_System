import type { NtDisposable } from '../types/index.js';
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

export interface NtDialogOptions {
  trigger?: HTMLElement | null;
  dialog: HTMLElement;
  backdrop?: HTMLElement | null;
  title?: HTMLElement | null;
  description?: HTMLElement | null;
  initialOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
  restoreFocus?: boolean;
  initialFocus?: NtFocusTrapOptions['initialFocus'];
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NtDialogController extends NtDisposable {
  readonly dialog: HTMLElement;
  readonly trigger: HTMLElement | null;
  readonly backdrop: HTMLElement | null;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

export function ntCreateDialog(options: NtDialogOptions): NtDialogController {
  const {
    trigger = null,
    dialog,
    backdrop = null,
    title = null,
    description = null,
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
    inertBackground: true,
    inertExcludeElements: [backdrop],
    onClose: () => {
      close();
    },
  };

  const overlay: NtOverlayController = ntCreateOverlay(dialog, overlayOptions);

  const focusTrap: NtFocusTrapController = ntCreateFocusTrap(dialog, {
    initialFocus,
    fallbackFocus: dialog,
    restoreFocus,
    escapeDeactivates: false,
  });

  function syncAttributes(): void {
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.dataset.state = isOpen ? 'open' : 'closed';

    if (backdrop) {
      backdrop.dataset.state = isOpen ? 'open' : 'closed';
    }

    if (trigger) {
      trigger.setAttribute('aria-expanded', String(isOpen));
      ntSetAriaControls(trigger, dialog, 'nt-dialog');
    }

    if (title) {
      ntSetAriaLabelledBy(dialog, title, 'nt-dialog-title');
    }

    if (description) {
      ntSetAriaDescribedBy(dialog, description, 'nt-dialog-description');
    }

    if (isOpen) {
      dialog.removeAttribute('hidden');
      backdrop?.removeAttribute('hidden');
      return;
    }

    dialog.setAttribute('hidden', '');
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
    dialog,
    trigger,
    backdrop,

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

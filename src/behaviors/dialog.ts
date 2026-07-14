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
  /** Modal dialogs trap focus and make the background inert. Defaults to true. */
  modal?: boolean;
  role?: 'dialog' | 'alertdialog';
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
    modal = true,
    role = 'dialog',
    initialOpen = false,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    lockScroll = modal,
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
    inertBackground: modal,
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
    dialog.setAttribute('role', role);
    if (modal) dialog.setAttribute('aria-modal', 'true');
    else dialog.removeAttribute('aria-modal');
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

/** @deprecated Modal is a mode of `NtDialogOptions`; use `NtDialogOptions`. */
export type NtModalOptions = NtDialogOptions;

/** @deprecated Modal is a mode of `NtDialogController`; use `NtDialogController`. */
export type NtModalController = NtDialogController;

/** @deprecated Use `ntCreateDialog({ ...options, modal: true })`. */
export function ntCreateModal(options: NtModalOptions): NtModalController {
  return ntCreateDialog({ ...options, modal: true });
}

/** Unprefixed compatibility export; canonical Neetechs code uses `ntCreateDialog`. */
export const createDialog = ntCreateDialog;

/** @deprecated Use `ntCreateDialog` or `createDialog` with `modal: true`. */
export const createModal = ntCreateModal;

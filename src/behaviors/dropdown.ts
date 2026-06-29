import type {
  NtAlign,
  NtDisposable,
  NtRovingFocusController,
  NtSide,
} from '../types/index.js';
import { ntSetAriaControls } from './ids.js';
import {
  NT_KEYS,
  ntCreateRovingFocus,
  ntIsActivationKey,
} from './keyboard.js';
import {
  ntCreateOverlay,
  type NtCreateOverlayOptions,
  type NtOverlayController,
} from './overlay.js';

export interface NtDropdownOptions {
  trigger: HTMLElement;
  content: HTMLElement;
  itemSelector?: string;
  side?: NtSide;
  align?: NtAlign;
  initialOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnSelect?: boolean;
  loopFocus?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onSelect?: (item: HTMLElement, event: Event) => void;
}

export interface NtDropdownController extends NtDisposable {
  readonly trigger: HTMLElement;
  readonly content: HTMLElement;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

const DEFAULT_ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="option"]',
  '.nt-dropdown__item',
  '.nt-menu__item',
].join(',');

export function ntCreateDropdown(
  options: NtDropdownOptions,
): NtDropdownController {
  const {
    trigger,
    content,
    itemSelector = DEFAULT_ITEM_SELECTOR,
    side = 'bottom',
    align = 'start',
    initialOpen = false,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    closeOnSelect = true,
    loopFocus = true,
    onOpen,
    onClose,
    onSelect,
  } = options;

  let isOpen = false;
  let rovingFocus: NtRovingFocusController | null = null;

  const overlayOptions: NtCreateOverlayOptions = {
    closeOnEscape,
    closeOnOutsideClick,
    lockScroll: false,
    outsideElements: [trigger],
    onClose: () => {
      close();
    },
  };

  const overlay: NtOverlayController = ntCreateOverlay(content, overlayOptions);

  function syncAttributes(): void {
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', String(isOpen));
    ntSetAriaControls(trigger, content, 'nt-dropdown');

    content.dataset.state = isOpen ? 'open' : 'closed';
    content.dataset.side = side;
    content.dataset.align = align;

    if (isOpen) {
      content.removeAttribute('hidden');
      return;
    }

    content.setAttribute('hidden', '');
  }

  function ensureRovingFocus(): void {
    if (rovingFocus) {
      return;
    }

    rovingFocus = ntCreateRovingFocus({
      root: content,
      itemSelector,
      orientation: 'vertical',
      loop: loopFocus,
    });
  }

  function focusFirstItem(): void {
    ensureRovingFocus();
    rovingFocus?.focusFirst();
  }

  function focusLastItem(): void {
    ensureRovingFocus();
    rovingFocus?.focusLast();
  }

  function open(): void {
    if (isOpen) {
      return;
    }

    isOpen = true;
    syncAttributes();
    overlay.activate();
    ensureRovingFocus();
    onOpen?.();
  }

  function close(): void {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    overlay.deactivate();
    syncAttributes();
    trigger.focus({ preventScroll: true });
    onClose?.();
  }

  function toggle(): void {
    if (isOpen) {
      close();
      return;
    }

    open();
  }

  const handleTriggerClick = () => {
    toggle();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === NT_KEYS.arrowDown) {
      event.preventDefault();
      open();
      queueMicrotask(focusFirstItem);
      return;
    }

    if (event.key === NT_KEYS.arrowUp) {
      event.preventDefault();
      open();
      queueMicrotask(focusLastItem);
      return;
    }

    if (ntIsActivationKey(event)) {
      event.preventDefault();
      toggle();

      if (!isOpen) {
        return;
      }

      queueMicrotask(focusFirstItem);
    }
  };

  const handleContentClick = (event: MouseEvent) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const item = target.closest<HTMLElement>(itemSelector);

    if (!item || !content.contains(item)) {
      return;
    }

    if (
      item.hasAttribute('disabled') ||
      item.getAttribute('aria-disabled') === 'true' ||
      item.dataset.disabled === 'true'
    ) {
      event.preventDefault();
      return;
    }

    onSelect?.(item, event);

    if (closeOnSelect) {
      close();
    }
  };

  const handleContentKeyDown = (event: KeyboardEvent) => {
    if (event.key === NT_KEYS.escape && closeOnEscape) {
      event.preventDefault();
      close();
      return;
    }

    if (!ntIsActivationKey(event)) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const item = target.closest<HTMLElement>(itemSelector);

    if (!item || !content.contains(item)) {
      return;
    }

    event.preventDefault();
    onSelect?.(item, event);

    if (closeOnSelect) {
      close();
    }
  };

  trigger.addEventListener('click', handleTriggerClick);
  trigger.addEventListener('keydown', handleTriggerKeyDown);
  content.addEventListener('click', handleContentClick);
  content.addEventListener('keydown', handleContentKeyDown);

  syncAttributes();

  if (initialOpen) {
    open();
  }

  return {
    trigger,
    content,

    get isOpen() {
      return isOpen;
    },

    open,
    close,
    toggle,

    destroy() {
      trigger.removeEventListener('click', handleTriggerClick);
      trigger.removeEventListener('keydown', handleTriggerKeyDown);
      content.removeEventListener('click', handleContentClick);
      content.removeEventListener('keydown', handleContentKeyDown);
      rovingFocus?.destroy();
      overlay.destroy();
    },
  };
}
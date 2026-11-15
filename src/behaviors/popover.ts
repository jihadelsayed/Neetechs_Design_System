import type {
  NtAlign,
  NtDisclosureController,
  NtDisclosureOptions,
  NtSide,
} from '../types/index.js';
import { ntSetAriaControls } from './ids.js';
import { NT_KEYS } from './keyboard.js';
import { ntCreateOverlay } from './overlay.js';

export interface NtPopoverOptions extends NtDisclosureOptions {
  trigger: HTMLElement;
  side?: Extract<NtSide, 'top' | 'bottom'>;
  align?: NtAlign;
  /** Move focus into the popover on open (first focusable, else the panel). Default `true`. */
  focusOnOpen?: boolean;
  /** Close when focus moves outside trigger and popover. Default `true`. */
  closeOnFocusOut?: boolean;
  /** Close button(s) inside the popover. */
  closeSelector?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Non-modal popover (WAI-ARIA dialog without aria-modal). Implements the
 * shared NtDisclosureController contract: Escape closes and restores focus to
 * the trigger, outside pointer-down and focus leaving close without stealing
 * focus, and the page behind stays interactive (no scroll lock or inert).
 */
export function ntCreatePopover(options: NtPopoverOptions): NtDisclosureController {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'start',
    initialOpen = false,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    focusOnOpen = true,
    closeOnFocusOut = true,
    closeSelector = '.nt-popover__close, [data-nt-popover-close]',
    onOpen,
    onClose,
  } = options;

  let isOpen = false;

  const overlay = ntCreateOverlay(content, {
    closeOnEscape: false,
    closeOnOutsideClick,
    lockScroll: false,
    inertBackground: false,
    outsideElements: [trigger],
    onClose: () => close(false),
  });

  function sync(): void {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', String(isOpen));
    ntSetAriaControls(trigger, content, 'nt-popover');
    content.setAttribute('role', 'dialog');
    content.removeAttribute('aria-modal');
    if (!content.hasAttribute('tabindex')) content.setAttribute('tabindex', '-1');
    content.dataset.state = isOpen ? 'open' : 'closed';
    content.dataset.side = side;
    content.dataset.align = align;
    if (isOpen) content.removeAttribute('hidden');
    else content.setAttribute('hidden', '');
  }

  function open(): void {
    if (isOpen) return;
    isOpen = true;
    sync();
    overlay.activate();
    if (focusOnOpen) {
      const first = content.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? content).focus({ preventScroll: true });
    }
    onOpen?.();
  }

  function close(restoreFocus = false): void {
    if (!isOpen) return;
    isOpen = false;
    overlay.deactivate();
    sync();
    if (restoreFocus) trigger.focus({ preventScroll: true });
    onClose?.();
  }

  function toggle(): void {
    if (isOpen) close(false);
    else open();
  }

  const handleTriggerClick = () => toggle();
  const handleKeyDown = (event: KeyboardEvent) => {
    if (closeOnEscape && isOpen && event.key === NT_KEYS.escape) {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };
  const handleContentClick = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest(closeSelector)) close(true);
  };
  const handleFocusOut = (event: FocusEvent) => {
    if (!closeOnFocusOut || !isOpen) return;
    const next = event.relatedTarget;
    if (next === null) return;
    if (next instanceof Node && (content.contains(next) || trigger.contains(next))) return;
    close(false);
  };

  trigger.addEventListener('click', handleTriggerClick);
  trigger.addEventListener('keydown', handleKeyDown);
  content.addEventListener('keydown', handleKeyDown);
  content.addEventListener('click', handleContentClick);
  content.addEventListener('focusout', handleFocusOut);
  trigger.addEventListener('focusout', handleFocusOut);

  sync();
  if (initialOpen) open();

  return {
    element: content,
    trigger,
    content,
    get isOpen() {
      return isOpen;
    },
    open,
    close: () => close(false),
    toggle,
    destroy() {
      close(false);
      trigger.removeEventListener('click', handleTriggerClick);
      trigger.removeEventListener('keydown', handleKeyDown);
      content.removeEventListener('keydown', handleKeyDown);
      content.removeEventListener('click', handleContentClick);
      content.removeEventListener('focusout', handleFocusOut);
      trigger.removeEventListener('focusout', handleFocusOut);
      overlay.destroy();
    },
  };
}

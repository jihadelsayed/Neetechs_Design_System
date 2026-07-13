import type { NtDisposable, NtFocusOptions } from '../types/index.js';
import { NT_KEYS } from './keyboard.js';

export const NT_FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface NtFocusTrapOptions {
  initialFocus?: HTMLElement | (() => HTMLElement | null) | null;
  fallbackFocus?: HTMLElement | (() => HTMLElement | null) | null;
  restoreFocus?: boolean;
  preventScroll?: boolean;
  escapeDeactivates?: boolean;
  onEscape?: () => void;
}

export interface NtFocusTrapController extends NtDisposable {
  readonly root: HTMLElement;
  readonly active: boolean;
  activate(): void;
  deactivate(): void;
  focusFirst(): void;
  focusLast(): void;
}

const focusTrapStacks = new WeakMap<Document, symbol[]>();

function pushFocusTrap(doc: Document, token: symbol): void {
  const stack = focusTrapStacks.get(doc) ?? [];
  stack.push(token);
  focusTrapStacks.set(doc, stack);
}

function removeFocusTrap(doc: Document, token: symbol): void {
  const stack = focusTrapStacks.get(doc);
  if (!stack) return;
  const index = stack.lastIndexOf(token);
  if (index >= 0) stack.splice(index, 1);
  if (stack.length === 0) focusTrapStacks.delete(doc);
}

function isTopFocusTrap(doc: Document, token: symbol): boolean {
  return focusTrapStacks.get(doc)?.at(-1) === token;
}

export function ntIsFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) {
    return false;
  }

  if (element.getAttribute('aria-disabled') === 'true') {
    return false;
  }

  if (element.tabIndex < 0 && !element.matches(NT_FOCUSABLE_SELECTOR)) {
    return false;
  }

  if (element.closest('[inert], [aria-hidden="true"]')) return false;

  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow) return false;
  const style = ownerWindow.getComputedStyle(element);

  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  return element.getClientRects().length > 0;
}

export function ntGetFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(NT_FOCUSABLE_SELECTOR))
    .filter(ntIsFocusable);
}

export function ntResolveFocusTarget(
  target: HTMLElement | (() => HTMLElement | null) | null | undefined,
): HTMLElement | null {
  if (!target) {
    return null;
  }

  return typeof target === 'function' ? target() : target;
}

export function ntFocusElement(
  element: HTMLElement | null,
  options: NtFocusOptions = {},
): boolean {
  if (!element) {
    return false;
  }

  element.focus({
    preventScroll: options.preventScroll ?? true,
  });

  return true;
}

export function ntFocusFirst(
  root: HTMLElement,
  options: NtFocusOptions = {},
): boolean {
  const first = ntGetFocusableElements(root)[0] ?? null;
  return ntFocusElement(first, options);
}

export function ntFocusLast(
  root: HTMLElement,
  options: NtFocusOptions = {},
): boolean {
  const items = ntGetFocusableElements(root);
  const last = items.at(-1) ?? null;
  return ntFocusElement(last, options);
}

export function ntCreateFocusTrap(
  root: HTMLElement,
  options: NtFocusTrapOptions = {},
): NtFocusTrapController {
  const {
    initialFocus = null,
    fallbackFocus = null,
    restoreFocus = true,
    preventScroll = true,
    escapeDeactivates = true,
    onEscape,
  } = options;

  const ownerDocument = root.ownerDocument;
  const stackToken = Symbol('nt-focus-trap');
  let active = false;
  let previousActiveElement: HTMLElement | null = null;
  let activationGeneration = 0;

  if (!root.hasAttribute('tabindex')) {
    root.tabIndex = -1;
  }

  function getFallbackFocus(): HTMLElement {
    return ntResolveFocusTarget(fallbackFocus) ?? root;
  }

  function focusInitial(): void {
    const target = ntResolveFocusTarget(initialFocus);

    if (ntFocusElement(target, { preventScroll })) {
      return;
    }

    if (ntFocusFirst(root, { preventScroll })) {
      return;
    }

    ntFocusElement(getFallbackFocus(), { preventScroll });
  }

  function focusFirst(): void {
    if (!ntFocusFirst(root, { preventScroll })) {
      ntFocusElement(getFallbackFocus(), { preventScroll });
    }
  }

  function focusLast(): void {
    if (!ntFocusLast(root, { preventScroll })) {
      ntFocusElement(getFallbackFocus(), { preventScroll });
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!active || !isTopFocusTrap(ownerDocument, stackToken)) {
      return;
    }

    if (event.key === NT_KEYS.escape && escapeDeactivates) {
      event.preventDefault();
      onEscape?.();
      deactivate();
      return;
    }

    if (event.key !== NT_KEYS.tab) {
      return;
    }

    const focusable = ntGetFocusableElements(root);

    if (focusable.length === 0) {
      event.preventDefault();
      ntFocusElement(getFallbackFocus(), { preventScroll });
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    const current = ownerDocument.activeElement;

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && current === first) {
      event.preventDefault();
      ntFocusElement(last, { preventScroll });
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      ntFocusElement(first, { preventScroll });
    }
  }

  function handleFocusIn(event: FocusEvent): void {
    if (!active || !isTopFocusTrap(ownerDocument, stackToken)) {
      return;
    }

    const target = event.target;

    if (target instanceof Node && root.contains(target)) {
      return;
    }

    focusFirst();
  }

  function activate(): void {
    if (active) {
      return;
    }

    active = true;
    activationGeneration += 1;
    const generation = activationGeneration;
    pushFocusTrap(ownerDocument, stackToken);

    const activeElement = ownerDocument.activeElement;

    previousActiveElement =
      activeElement instanceof HTMLElement ? activeElement : null;

    ownerDocument.addEventListener('keydown', handleKeyDown);
    ownerDocument.addEventListener('focusin', handleFocusIn);

    queueMicrotask(() => {
      if (
        active &&
        generation === activationGeneration &&
        isTopFocusTrap(ownerDocument, stackToken)
      ) {
        focusInitial();
      }
    });
  }

  function deactivate(): void {
    if (!active) {
      return;
    }

    active = false;
    activationGeneration += 1;
    removeFocusTrap(ownerDocument, stackToken);

    ownerDocument.removeEventListener('keydown', handleKeyDown);
    ownerDocument.removeEventListener('focusin', handleFocusIn);

    if (restoreFocus && previousActiveElement?.isConnected) {
      ntFocusElement(previousActiveElement, { preventScroll });
    }

    previousActiveElement = null;
  }

  return {
    root,

    get active() {
      return active;
    },

    activate,
    deactivate,
    focusFirst,
    focusLast,

    destroy() {
      deactivate();
    },
  };
}

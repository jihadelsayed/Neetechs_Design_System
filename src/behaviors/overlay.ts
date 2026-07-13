import type { NtDisposable, NtOverlayOptions } from '../types/index.js';
import { NT_KEYS } from './keyboard.js';

export type NtOverlayCloseReason = 'escape' | 'outside';

export interface NtOverlayController extends NtDisposable {
  readonly element: HTMLElement;
  readonly active: boolean;
  activate(): void;
  deactivate(): void;
}

export interface NtCreateOverlayOptions extends NtOverlayOptions {
  onClose?: (reason: NtOverlayCloseReason, event: Event) => void;
  outsideElements?: Array<HTMLElement | null | undefined>;
  /** Modal overlays isolate background content with `inert`. Defaults to `lockScroll`. */
  inertBackground?: boolean;
  /** Portaled backdrop or other elements that must remain outside the inert background. */
  inertExcludeElements?: Array<HTMLElement | null | undefined>;
}

interface NtScrollLockState {
  count: number;
  overflow: string;
  paddingRight: string;
}

const scrollLockStates = new WeakMap<Document, NtScrollLockState>();
const overlayStacks = new WeakMap<Document, symbol[]>();

interface NtInertState {
  count: number;
  inert: boolean;
  ariaHidden: string | null;
}

const inertStates = new WeakMap<HTMLElement, NtInertState>();

function ntPushOverlay(doc: Document, token: symbol): void {
  const stack = overlayStacks.get(doc) ?? [];
  stack.push(token);
  overlayStacks.set(doc, stack);
}

function ntRemoveOverlay(doc: Document, token: symbol): void {
  const stack = overlayStacks.get(doc);
  if (!stack) return;
  const index = stack.lastIndexOf(token);
  if (index >= 0) stack.splice(index, 1);
  if (stack.length === 0) overlayStacks.delete(doc);
}

function ntIsTopOverlay(doc: Document, token: symbol): boolean {
  return overlayStacks.get(doc)?.at(-1) === token;
}

function ntLockInert(element: HTMLElement): void {
  const state = inertStates.get(element);
  if (state) {
    state.count += 1;
    return;
  }

  inertStates.set(element, {
    count: 1,
    inert: element.inert,
    ariaHidden: element.getAttribute('aria-hidden'),
  });
  element.inert = true;
  element.setAttribute('aria-hidden', 'true');
}

function ntUnlockInert(element: HTMLElement): void {
  const state = inertStates.get(element);
  if (!state) return;
  state.count -= 1;
  if (state.count > 0) return;
  element.inert = state.inert;
  if (state.ariaHidden === null) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', state.ariaHidden);
  inertStates.delete(element);
}

/** Isolates every sibling branch outside a modal, including nested app roots. */
export function ntInertBackground(
  modal: HTMLElement,
  excludeElements: Array<HTMLElement | null | undefined> = [],
): NtDisposable {
  const body = modal.ownerDocument.body;
  const protectedElements = [modal, ...excludeElements].filter(
    (element): element is HTMLElement => Boolean(element?.isConnected),
  );
  const locked = new Set<HTMLElement>();
  let branch: HTMLElement | null = modal;

  while (branch && branch !== body) {
    const parent: HTMLElement | null = branch.parentElement;
    if (!parent) break;

    for (const sibling of Array.from(parent.children)) {
      if (!(sibling instanceof HTMLElement)) continue;
      const containsProtected = protectedElements.some(
        (element) => sibling === element || sibling.contains(element),
      );
      if (!containsProtected && !locked.has(sibling)) {
        ntLockInert(sibling);
        locked.add(sibling);
      }
    }
    branch = parent;
  }

  return {
    destroy() {
      for (const element of locked) ntUnlockInert(element);
      locked.clear();
    },
  };
}

export function ntIsBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function ntGetOwnerDocument(element?: HTMLElement | null): Document {
  return element?.ownerDocument ?? document;
}

export function ntGetOwnerWindow(element?: HTMLElement | null): Window {
  return ntGetOwnerDocument(element).defaultView ?? window;
}

export function ntIsEventInside(
  event: Event,
  elements: Array<HTMLElement | null | undefined>,
): boolean {
  const path = event.composedPath();

  return elements.some((element) => {
    if (!element) {
      return false;
    }

    if (path.includes(element)) {
      return true;
    }

    const target = event.target;
    return target instanceof Node && element.contains(target);
  });
}

export function ntLockScroll(doc: Document = document): NtDisposable {
  const existingState = scrollLockStates.get(doc);

  if (existingState) {
    existingState.count += 1;

    return {
      destroy() {
        ntUnlockScroll(doc);
      },
    };
  }

  const win = doc.defaultView;
  const body = doc.body;
  const scrollbarWidth = win
    ? Math.max(0, win.innerWidth - doc.documentElement.clientWidth)
    : 0;

  const state: NtScrollLockState = {
    count: 1,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  scrollLockStates.set(doc, state);

  body.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return {
    destroy() {
      ntUnlockScroll(doc);
    },
  };
}

export function ntUnlockScroll(doc: Document = document): void {
  const state = scrollLockStates.get(doc);

  if (!state) {
    return;
  }

  state.count -= 1;

  if (state.count > 0) {
    return;
  }

  doc.body.style.overflow = state.overflow;
  doc.body.style.paddingRight = state.paddingRight;
  scrollLockStates.delete(doc);
}

export function ntOnOutsidePointerDown(
  elements: Array<HTMLElement | null | undefined>,
  handler: (event: PointerEvent) => void,
  doc: Document = document,
): NtDisposable {
  const listener = (event: PointerEvent) => {
    if (ntIsEventInside(event, elements)) {
      return;
    }

    handler(event);
  };

  doc.addEventListener('pointerdown', listener, true);

  return {
    destroy() {
      doc.removeEventListener('pointerdown', listener, true);
    },
  };
}

export function ntCreateOverlay(
  element: HTMLElement,
  options: NtCreateOverlayOptions = {},
): NtOverlayController {
  const {
    closeOnEscape = true,
    closeOnOutsideClick = true,
    lockScroll = true,
    outsideElements = [],
    inertBackground = lockScroll,
    inertExcludeElements = [],
    onClose,
  } = options;

  const ownerDocument = element.ownerDocument;
  const disposables: NtDisposable[] = [];
  let active = false;
  const stackToken = Symbol('nt-overlay');

  function destroyDisposables(): void {
    while (disposables.length > 0) {
      disposables.pop()?.destroy();
    }
  }

  function requestClose(reason: NtOverlayCloseReason, event: Event): void {
    onClose?.(reason, event);
    deactivate();
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (
      !active ||
      !ntIsTopOverlay(ownerDocument, stackToken) ||
      event.key !== NT_KEYS.escape ||
      !closeOnEscape
    ) {
      return;
    }

    event.preventDefault();
    requestClose('escape', event);
  }

  function activate(): void {
    if (active) {
      return;
    }

    active = true;
    element.dataset.state = 'open';
    ntPushOverlay(ownerDocument, stackToken);

    if (lockScroll) {
      disposables.push(ntLockScroll(ownerDocument));
    }

    if (inertBackground) {
      disposables.push(ntInertBackground(element, inertExcludeElements));
    }

    if (closeOnEscape) {
      ownerDocument.addEventListener('keydown', handleKeyDown);

      disposables.push({
        destroy() {
          ownerDocument.removeEventListener('keydown', handleKeyDown);
        },
      });
    }

    if (closeOnOutsideClick) {
      disposables.push(
        ntOnOutsidePointerDown(
          [element, ...outsideElements],
          (event) => {
            if (ntIsTopOverlay(ownerDocument, stackToken)) {
              requestClose('outside', event);
            }
          },
          ownerDocument,
        ),
      );
    }
  }

  function deactivate(): void {
    if (!active) {
      return;
    }

    active = false;
    element.dataset.state = 'closed';
    ntRemoveOverlay(ownerDocument, stackToken);
    destroyDisposables();
  }

  return {
    element,

    get active() {
      return active;
    },

    activate,
    deactivate,

    destroy() {
      deactivate();
    },
  };
}

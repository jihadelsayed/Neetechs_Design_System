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
}

interface NtScrollLockState {
  count: number;
  overflow: string;
  paddingRight: string;
}

const scrollLockStates = new WeakMap<Document, NtScrollLockState>();

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
    onClose,
  } = options;

  const ownerDocument = element.ownerDocument;
  const disposables: NtDisposable[] = [];
  let active = false;

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
    if (!active || event.key !== NT_KEYS.escape || !closeOnEscape) {
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

    if (lockScroll) {
      disposables.push(ntLockScroll(ownerDocument));
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
          (event) => requestClose('outside', event),
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
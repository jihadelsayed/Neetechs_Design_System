import type {
  NtDisposable,
  NtRovingFocusController,
  NtRovingFocusOptions,
} from '../types/index.js';
import { ntGetInlineArrowKeys } from './direction.js';

export const NT_KEYS = {
  arrowDown: 'ArrowDown',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  arrowUp: 'ArrowUp',
  end: 'End',
  enter: 'Enter',
  escape: 'Escape',
  home: 'Home',
  space: ' ',
  tab: 'Tab',
} as const;

export type NtKeyboardHandler = (event: KeyboardEvent) => void;

export function ntIsEscapeKey(event: KeyboardEvent): boolean {
  return event.key === NT_KEYS.escape;
}

export function ntIsEnterKey(event: KeyboardEvent): boolean {
  return event.key === NT_KEYS.enter;
}

export function ntIsSpaceKey(event: KeyboardEvent): boolean {
  return event.key === NT_KEYS.space || event.code === 'Space';
}

export function ntIsActivationKey(event: KeyboardEvent): boolean {
  return ntIsEnterKey(event) || ntIsSpaceKey(event);
}

export function ntIsArrowKey(event: KeyboardEvent): boolean {
  return (
    event.key === NT_KEYS.arrowUp ||
    event.key === NT_KEYS.arrowRight ||
    event.key === NT_KEYS.arrowDown ||
    event.key === NT_KEYS.arrowLeft
  );
}

export function ntIsTextInputElement(element: EventTarget | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}

export function ntOnKey(
  element: HTMLElement | Document,
  key: string,
  handler: NtKeyboardHandler,
): NtDisposable {
  const listener: EventListener = (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.key === key) {
      handler(event);
    }
  };

  element.addEventListener('keydown', listener);

  return {
    destroy() {
      element.removeEventListener('keydown', listener);
    },
  };
}

export function ntOnEscape(
  element: HTMLElement | Document,
  handler: NtKeyboardHandler,
): NtDisposable {
  return ntOnKey(element, NT_KEYS.escape, handler);
}

export function ntOnActivation(
  element: HTMLElement,
  handler: NtKeyboardHandler,
): NtDisposable {
  const listener: EventListener = (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (!ntIsActivationKey(event)) {
      return;
    }

    event.preventDefault();
    handler(event);
  };

  element.addEventListener('keydown', listener);

  return {
    destroy() {
      element.removeEventListener('keydown', listener);
    },
  };
}

export function ntGetEnabledItems(
  root: HTMLElement,
  itemSelector: string,
): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(itemSelector)).filter(
    (item) =>
      !item.hasAttribute('disabled') &&
      item.getAttribute('aria-disabled') !== 'true' &&
      item.dataset.disabled !== 'true',
  );
}

export function ntFocusItem(
  items: HTMLElement[],
  index: number,
  options: FocusOptions = { preventScroll: true },
): number {
  const item = items[index];

  if (!item) {
    return -1;
  }

  item.focus(options);
  return index;
}

export function ntMoveIndex(
  currentIndex: number,
  itemCount: number,
  direction: 1 | -1,
  loop = true,
): number {
  if (itemCount <= 0) {
    return -1;
  }

  const nextIndex = currentIndex + direction;

  if (nextIndex >= 0 && nextIndex < itemCount) {
    return nextIndex;
  }

  if (!loop) {
    return currentIndex;
  }

  return direction > 0 ? 0 : itemCount - 1;
}

export function ntCreateRovingFocus(
  options: NtRovingFocusOptions,
): NtRovingFocusController {
  const {
    root,
    itemSelector,
    orientation = 'vertical',
    loop = true,
    initialIndex = 0,
  } = options;

  let currentIndex = initialIndex;

  function getItems(): HTMLElement[] {
    return ntGetEnabledItems(root, itemSelector);
  }

  function setTabIndexes(items: HTMLElement[]): void {
    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex ? 0 : -1;
    });
  }

  function focusAt(index: number): void {
    const items = getItems();

    if (items.length === 0) {
      currentIndex = -1;
      return;
    }

    const normalizedIndex = Math.max(0, Math.min(index, items.length - 1));
    currentIndex = ntFocusItem(items, normalizedIndex);
    setTabIndexes(items);
  }

  function focusFirst(): void {
    focusAt(0);
  }

  function focusLast(): void {
    const items = getItems();
    focusAt(items.length - 1);
  }

  function focusNext(): void {
    const items = getItems();
    focusAt(ntMoveIndex(currentIndex, items.length, 1, loop));
  }

  function focusPrevious(): void {
    const items = getItems();
    focusAt(ntMoveIndex(currentIndex, items.length, -1, loop));
  }

  const onKeyDown: EventListener = (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    const isHorizontal =
      orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const inlineKeys = ntGetInlineArrowKeys(root);

    if (event.key === NT_KEYS.home) {
      event.preventDefault();
      focusFirst();
      return;
    }

    if (event.key === NT_KEYS.end) {
      event.preventDefault();
      focusLast();
      return;
    }

    if (
      (isVertical && event.key === NT_KEYS.arrowDown) ||
      (isHorizontal && event.key === inlineKeys.next)
    ) {
      event.preventDefault();
      focusNext();
      return;
    }

    if (
      (isVertical && event.key === NT_KEYS.arrowUp) ||
      (isHorizontal && event.key === inlineKeys.previous)
    ) {
      event.preventDefault();
      focusPrevious();
    }
  };

  const onFocusIn = (event: FocusEvent) => {
    const items = getItems();
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const index = items.indexOf(target);

    if (index < 0) {
      return;
    }

    currentIndex = index;
    setTabIndexes(items);
  };

  setTabIndexes(getItems());

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('focusin', onFocusIn);

  return {
    root,

    get currentIndex() {
      return currentIndex;
    },

    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,

    destroy() {
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('focusin', onFocusIn);
    },
  };
}

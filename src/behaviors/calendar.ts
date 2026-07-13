import type { NtDisposable } from '../types/index.js';
import { NT_KEYS } from './keyboard.js';

export interface NtCalendarGridOptions {
  root: HTMLElement;
  dateSelector?: string;
  columns?: number;
  liveRegion?: HTMLElement | null;
  onSelect?: (date: HTMLElement) => void;
}

export interface NtCalendarGridController extends NtDisposable {
  readonly root: HTMLElement;
  focusDate(index: number): void;
  announceRange(message: string): void;
}

export function ntCreateCalendarGrid(options: NtCalendarGridOptions): NtCalendarGridController {
  const {
    root,
    dateSelector = '[data-nt-calendar-date]',
    columns = 7,
    liveRegion = null,
    onSelect,
  } = options;
  root.setAttribute('role', 'grid');

  function dates(): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(dateSelector)).filter(
      (date) => !date.hasAttribute('disabled') && date.getAttribute('aria-disabled') !== 'true',
    );
  }

  function focusDate(index: number): void {
    const items = dates();
    const target = items[Math.max(0, Math.min(index, items.length - 1))];
    if (!target) return;
    items.forEach((item) => {
      item.tabIndex = item === target ? 0 : -1;
      if (!item.hasAttribute('role')) item.setAttribute('role', 'gridcell');
    });
    target.focus({ preventScroll: true });
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const date = target.closest<HTMLElement>(dateSelector);
    const items = dates();
    const index = date ? items.indexOf(date) : -1;
    if (index < 0) return;
    let next: number | null = null;
    if (event.key === NT_KEYS.arrowRight) next = index + 1;
    else if (event.key === NT_KEYS.arrowLeft) next = index - 1;
    else if (event.key === NT_KEYS.arrowDown) next = index + columns;
    else if (event.key === NT_KEYS.arrowUp) next = index - columns;
    else if (event.key === NT_KEYS.home) next = index - (index % columns);
    else if (event.key === NT_KEYS.end) next = index + (columns - 1 - (index % columns));
    if (next !== null) {
      event.preventDefault();
      focusDate(next);
    }
  };

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const date = target.closest<HTMLElement>(dateSelector);
    if (!date || !root.contains(date) || date.getAttribute('aria-disabled') === 'true') return;
    for (const item of dates()) item.setAttribute('aria-selected', String(item === date));
    onSelect?.(date);
  };

  root.addEventListener('keydown', handleKeyDown);
  root.addEventListener('click', handleClick);
  const initial = dates().findIndex((date) => date.getAttribute('aria-selected') === 'true');
  focusDate(initial >= 0 ? initial : 0);

  return {
    root,
    focusDate,
    announceRange(message: string) {
      if (liveRegion) liveRegion.textContent = message.trim();
    },
    destroy() {
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('click', handleClick);
    },
  };
}

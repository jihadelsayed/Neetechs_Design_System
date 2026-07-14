import type { NtDisposable } from '../types/index.js';
import { NT_KEYS, ntIsActivationKey } from './keyboard.js';
import { ntGetInlineArrowKeys } from './direction.js';

export type NtGridSortDirection = 'ascending' | 'descending' | 'none';

export interface NtDataGridOptions {
  root: HTMLElement;
  rowSelector?: string;
  cellSelector?: string;
  selection?: 'none' | 'row' | 'cell';
  liveRegion?: HTMLElement | null;
  onActivate?: (cell: HTMLElement, event: KeyboardEvent) => void;
  onSelectionChange?: (target: HTMLElement) => void;
}

export interface NtDataGridController extends NtDisposable {
  readonly root: HTMLElement;
  focusCell(row: number, column: number): void;
  setSort(header: HTMLElement, direction: NtGridSortDirection, announcement?: string): void;
}

export function ntCreateDataGrid(options: NtDataGridOptions): NtDataGridController {
  const {
    root,
    rowSelector = '[role="row"]',
    cellSelector = '[role="gridcell"],[role="columnheader"],[role="rowheader"]',
    selection = 'none',
    liveRegion = null,
    onActivate,
    onSelectionChange,
  } = options;
  root.setAttribute('role', 'grid');

  function matrix(): HTMLElement[][] {
    return Array.from(root.querySelectorAll<HTMLElement>(rowSelector))
      .map((row) => Array.from(row.querySelectorAll<HTMLElement>(cellSelector)))
      .filter((row) => row.length > 0);
  }

  function enabled(cell: HTMLElement | undefined): cell is HTMLElement {
    return Boolean(
      cell &&
        cell.getAttribute('aria-disabled') !== 'true' &&
        cell.dataset.disabled !== 'true',
    );
  }

  function focusCell(rowIndex: number, columnIndex: number): void {
    const rows = matrix();
    const row = rows[Math.max(0, Math.min(rowIndex, rows.length - 1))];
    if (!row) return;
    const cell = row[Math.max(0, Math.min(columnIndex, row.length - 1))];
    if (!enabled(cell)) return;
    for (const candidate of rows.flat()) candidate.tabIndex = candidate === cell ? 0 : -1;
    cell.focus({ preventScroll: true });
  }

  function coordinates(cell: HTMLElement): [number, number] {
    const rows = matrix();
    const row = rows.findIndex((candidate) => candidate.includes(cell));
    return [row, row >= 0 ? rows[row]?.indexOf(cell) ?? -1 : -1];
  }

  function selectCell(cell: HTMLElement): void {
    if (selection === 'none' || !enabled(cell)) return;
    const selected = selection === 'row' ? cell.closest<HTMLElement>(rowSelector) : cell;
    if (!selected) return;
    const selector = selection === 'row' ? rowSelector : cellSelector;
    for (const candidate of root.querySelectorAll<HTMLElement>(selector)) {
      if (candidate.hasAttribute('aria-selected')) candidate.setAttribute('aria-selected', 'false');
    }
    selected.setAttribute('aria-selected', 'true');
    onSelectionChange?.(selected);
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const cell = target.closest<HTMLElement>(cellSelector);
    if (!cell || !root.contains(cell)) return;
    const [row, column] = coordinates(cell);
    const inlineKeys = ntGetInlineArrowKeys(root);
    let next: [number, number] | null = null;
    if (event.key === inlineKeys.next) next = [row, column + 1];
    else if (event.key === inlineKeys.previous) next = [row, column - 1];
    else if (event.key === NT_KEYS.arrowDown) next = [row + 1, column];
    else if (event.key === NT_KEYS.arrowUp) next = [row - 1, column];
    else if (event.key === NT_KEYS.home) next = event.ctrlKey ? [0, 0] : [row, 0];
    else if (event.key === NT_KEYS.end) {
      const rows = matrix();
      const targetRow = event.ctrlKey ? rows.length - 1 : row;
      next = [targetRow, (rows[targetRow]?.length ?? 1) - 1];
    } else if (event.target === cell && ntIsActivationKey(event)) {
      event.preventDefault();
      selectCell(cell);
      onActivate?.(cell, event);
    }
    if (next) {
      event.preventDefault();
      focusCell(...next);
    }
  };

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const cell = target.closest<HTMLElement>(cellSelector);
    if (!cell || !root.contains(cell)) return;
    selectCell(cell);
  };

  root.addEventListener('keydown', handleKeyDown);
  root.addEventListener('click', handleClick);
  const first = matrix().flat().find(enabled);
  if (first && !matrix().flat().some((cell) => cell.tabIndex === 0)) first.tabIndex = 0;

  return {
    root,
    focusCell,
    setSort(header, direction, announcement) {
      for (const candidate of root.querySelectorAll<HTMLElement>('[aria-sort]')) {
        if (candidate !== header) candidate.setAttribute('aria-sort', 'none');
      }
      header.setAttribute('aria-sort', direction);
      if (liveRegion && announcement) liveRegion.textContent = announcement;
    },
    destroy() {
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('click', handleClick);
    },
  };
}

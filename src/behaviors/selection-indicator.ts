import type { NtDisposable } from '../types/index.js';

/* -------------------------------------------------------------------------- */
/* Sliding selection indicator: measure the selected item, let CSS animate     */
/* -------------------------------------------------------------------------- */

export interface NtSelectionIndicatorOptions {
  /**
   * Positioned container that draws the indicator (`.nt-tabs__list`,
   * `.nt-segmented-control`). It receives the geometry custom properties and
   * the `data-nt-indicator` state attribute.
   */
  container: HTMLElement;
  /** Selector matching the currently selected item inside `container`. */
  selectedSelector?: string;
}

export interface NtSelectionIndicatorController extends NtDisposable {
  readonly container: HTMLElement;
  /** Re-measure, e.g. after the application re-renders items. */
  update(): void;
}

const DEFAULT_SELECTED_SELECTOR = [
  '[aria-selected="true"]',
  '[data-state="active"]',
  '.nt-tabs__trigger--active',
  '.nt-segmented-control__label--active',
  '.nt-segmented-control__input:checked + .nt-segmented-control__label',
  '[aria-current]:not([aria-current="false"])',
].join(',');

const STATE_ATTRIBUTE = 'data-nt-indicator';
const OBSERVED_ATTRIBUTES = ['aria-selected', 'aria-current', 'data-state', 'class', 'checked', 'hidden', 'dir'];

/**
 * Framework-free helper that lets a selection indicator glide between items.
 *
 * It only measures: the selected item's offset and size are written to
 * `container` as `--nt-indicator-x`, `--nt-indicator-y`,
 * `--nt-indicator-width`, and `--nt-indicator-height` (x is relative to the
 * inline-start edge, so it is negative in RTL), and `data-nt-indicator`
 * becomes `placed` on the first measurement and `ready` one frame later.
 * Components draw and transition the indicator in CSS only while the
 * attribute is present, so server-rendered markup, the period before
 * hydration, and failures all fall back to the static per-item indicator.
 *
 * Selection changes are picked up from attribute mutations and `change`
 * events (radio-based segmented controls); size changes from a
 * ResizeObserver; direction changes from the document element's `dir`.
 * Nothing runs during scrolling.
 */
export function ntCreateSelectionIndicator(
  options: NtSelectionIndicatorOptions,
): NtSelectionIndicatorController {
  const { container, selectedSelector = DEFAULT_SELECTED_SELECTOR } = options;
  const win = container.ownerDocument.defaultView;
  let frame = 0;
  let readyFrame = 0;
  let destroyed = false;

  function selectedItem(): HTMLElement | null {
    for (const element of container.querySelectorAll<HTMLElement>(selectedSelector)) {
      if (element.offsetParent !== null || element.getClientRects().length > 0) return element;
    }
    return null;
  }

  function measure(): void {
    frame = 0;
    if (destroyed) return;
    const item = selectedItem();
    if (!item || item.offsetWidth === 0) {
      container.setAttribute(STATE_ATTRIBUTE, 'none');
      return;
    }

    // offsetLeft/offsetTop are relative to the container when it is the
    // offsetParent (components make it position: relative).
    let x = item.offsetLeft;
    let y = item.offsetTop;
    let parent = item.offsetParent;
    while (parent && parent !== container && parent instanceof HTMLElement && container.contains(parent)) {
      x += parent.offsetLeft;
      y += parent.offsetTop;
      parent = parent.offsetParent;
    }
    const rtl = win?.getComputedStyle(container).direction === 'rtl';
    const inlineStart = rtl ? x + item.offsetWidth - container.clientWidth : x;

    container.style.setProperty('--nt-indicator-x', `${inlineStart}px`);
    container.style.setProperty('--nt-indicator-y', `${y}px`);
    container.style.setProperty('--nt-indicator-width', `${item.offsetWidth}px`);
    container.style.setProperty('--nt-indicator-height', `${item.offsetHeight}px`);

    const state = container.getAttribute(STATE_ATTRIBUTE);
    if (state !== 'ready') {
      // Place without a transition first, then enable motion, so the first
      // paint never slides in from the container origin.
      container.setAttribute(STATE_ATTRIBUTE, 'placed');
      if (win && !readyFrame) {
        readyFrame = win.requestAnimationFrame(() => {
          readyFrame = 0;
          if (!destroyed && container.getAttribute(STATE_ATTRIBUTE) === 'placed') {
            container.setAttribute(STATE_ATTRIBUTE, 'ready');
          }
        });
      }
    }
  }

  function schedule(): void {
    if (destroyed || frame) return;
    if (win && typeof win.requestAnimationFrame === 'function') {
      frame = win.requestAnimationFrame(measure);
    } else {
      measure();
    }
  }

  const mutationObserver = typeof MutationObserver === 'function'
    ? new MutationObserver(schedule)
    : null;
  mutationObserver?.observe(container, {
    attributes: true,
    attributeFilter: OBSERVED_ATTRIBUTES,
    childList: true,
    subtree: true,
  });
  // Direction switches flip the inline-start origin of the measurement.
  const root = container.ownerDocument.documentElement;
  if (root !== container) {
    mutationObserver?.observe(root, { attributes: true, attributeFilter: ['dir', 'lang'] });
  }

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(schedule)
    : null;
  resizeObserver?.observe(container);
  for (const child of Array.from(container.children)) resizeObserver?.observe(child);

  container.addEventListener('change', schedule);
  container.ownerDocument.fonts?.ready.then(schedule).catch(() => undefined);
  measure();

  return {
    container,
    update: measure,
    destroy() {
      destroyed = true;
      if (frame) win?.cancelAnimationFrame(frame);
      if (readyFrame) win?.cancelAnimationFrame(readyFrame);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      container.removeEventListener('change', schedule);
      container.removeAttribute(STATE_ATTRIBUTE);
      for (const name of ['--nt-indicator-x', '--nt-indicator-y', '--nt-indicator-width', '--nt-indicator-height']) {
        container.style.removeProperty(name);
      }
    },
  };
}

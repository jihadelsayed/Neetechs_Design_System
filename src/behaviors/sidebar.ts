import type { NtDisposable } from '../types/index.js';
import { ntCreateFocusTrap, type NtFocusTrapController } from './focus-trap.js';
import { ntEnsureId, ntSetAriaControls } from './ids.js';
import { ntCreateOverlay, type NtOverlayController } from './overlay.js';
import { ntViewportQuery } from './viewport.js';

/* -------------------------------------------------------------------------- */
/* Workspace sidebar: collapse rail, collapsible groups, off-canvas mode       */
/* -------------------------------------------------------------------------- */

export interface NtSidebarOptions {
  /**
   * The sidebar panel. Inside an app shell this is `.nt-app-shell__sidebar`
   * (the element that slides in off-canvas); standalone it is `.nt-sidebar`.
   */
  sidebar: HTMLElement;
  /**
   * `.nt-app-shell` root. When given, collapsing toggles
   * `nt-app-shell--collapsed` on it; otherwise `nt-sidebar--collapsed` is
   * toggled on the `.nt-sidebar` element.
   */
  shell?: HTMLElement | null;
  /** Desktop button that switches between the full sidebar and the icon rail. */
  collapseToggle?: HTMLElement | null;
  /** Menu button that opens the sidebar off-canvas below the shell breakpoint. */
  menuToggle?: HTMLElement | null;
  /** `.nt-app-shell__overlay` shown behind the off-canvas sidebar. */
  backdrop?: HTMLElement | null;
  /** Disclosure buttons of collapsible groups. */
  groupTriggerSelector?: string;
  /** Navigation items; their label text becomes a `title` while collapsed. */
  itemSelector?: string;
  /** Elements inside the sidebar that close it off-canvas. */
  closeSelector?: string;
  /** Initial collapse state when nothing is persisted. Default `false`. */
  initialCollapsed?: boolean;
  /**
   * `localStorage` key that remembers the collapse preference. Storage
   * failures (private mode, SSR, blocked storage) are ignored.
   */
  storageKey?: string | null;
  /**
   * Media query in which the sidebar is off-canvas. Defaults to the shell
   * breakpoint (`ntViewportQuery('lg')`), or to the phone bound
   * (`ntViewportQuery('sm')`) when `shell` has `nt-app-shell--dock-tablet`.
   * `null` disables off-canvas mode.
   */
  offcanvasQuery?: string | null;
  /** Close the off-canvas sidebar after a link inside it is activated. Default `true`. */
  closeOnNavigate?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface NtSidebarController extends NtDisposable {
  readonly sidebar: HTMLElement;
  readonly collapsed: boolean;
  /** Whether the off-canvas sidebar is open. Always `false` on desktop. */
  readonly isOpen: boolean;
  /** Whether the off-canvas media query currently matches. */
  readonly isOffcanvas: boolean;
  setCollapsed(collapsed: boolean): void;
  toggleCollapsed(): void;
  open(): void;
  close(options?: { restoreFocus?: boolean }): void;
  toggle(): void;
  setGroupExpanded(trigger: HTMLElement, expanded: boolean): void;
  /** Re-scan groups and items after the application re-renders navigation. */
  refresh(): void;
}

const DEFAULT_GROUP_TRIGGER_SELECTOR = '.nt-sidebar__group-trigger';
const DEFAULT_ITEM_SELECTOR = '.nt-sidebar__item';
const DEFAULT_CLOSE_SELECTOR = '[data-nt-sidebar-close]';
const GENERATED_TITLE = 'data-nt-sidebar-title';

function readStoredCollapsed(key: string | null | undefined): boolean | null {
  if (!key) return null;
  try {
    const value = globalThis.localStorage?.getItem(key);
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    // Storage can be unavailable (SSR, privacy mode, sandboxed frames).
  }
  return null;
}

function writeStoredCollapsed(key: string | null | undefined, collapsed: boolean): void {
  if (!key) return;
  try {
    globalThis.localStorage?.setItem(key, collapsed ? '1' : '0');
  } catch {
    // A failed write only loses persistence; the visible state is already set.
  }
}

/**
 * Framework-free controller for the workspace sidebar.
 *
 * - **Rail:** `setCollapsed` toggles the icon rail; `collapseToggle` gets
 *   `aria-expanded` and `aria-controls`; icon-only items get a `title`
 *   (their labels also stay in the accessibility tree via CSS).
 * - **Groups:** group triggers follow the disclosure pattern
 *   (`aria-expanded` + `aria-controls`); a group containing the current
 *   page starts expanded.
 * - **Off-canvas:** inside the off-canvas media query, `open()` slides the
 *   same sidebar in as a modal panel: focus trap, Escape, outside click,
 *   scroll lock, background inerting, and focus return to `menuToggle`.
 *   Growing past the breakpoint closes it so no stale modal state remains.
 *
 * Routing stays with the application; links are never intercepted.
 */
export function ntCreateSidebar(options: NtSidebarOptions): NtSidebarController {
  const {
    sidebar,
    shell = null,
    collapseToggle = null,
    menuToggle = null,
    backdrop = null,
    groupTriggerSelector = DEFAULT_GROUP_TRIGGER_SELECTOR,
    itemSelector = DEFAULT_ITEM_SELECTOR,
    closeSelector = DEFAULT_CLOSE_SELECTOR,
    initialCollapsed = false,
    storageKey = null,
    offcanvasQuery: providedOffcanvasQuery,
    closeOnNavigate = true,
    onCollapsedChange,
    onOpenChange,
  } = options;

  const offcanvasQuery = providedOffcanvasQuery !== undefined
    ? providedOffcanvasQuery
    : ntViewportQuery(shell?.classList.contains('nt-app-shell--dock-tablet') ? 'sm' : 'lg');
  const doc = sidebar.ownerDocument;
  const win = doc.defaultView;
  const collapseTarget = shell ?? (sidebar.classList.contains('nt-sidebar')
    ? sidebar
    : sidebar.querySelector<HTMLElement>('.nt-sidebar') ?? sidebar);
  const collapsedClass = shell ? 'nt-app-shell--collapsed' : 'nt-sidebar--collapsed';
  const media = offcanvasQuery && win && typeof win.matchMedia === 'function'
    ? win.matchMedia(offcanvasQuery)
    : null;
  const originalRole = sidebar.getAttribute('role');

  let collapsed = readStoredCollapsed(storageKey) ?? initialCollapsed;
  let isOpen = false;
  let overlay: NtOverlayController | null = null;
  let focusTrap: NtFocusTrapController | null = null;

  /* ---------------------------------------------------------------- rail */

  function syncItemTitles(): void {
    for (const item of sidebar.querySelectorAll<HTMLElement>(itemSelector)) {
      const generated = item.hasAttribute(GENERATED_TITLE);
      if (railApplied()) {
        if (item.hasAttribute('title') && !generated) continue;
        const label = item.querySelector('.nt-sidebar__item-label')?.textContent?.trim()
          || item.getAttribute('aria-label')
          || item.textContent?.trim();
        if (!label) continue;
        item.setAttribute('title', label);
        item.setAttribute(GENERATED_TITLE, '');
      } else if (generated) {
        item.removeAttribute('title');
        item.removeAttribute(GENERATED_TITLE);
      }
    }
  }

  // The rail is a docked presentation: while the sidebar is off-canvas the
  // preference is kept but not applied, so the panel always opens in full.
  const railApplied = () => collapsed && !isOffcanvas();

  function syncCollapsed(): void {
    collapseTarget.classList.toggle(collapsedClass, railApplied());
    if (collapseToggle) {
      collapseToggle.setAttribute('aria-expanded', String(!collapsed));
      ntSetAriaControls(collapseToggle, sidebar, 'nt-sidebar');
    }
    syncItemTitles();
  }

  function setCollapsed(next: boolean): void {
    if (next === collapsed) return;
    collapsed = next;
    syncCollapsed();
    writeStoredCollapsed(storageKey, collapsed);
    onCollapsedChange?.(collapsed);
  }

  /* -------------------------------------------------------------- groups */

  function groupPanel(trigger: HTMLElement): HTMLElement | null {
    const controlled = trigger.getAttribute('aria-controls');
    const byId = controlled ? doc.getElementById(controlled) : null;
    if (byId) return byId;
    const next = trigger.nextElementSibling;
    return next instanceof HTMLElement ? next : null;
  }

  function setGroupExpanded(trigger: HTMLElement, expanded: boolean): void {
    trigger.setAttribute('aria-expanded', String(expanded));
    const group = trigger.closest<HTMLElement>('.nt-sidebar__group');
    if (group) group.dataset.state = expanded ? 'open' : 'closed';
  }

  function initGroups(): void {
    for (const trigger of sidebar.querySelectorAll<HTMLElement>(groupTriggerSelector)) {
      const panel = groupPanel(trigger);
      if (panel) ntSetAriaControls(trigger, panel, 'nt-sidebar-group');
      const containsCurrent = Boolean(panel?.querySelector('[aria-current="page"], .nt-sidebar__item--active'));
      const expanded = containsCurrent || trigger.getAttribute('aria-expanded') !== 'false';
      setGroupExpanded(trigger, expanded);
    }
  }

  /* ---------------------------------------------------------- off-canvas */

  const isOffcanvas = () => Boolean(media?.matches);

  function syncOpenAttributes(): void {
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      ntSetAriaControls(menuToggle, sidebar, 'nt-sidebar');
    }
    if (backdrop) {
      backdrop.dataset.state = isOpen ? 'open' : 'closed';
      if (isOpen) backdrop.removeAttribute('hidden');
      else backdrop.setAttribute('hidden', '');
    }
    if (isOpen) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
    } else {
      if (originalRole === null) sidebar.removeAttribute('role');
      else sidebar.setAttribute('role', originalRole);
      sidebar.removeAttribute('aria-modal');
    }
  }

  function open(): void {
    if (isOpen || !isOffcanvas()) return;
    isOpen = true;
    if (!sidebar.hasAttribute('tabindex')) sidebar.setAttribute('tabindex', '-1');
    overlay = ntCreateOverlay(sidebar, {
      closeOnEscape: true,
      closeOnOutsideClick: true,
      lockScroll: true,
      inertBackground: true,
      outsideElements: [menuToggle],
      inertExcludeElements: [backdrop],
      onClose: () => close(),
    });
    focusTrap = ntCreateFocusTrap(sidebar, {
      fallbackFocus: sidebar,
      restoreFocus: false,
      escapeDeactivates: false,
    });
    syncOpenAttributes();
    overlay.activate();
    focusTrap.activate();
    onOpenChange?.(true);
  }

  function close(closeOptions: { restoreFocus?: boolean } = {}): void {
    if (!isOpen) return;
    const { restoreFocus = true } = closeOptions;
    isOpen = false;
    const activeOverlay = overlay;
    overlay = null;
    activeOverlay?.destroy();
    focusTrap?.destroy();
    focusTrap = null;
    sidebar.dataset.state = 'closed';
    syncOpenAttributes();
    if (restoreFocus && menuToggle && isOffcanvas()) {
      menuToggle.focus({ preventScroll: true });
    }
    onOpenChange?.(false);
  }

  /* ------------------------------------------------------------- events */

  const handleSidebarClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !sidebar.contains(target)) return;

    const trigger = target.closest<HTMLElement>(groupTriggerSelector);
    if (trigger && sidebar.contains(trigger)) {
      setGroupExpanded(trigger, trigger.getAttribute('aria-expanded') !== 'true');
      return;
    }

    if (!isOpen) return;
    if (target.closest(closeSelector)) {
      close();
    } else if (closeOnNavigate && target.closest('a[href]')) {
      close({ restoreFocus: false });
    }
  };
  const handleCollapseClick = () => setCollapsed(!collapsed);
  const handleMenuClick = () => (isOpen ? close() : open());
  const handleBackdropClick = () => close();
  const handleMediaChange = () => {
    if (!isOffcanvas() && isOpen) close({ restoreFocus: false });
    syncCollapsed();
  };

  sidebar.addEventListener('click', handleSidebarClick);
  collapseToggle?.addEventListener('click', handleCollapseClick);
  menuToggle?.addEventListener('click', handleMenuClick);
  backdrop?.addEventListener('click', handleBackdropClick);
  media?.addEventListener?.('change', handleMediaChange);

  ntEnsureId(sidebar, 'nt-sidebar');
  sidebar.dataset.state = 'closed';
  syncCollapsed();
  syncOpenAttributes();
  initGroups();

  return {
    sidebar,
    get collapsed() {
      return collapsed;
    },
    get isOpen() {
      return isOpen;
    },
    get isOffcanvas() {
      return isOffcanvas();
    },
    setCollapsed,
    toggleCollapsed: () => setCollapsed(!collapsed),
    open,
    close,
    toggle: () => (isOpen ? close() : open()),
    setGroupExpanded,
    refresh() {
      initGroups();
      syncItemTitles();
    },
    destroy() {
      close({ restoreFocus: false });
      sidebar.removeEventListener('click', handleSidebarClick);
      collapseToggle?.removeEventListener('click', handleCollapseClick);
      menuToggle?.removeEventListener('click', handleMenuClick);
      backdrop?.removeEventListener('click', handleBackdropClick);
      media?.removeEventListener?.('change', handleMediaChange);
    },
  };
}

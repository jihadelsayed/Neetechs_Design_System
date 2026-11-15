import type { NtDisposable } from '../types/index.js';
import { ntGetInlineArrowKeys } from './direction.js';
import { ntCreateDrawer, type NtDrawerController } from './drawer.js';
import { ntEnsureId, ntSetAriaControls } from './ids.js';
import { NT_KEYS } from './keyboard.js';

/* -------------------------------------------------------------------------- */
/* Navbar: site navigation with disclosure submenus                           */
/* -------------------------------------------------------------------------- */

/**
 * Site navigation uses the WAI-ARIA *disclosure navigation* pattern, not
 * `role="menu"`: top-level entries stay ordinary links/buttons in the tab
 * order, and each submenu is a panel of links revealed by a button with
 * `aria-expanded`. Routing stays with the application — the controller never
 * intercepts link navigation.
 */
export interface NtNavbarOptions {
  /** The `<nav class="nt-navbar">` element (or any container of triggers). */
  root: HTMLElement;
  /** Buttons that toggle a submenu panel. */
  triggerSelector?: string;
  /** Top-level focusable entries for inline arrow-key movement. Empty string disables it. */
  topLevelSelector?: string;
  /** Focusable entries inside an open panel. */
  panelItemSelector?: string;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  /** Close the open panel when keyboard focus leaves the navbar. */
  closeOnFocusOut?: boolean;
  /** Close the open panel after a link inside it is activated. */
  closeOnNavigate?: boolean;
  onOpen?: (trigger: HTMLElement, panel: HTMLElement) => void;
  onClose?: (trigger: HTMLElement, panel: HTMLElement) => void;
}

export interface NtNavbarController extends NtDisposable {
  readonly root: HTMLElement;
  /** The trigger whose panel is open, or `null`. */
  readonly openTrigger: HTMLElement | null;
  open(trigger: HTMLElement): void;
  close(options?: { restoreFocus?: boolean }): void;
  /** Re-scan triggers after the application re-renders navigation items. */
  refresh(): void;
}

const DEFAULT_TRIGGER_SELECTOR = '.nt-navbar__trigger, [data-nt-nav-trigger]';
const DEFAULT_TOP_LEVEL_SELECTOR = '.nt-navbar__link, .nt-navbar__trigger, [data-nt-nav-trigger]';
const DEFAULT_PANEL_ITEM_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isUsable(element: HTMLElement): boolean {
  return !element.hasAttribute('disabled')
    && element.getAttribute('aria-disabled') !== 'true'
    && !element.closest('[hidden]');
}

export function ntCreateNavbar(options: NtNavbarOptions): NtNavbarController {
  const {
    root,
    triggerSelector = DEFAULT_TRIGGER_SELECTOR,
    topLevelSelector = DEFAULT_TOP_LEVEL_SELECTOR,
    panelItemSelector = DEFAULT_PANEL_ITEM_SELECTOR,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    closeOnFocusOut = true,
    closeOnNavigate = true,
    onOpen,
    onClose,
  } = options;

  const doc = root.ownerDocument;
  const panels = new Map<HTMLElement, HTMLElement>();
  let openTrigger: HTMLElement | null = null;

  function panelFor(trigger: HTMLElement): HTMLElement | null {
    const controls = trigger.getAttribute('aria-controls');
    if (controls) {
      const byId = doc.getElementById(controls);
      if (byId) return byId;
    }
    const sibling = trigger.nextElementSibling;
    return sibling instanceof HTMLElement && sibling.classList.contains('nt-navbar__panel')
      ? sibling
      : null;
  }

  function sync(trigger: HTMLElement, panel: HTMLElement, expanded: boolean): void {
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.dataset.state = expanded ? 'open' : 'closed';
    trigger.closest('.nt-navbar__item')?.toggleAttribute('data-open', expanded);
    if (expanded) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
  }

  function refresh(): void {
    for (const trigger of root.querySelectorAll<HTMLElement>(triggerSelector)) {
      if (panels.has(trigger)) continue;
      const panel = panelFor(trigger);
      if (!panel) continue;
      ntSetAriaControls(trigger, panel, 'nt-navbar-panel');
      panels.set(trigger, panel);
      sync(trigger, panel, false);
    }
    for (const [trigger] of panels) {
      if (!root.contains(trigger)) panels.delete(trigger);
    }
  }

  function close(closeOptions: { restoreFocus?: boolean } = {}): void {
    if (!openTrigger) return;
    const trigger = openTrigger;
    const panel = panels.get(trigger);
    openTrigger = null;
    if (!panel) return;
    sync(trigger, panel, false);
    onClose?.(trigger, panel);
    if (closeOptions.restoreFocus) trigger.focus({ preventScroll: true });
  }

  function open(trigger: HTMLElement): void {
    const panel = panels.get(trigger);
    if (!panel || !isUsable(trigger)) return;
    if (openTrigger === trigger) return;
    close();
    openTrigger = trigger;
    sync(trigger, panel, true);
    onOpen?.(trigger, panel);
  }

  function panelItems(panel: HTMLElement): HTMLElement[] {
    return Array.from(panel.querySelectorAll<HTMLElement>(panelItemSelector)).filter(isUsable);
  }

  function topLevelItems(): HTMLElement[] {
    if (!topLevelSelector) return [];
    const inPanel = (element: HTMLElement) =>
      Array.from(panels.values()).some((panel) => panel.contains(element));
    return Array.from(root.querySelectorAll<HTMLElement>(topLevelSelector)).filter(
      (element) => isUsable(element) && !inPanel(element),
    );
  }

  function moveFocus(items: HTMLElement[], current: HTMLElement, key: string, previous: string, next: string): boolean {
    const index = items.indexOf(current);
    if (items.length === 0) return false;
    let target: HTMLElement | undefined;
    if (key === NT_KEYS.home) target = items[0];
    else if (key === NT_KEYS.end) target = items[items.length - 1];
    else if (key === next) target = items[(index + 1) % items.length];
    else if (key === previous) target = items[(index - 1 + items.length) % items.length];
    if (!target) return false;
    target.focus();
    return true;
  }

  const handleClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const trigger = target.closest<HTMLElement>(triggerSelector);
    if (trigger && panels.has(trigger) && root.contains(trigger)) {
      if (openTrigger === trigger) close();
      else open(trigger);
      return;
    }

    if (closeOnNavigate && openTrigger && target.closest('a[href]')) {
      const panel = panels.get(openTrigger);
      if (panel?.contains(target)) close();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === NT_KEYS.escape && closeOnEscape && openTrigger) {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }

    const openPanel = openTrigger ? panels.get(openTrigger) ?? null : null;

    // Inside an open panel: vertical roving between its links.
    if (openPanel?.contains(target)) {
      if (moveFocus(panelItems(openPanel), target, event.key, NT_KEYS.arrowUp, NT_KEYS.arrowDown)) {
        event.preventDefault();
      }
      return;
    }

    const trigger = target.closest<HTMLElement>(triggerSelector);
    if (trigger && panels.has(trigger) && event.key === NT_KEYS.arrowDown) {
      event.preventDefault();
      open(trigger);
      panelItems(panels.get(trigger) as HTMLElement)[0]?.focus();
      return;
    }

    // Top level: direction-aware inline movement (RTL swaps Left/Right).
    const { previous, next } = ntGetInlineArrowKeys(root);
    if (topLevelItems().includes(target)
      && moveFocus(topLevelItems(), target, event.key, previous, next)) {
      event.preventDefault();
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!closeOnOutsideClick || !openTrigger) return;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(root) || (event.target instanceof Node && root.contains(event.target))) return;
    close();
  };

  const handleFocusOut = (event: FocusEvent) => {
    if (!closeOnFocusOut || !openTrigger) return;
    const next = event.relatedTarget;
    if (next instanceof Node && root.contains(next)) return;
    // Focus left the page/window entirely (relatedTarget null): keep the panel
    // so returning to the tab does not lose context; pointer/escape still close.
    if (next === null) return;
    close();
  };

  refresh();
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeyDown);
  root.addEventListener('focusout', handleFocusOut);
  doc.addEventListener('pointerdown', handlePointerDown, true);

  return {
    root,
    get openTrigger() {
      return openTrigger;
    },
    open,
    close,
    refresh,
    destroy() {
      close();
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeyDown);
      root.removeEventListener('focusout', handleFocusOut);
      doc.removeEventListener('pointerdown', handlePointerDown, true);
      panels.clear();
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Account dropdown                                                           */
/* -------------------------------------------------------------------------- */

export interface NtAccountMenuOptions {
  /** The account button (`.nt-header__account`). */
  trigger: HTMLElement;
  /** The panel (`.nt-dropdown__content.nt-profile-menu`). Must share a parent with the trigger. */
  panel: HTMLElement;
  closeOnNavigate?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NtAccountMenuController extends NtDisposable {
  readonly isOpen: boolean;
  open(): void;
  close(options?: { restoreFocus?: boolean }): void;
  toggle(): void;
}

/**
 * Account dropdown as a disclosure: the panel may hold identity text
 * (name, email, plan) plus links and buttons, which `role="menu"` cannot
 * contain. Escape closes and returns focus to the trigger, outside clicks
 * close, Arrow Up/Down/Home/End move between the panel's actions, and focus
 * leaving the dropdown closes it. Sign-out and routing stay with the app.
 */
export function ntCreateAccountMenu(options: NtAccountMenuOptions): NtAccountMenuController {
  const { trigger, panel, closeOnNavigate = true, onOpen, onClose } = options;
  const root = trigger.parentElement;
  if (!root || !root.contains(panel)) {
    throw new Error('ntCreateAccountMenu: trigger and panel must share a parent element.');
  }
  ntSetAriaControls(trigger, panel, 'nt-account-menu');
  const triggerId = ntEnsureId(trigger, 'nt-account-trigger');
  const escapedId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(triggerId)
    : triggerId;

  const navbar = ntCreateNavbar({
    root,
    triggerSelector: `#${escapedId}`,
    topLevelSelector: '',
    closeOnNavigate,
    ...(onOpen ? { onOpen: () => onOpen() } : {}),
    ...(onClose ? { onClose: () => onClose() } : {}),
  });

  return {
    get isOpen() {
      return navbar.openTrigger !== null;
    },
    open: () => navbar.open(trigger),
    close: (closeOptions) => navbar.close(closeOptions),
    toggle: () => (navbar.openTrigger ? navbar.close() : navbar.open(trigger)),
    destroy: () => navbar.destroy(),
  };
}

/* -------------------------------------------------------------------------- */
/* Mobile navigation drawer                                                   */
/* -------------------------------------------------------------------------- */

export interface NtMobileNavOptions {
  /** The menu button in the header (`.nt-header__mobile-trigger`). */
  trigger: HTMLElement;
  /** The `.nt-mobile-nav` element. */
  nav: HTMLElement;
  /** Optional `.nt-mobile-nav__overlay` backdrop. */
  backdrop?: HTMLElement | null;
  /** Optional close button(s) inside the drawer. */
  closeSelector?: string;
  /** Close after a link inside the drawer is activated. Default `true`. */
  closeOnNavigate?: boolean;
  /**
   * When this media query stops matching (for example the viewport grows to
   * desktop), an open drawer closes so no stale modal state remains.
   * Default mirrors the shell breakpoint. Pass `null` to disable.
   */
  mobileQuery?: string | null;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NtMobileNavController extends NtDisposable {
  readonly drawer: NtDrawerController;
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}

/**
 * Modal navigation drawer for phones/tablets built on `ntCreateDrawer`:
 * focus trap, Escape, outside click, scroll lock, background inerting, and
 * focus restoration to the trigger come from the shared drawer foundation.
 */
export function ntCreateMobileNav(options: NtMobileNavOptions): NtMobileNavController {
  const {
    trigger,
    nav,
    backdrop = null,
    closeSelector = '.nt-mobile-nav__close, [data-nt-mobile-nav-close]',
    closeOnNavigate = true,
    mobileQuery = '(max-width: 64rem)',
    onOpen,
    onClose,
  } = options;

  if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
    nav.setAttribute('aria-label', trigger.getAttribute('aria-label') ?? 'Navigation');
  }

  const drawer = ntCreateDrawer({
    trigger,
    drawer: nav,
    backdrop,
    modal: true,
    role: 'dialog',
    placement: 'inline-start',
    closeOnEscape: true,
    closeOnOutsideClick: true,
    lockScroll: true,
    restoreFocus: true,
    ...(onOpen ? { onOpen } : {}),
    ...(onClose ? { onClose } : {}),
  });

  const handleNavClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest(closeSelector) || (closeOnNavigate && target.closest('a[href]'))) {
      drawer.close();
    }
  };
  const handleBackdropClick = () => drawer.close();

  const win = nav.ownerDocument.defaultView;
  const media = mobileQuery && win && typeof win.matchMedia === 'function'
    ? win.matchMedia(mobileQuery)
    : null;
  const handleMediaChange = () => {
    if (media && !media.matches && drawer.isOpen) drawer.close();
  };

  // ntCreateDrawer already toggles on trigger click and syncs aria-expanded.
  nav.addEventListener('click', handleNavClick);
  backdrop?.addEventListener('click', handleBackdropClick);
  media?.addEventListener?.('change', handleMediaChange);

  return {
    drawer,
    get isOpen() {
      return drawer.isOpen;
    },
    open: () => drawer.open(),
    close: () => drawer.close(),
    toggle: () => drawer.toggle(),
    destroy() {
      nav.removeEventListener('click', handleNavClick);
      backdrop?.removeEventListener('click', handleBackdropClick);
      media?.removeEventListener?.('change', handleMediaChange);
      drawer.destroy();
    },
  };
}

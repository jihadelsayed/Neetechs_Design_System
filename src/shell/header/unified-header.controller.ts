import { ntCreateAccountMenu, ntCreateMobileNav, ntCreateNavbar, type NtAccountMenuController, type NtMobileNavController, type NtNavbarController } from '../../behaviors/navigation.js';
import { ntRenderHeader } from './unified-header.js';
import type { NtHeaderConfig, NtHeaderController, NtHeaderMountOptions } from './unified-header.types.js';

const mounted = new WeakSet<HTMLElement>();

/** Mount into a dedicated, connected host containing only the header markup. */
export function ntMountHeader(root: HTMLElement, config: NtHeaderConfig, options: NtHeaderMountOptions = {}): NtHeaderController {
  if (!root.isConnected) throw new Error('ntMountHeader: host must be connected.');
  if (mounted.has(root)) throw new Error('ntMountHeader: host already mounted.');
  const doc = root.ownerDocument;
  const id = config.id;
  let markup = ntRenderHeader(config);
  let destroyed = false;
  let navbar: NtNavbarController | undefined;
  let mobile: NtMobileNavController | undefined;
  const menus: NtAccountMenuController[] = [];
  const breakpoint = doc.defaultView?.matchMedia?.('(max-width: 64rem)');

  function closeDisclosures(): void {
    navbar?.close();
    for (const menu of menus) menu.close();
  }

  function closeMenus(): void {
    closeDisclosures();
    mobile?.close();
  }

  function disposeBehaviors(): void {
    closeMenus();
    mobile?.destroy();
    mobile = undefined;
    for (const menu of menus.splice(0)) menu.destroy();
    navbar?.destroy();
    navbar = undefined;
  }

  function find(selector: string): HTMLElement {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error('ntMountHeader: missing required element: ' + selector);
    return element;
  }

  // Keep anchored panels within the viewport without changing logical alignment.
  // The physical correction is derived from the actual bounding rect in both directions.
  function fitPanel(panel: HTMLElement): void {
    panel.style.removeProperty('--nt-header-panel-shift');
    panel.style.removeProperty('--nt-header-panel-max-height');
    delete panel.dataset.ntHeaderPanelSide;
    // Use the untransformed containing block and computed anchor offset so
    // entry animations do not distort available vertical space.
    const parent = panel.offsetParent;
    const view = doc.defaultView;
    const height = doc.documentElement.clientHeight;
    if (parent && view && height) {
      const top = Number.parseFloat(view.getComputedStyle(panel).top);
      if (Number.isFinite(top)) {
        const anchorTop = parent.getBoundingClientRect().top + parent.clientTop;
        const gap = Math.max(0, top - parent.clientHeight);
        const below = Math.max(0, height - anchorTop - top - 8);
        const above = Math.max(0, anchorTop - gap - 8);
        const openAbove = panel.offsetHeight > below && above > below;
        if (openAbove) panel.dataset.ntHeaderPanelSide = 'top';
        panel.style.setProperty('--nt-header-panel-max-height', (openAbove ? above : below) + 'px');
      }
    }
    const width = doc.documentElement.clientWidth;
    const rect = panel.getBoundingClientRect();
    if (!width || !rect.width) return;
    const shift = rect.left < 0 ? -rect.left : rect.right > width ? width - rect.right : 0;
    if (shift) panel.style.setProperty('--nt-header-panel-shift', shift + 'px');
  }

  const onResize = (): void => {
    for (const panel of root.querySelectorAll<HTMLElement>('.nt-navbar__panel:not([hidden]), .nt-dropdown__content:not([hidden])')) fitPanel(panel);
  };

  const onScroll = (event: Event): void => {
    // Scrolling within a disclosure must not reset its own height or position.
    if (event.target instanceof Node && root.contains(event.target)) return;
    onResize();
  };

  function attach(): void {
    navbar = ntCreateNavbar({ root: find('.nt-navbar'), onOpen: (_trigger, panel) => {
      fitPanel(panel);
      for (const menu of menus) menu.close();
      mobile?.close();
    } });
    for (const trigger of root.querySelectorAll<HTMLElement>('[data-nt-header-disclosure]')) {
      const panel = trigger.nextElementSibling as HTMLElement | null;
      if (!panel || panel.id !== trigger.getAttribute('aria-controls')) throw new Error('ntMountHeader: invalid disclosure.');
      const menu: NtAccountMenuController = ntCreateAccountMenu({ trigger, panel, onOpen: () => {
        fitPanel(panel);
        navbar?.close();
        mobile?.close();
        for (const other of menus) if (other !== menu) other.close();
      } });
      menus.push(menu);
    }
    mobile = ntCreateMobileNav({ trigger: find('#' + id + '-mobile-trigger'), nav: find('#' + id + '-mobile'), backdrop: find('#' + id + '-backdrop'), onOpen: closeDisclosures });
  }

  function prepare(html: string): HTMLTemplateElement {
    const template = doc.createElement('template');
    template.innerHTML = html;
    // getElementById only returns the first match, so existing SSR markup can
    // hide a second matching ID outside the host. Check all external IDs.
    const occupied = new Set<string>();
    for (const existing of doc.querySelectorAll('[id]')) {
      if (existing === root || !root.contains(existing)) occupied.add(existing.id);
    }
    for (const element of template.content.querySelectorAll('[id]')) {
      if (occupied.has(element.id)) throw new Error('ntMountHeader: duplicate document ID: ' + element.id);
      occupied.add(element.id);
    }
    return template;
  }

  function install(template: HTMLTemplateElement): void {
    const nodes = Array.from(template.content.childNodes);
    const current = Array.from(root.childNodes);
    if (current.length !== nodes.length || current.some((node, i) => !node.isEqualNode(nodes[i]!))) root.replaceChildren(template.content);
    attach();
  }

  function recoverAvatar(img: HTMLImageElement): void {
    const fallback = img.dataset.ntHeaderAvatarFallback;
    img.removeAttribute('data-nt-header-avatar-fallback');
    if (fallback && img.getAttribute('src') !== fallback) img.src = fallback;
    else img.remove();
  }

  function checkAvatars(): void {
    for (const img of root.querySelectorAll<HTMLImageElement>('img.nt-avatar__image')) {
      if (img.complete && img.naturalWidth === 0) recoverAvatar(img);
    }
  }

  const onError = (event: Event): void => {
    const img = event.target as HTMLImageElement | null;
    if (img?.tagName === 'IMG' && img.classList.contains('nt-avatar__image') && root.contains(img)) recoverAvatar(img);
  };

  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = (event.target as Element | null)?.closest?.<HTMLElement>('[data-nt-header-item]');
    if (!target || !root.contains(target) || target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;
    const itemId = target.dataset.ntHeaderItem;
    if (itemId === undefined) return;
    const action = target.dataset.ntHeaderAction;
    if (action !== undefined) {
      if (!options.onAction) return;
      const panel = target.closest<HTMLElement>('.nt-dropdown__content, .nt-navbar__panel');
      const trigger = panel?.id ? Array.from(root.querySelectorAll<HTMLElement>('[aria-controls]')).find(el => el.getAttribute('aria-controls') === panel.id) : undefined;
      closeMenus();
      trigger?.focus({ preventScroll: true });
      options.onAction({ id: itemId, action });
      return;
    }
    if (target.tagName !== 'A' || !target.hasAttribute('data-nt-header-internal') || !options.onNavigate) return;
    const link = target as HTMLAnchorElement;
    const href = link.getAttribute('href');
    if (!href || link.hasAttribute('download') || (link.target && link.target.toLowerCase() !== '_self')) return;
    if (link.origin !== doc.location?.origin || !/^https?:$/.test(link.protocol)) return;
    if (options.onNavigate({ id: itemId, href })) { event.preventDefault(); closeMenus(); }
  };

  const onBreakpointChange = (): void => {
    const active = doc.activeElement;
    const inHeader = active !== null && root.contains(active);
    closeMenus();
    if (inHeader && active instanceof HTMLElement && active.getClientRects().length === 0) {
      const target = breakpoint?.matches ? root.querySelector<HTMLElement>('.nt-header__mobile-trigger') : root.querySelector<HTMLElement>('.nt-header__brand[href]');
      target?.focus({ preventScroll: true });
    }
  };

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    breakpoint?.removeEventListener('change', onBreakpointChange);
    doc.defaultView?.removeEventListener('resize', onResize);
    doc.removeEventListener('scroll', onScroll, true);
    root.removeEventListener('click', onClick);
    root.removeEventListener('error', onError, true);
    disposeBehaviors();
    root.replaceChildren();
    mounted.delete(root);
  }

  const initial = prepare(markup);
  mounted.add(root);
  breakpoint?.addEventListener('change', onBreakpointChange);
  doc.defaultView?.addEventListener('resize', onResize);
  doc.addEventListener('scroll', onScroll, true);
  root.addEventListener('click', onClick);
  root.addEventListener('error', onError, true);
  try { install(initial); checkAvatars(); } catch (error) { destroy(); throw error; }

  return {
    root,
    closeMenus,
    update(next) {
      if (destroyed) throw new Error('ntMountHeader: controller destroyed.');
      if (next.id !== id) throw new Error('ntMountHeader: instance ID cannot change.');
      const nextMarkup = ntRenderHeader(next);
      if (markup === nextMarkup) return;
      const template = prepare(nextMarkup);
      const active = doc.activeElement as HTMLElement | null;
      const hadFocus = Boolean(active && root.contains(active));
      const focusId = active?.id;
      const itemId = active?.dataset.ntHeaderItem;
      // A snapshot update closes disclosures and the mobile drawer. If focus
      // was inside one, return it to that surface's controlling button.
      const panel = active?.closest<HTMLElement>('.nt-dropdown__content, .nt-navbar__panel, [data-nt-header-mobile]');
      const ownerId = panel?.id ? Array.from(root.querySelectorAll<HTMLElement>('[aria-controls]')).find(el => el.getAttribute('aria-controls') === panel.id)?.id : undefined;
      disposeBehaviors();
      try {
        install(template);
        markup = nextMarkup;
        checkAvatars();
        if (hadFocus) {
          const usable = (el: HTMLElement): boolean => !el.closest('[hidden], [inert]') && !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true' && el.getClientRects().length > 0;
          const candidates = Array.from(root.querySelectorAll<HTMLElement>('[id], [data-nt-header-item]')).filter(usable);
          const owner = ownerId ? candidates.find(el => el.id === ownerId) : undefined;
          const candidate = candidates.find(el => (focusId && el.id === focusId) || (itemId !== undefined && el.dataset.ntHeaderItem === itemId));
          const mobileTrigger = root.querySelector<HTMLElement>('.nt-header__mobile-trigger');
          const fallback = mobileTrigger && usable(mobileTrigger) ? mobileTrigger : Array.from(root.querySelectorAll<HTMLElement>('.nt-header__brand[href], .nt-header__account')).find(usable);
          (owner ?? candidate ?? fallback)?.focus({ preventScroll: true });
        }
      } catch (error) { destroy(); throw error; }
    },
    destroy,
  };
}

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

  function attach(): void {
    navbar = ntCreateNavbar({ root: find('.nt-navbar'), onOpen: () => {
      for (const menu of menus) menu.close();
      mobile?.close();
    } });
    for (const trigger of root.querySelectorAll<HTMLElement>('[data-nt-header-disclosure]')) {
      const panel = trigger.nextElementSibling as HTMLElement | null;
      if (!panel || panel.id !== trigger.getAttribute('aria-controls')) throw new Error('ntMountHeader: invalid disclosure.');
      const menu: NtAccountMenuController = ntCreateAccountMenu({ trigger, panel, onOpen: () => {
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
    for (const element of template.content.querySelectorAll('[id]')) {
      const existing = doc.getElementById(element.id);
      if (existing && (existing === root || !root.contains(existing))) throw new Error('ntMountHeader: duplicate document ID: ' + element.id);
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

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    root.removeEventListener('click', onClick);
    root.removeEventListener('error', onError, true);
    disposeBehaviors();
    root.replaceChildren();
    mounted.delete(root);
  }

  const initial = prepare(markup);
  mounted.add(root);
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
      disposeBehaviors();
      try {
        install(template);
        markup = nextMarkup;
        checkAvatars();
        if (hadFocus) {
          const candidate = Array.from(root.querySelectorAll<HTMLElement>('[id], [data-nt-header-item]')).find(el => ((focusId && el.id === focusId) || (itemId !== undefined && el.dataset.ntHeaderItem === itemId)) && !el.closest('[hidden]') && !el.hasAttribute('disabled') && el.getClientRects().length > 0);
          const fallback = Array.from(root.querySelectorAll<HTMLElement>('.nt-header__brand[href], .nt-header__mobile-trigger, .nt-header__account')).find(el => el.getClientRects().length > 0);
          (candidate ?? fallback)?.focus({ preventScroll: true });
        }
      } catch (error) { destroy(); throw error; }
    },
    destroy,
  };
}

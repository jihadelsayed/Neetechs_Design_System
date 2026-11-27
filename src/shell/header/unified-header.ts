import type { NtHeaderChoiceMenu, NtHeaderConfig, NtHeaderEntry, NtHeaderGroup, NtHeaderIdentity, NtHeaderNavItem } from './unified-header.types.js';
import { ntRenderHeaderIcon } from './unified-header.icons.js';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

/** Only HTTP(S) or ordinary relative URLs; no executable schemes or protocol-relative URLs. */
function safeUrl(value: string | undefined): string | null {
  if (!value || /[\u0000-\u0020\u007f\\]/u.test(value) || value.startsWith('//')) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    if (!/^https?:\/\//i.test(value)) return null;
    try { new URL(value); } catch { return null; }
  }
  return value;
}

function entry(item: NtHeaderEntry, css: string, descriptionClass?: string): string {
  const id = ` data-nt-header-item="${escapeHtml(item.id)}"`;
  const label = `${ntRenderHeaderIcon(item.icon)}<span class="nt-header__entry-label">${escapeHtml(item.label)}</span>` + (item.description && descriptionClass ? `<span class="${descriptionClass}">${escapeHtml(item.description)}</span>` : '');
  const selected = item.kind === 'link' && item.current ? ' aria-current="page"' : '';
  const href = item.kind === 'link' ? safeUrl(item.href) : null;
  if (item.disabled || (item.kind === 'link' && !href)) return `<button type="button" class="${css}"${id}${selected} disabled aria-disabled="true">${label}</button>`;
  if (item.kind === 'link') return `<a class="${css}"${id} href="${escapeHtml(href!)}"${item.internal ? ' data-nt-header-internal' : ''}${selected}>${label}</a>`;
  return `<button type="button" class="${css}${item.danger && css === 'nt-profile-menu__item' ? ' nt-profile-menu__item--danger' : ''}"${id} data-nt-header-action="${escapeHtml(item.action)}">${label}</button>`;
}

function desktopItem(item: NtHeaderNavItem, id: string): string {
  if (item.kind !== 'group') return `<li class="nt-navbar__item">${entry(item, 'nt-navbar__link')}</li>`;
  return `<li class="nt-navbar__item${item.current || item.children.some(child => child.kind === 'link' && child.current) ? ' nt-navbar__item--active' : ''}"><button class="nt-navbar__trigger" type="button" id="${id}-trigger" aria-expanded="false" aria-controls="${id}-panel"${item.disabled ? ' disabled aria-disabled="true"' : ''}>${ntRenderHeaderIcon(item.icon)}<span class="nt-header__entry-label">${escapeHtml(item.label)}</span><span class="nt-navbar__chevron" aria-hidden="true"></span></button><div class="nt-navbar__panel" id="${id}-panel" hidden><ul class="nt-navbar__panel-list">${item.children.map((child) => `<li>${entry(child, 'nt-navbar__panel-link', 'nt-navbar__panel-description')}</li>`).join('')}</ul></div></li>`;
}

function mobileGroup(item: NtHeaderGroup): string {
  if (item.disabled) return '';
  return `<div class="nt-mobile-nav__section" role="group" aria-label="${escapeHtml(item.label)}"><div class="nt-mobile-nav__section-label" aria-hidden="true">${escapeHtml(item.label)}</div>${item.children.map((child) => entry(child, 'nt-mobile-nav__item')).join('')}</div>`;
}

function avatar(identity: NtHeaderIdentity | undefined): string {
  const name = identity?.name.trim() ?? '';
  const initials = name.split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('').toUpperCase() || '?';
  const fallback = safeUrl(identity?.fallbackAvatarUrl);
  const src = safeUrl(identity?.avatarUrl) ?? fallback;
  return `<span class="nt-avatar nt-avatar--sm" aria-hidden="true"><span class="nt-avatar__fallback">${escapeHtml(initials)}</span>${src ? `<img class="nt-avatar__image" src="${escapeHtml(src)}" alt="" decoding="async"${fallback && fallback !== src ? ` data-nt-header-avatar-fallback="${escapeHtml(fallback)}"` : ''}>` : ''}</span>`;
}

function disclosure(id: string, label: string, buttonContent: string, panelContent: string): string {
  return `<div class="nt-dropdown"><button type="button" class="nt-header__account" id="${id}-trigger" data-nt-header-disclosure aria-label="${escapeHtml(label)}" aria-expanded="false" aria-controls="${id}-panel">${buttonContent}<span class="nt-header__account-chevron" aria-hidden="true"></span></button><div class="nt-dropdown__content nt-profile-menu" id="${id}-panel" data-align="end" hidden>${panelContent}</div></div>`;
}

function choiceEntries(menu: NtHeaderChoiceMenu, css = 'nt-profile-menu__item'): string {
  return menu.choices.map((choice) => `<button type="button" class="${css}" data-nt-header-item="${escapeHtml(choice.id)}" data-nt-header-action="${escapeHtml(choice.action)}" aria-pressed="${choice.id === menu.selectedId}"${choice.disabled ? ' disabled aria-disabled="true"' : ''}>${escapeHtml(choice.label)}</button>`).join('');
}

/** Pure, deterministic SSR markup. Mounting behavior is a separate client step. */
export function ntRenderHeader(config: NtHeaderConfig): string {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(config.id)) throw new Error('ntRenderHeader: id must start with a letter and contain only letters, digits, underscores or hyphens.');
  const { id, brand, labels, account } = config;
  const logo = safeUrl(brand.logoUrl);
  const brandHref = safeUrl(brand.href);
  const brandName = escapeHtml(brand.label) + (brand.appName ? ` ${escapeHtml(brand.appName)}` : '');
  const logoMarkup = logo ? `<img class="nt-header__logo" src="${escapeHtml(logo)}" alt="">` : '';
  const brandText = `<span class="nt-header__title-group"><span class="nt-header__brand-name">${brandName}</span>${brand.subtitle ? `<span class="nt-header__subtitle">${escapeHtml(brand.subtitle)}</span>` : ''}</span>`;
  const brandContent = `${logoMarkup}${brandText}`;
  const brandMarkup = brandHref ? `<a class="nt-header__brand" data-nt-header-item="brand" href="${escapeHtml(brandHref)}"${brand.internal ? ' data-nt-header-internal' : ''}>${brandContent}</a>` : `<span class="nt-header__brand">${brandContent}</span>`;
  const navigation = config.slots?.workspace ? [config.slots.workspace, ...config.navigation] : config.navigation;
  const actionItems = [...(config.actions ?? []), ...(config.slots?.contextualActions ?? [])];
  const nav = navigation.map((item, index) => desktopItem(item, `${id}-nav-${index}`)).join('');
  const mobile = navigation.map((item) => item.kind === 'group' ? mobileGroup(item) : `<div class="nt-mobile-nav__section">${entry(item, 'nt-mobile-nav__item')}</div>`).join('');
  const identity = account?.state === 'authenticated' ? account.identity : undefined;
  const accountItems = account && account.state !== 'loading' ? account.items.map((item) => entry(item, 'nt-profile-menu__item')).join('') : '';
  const identityMarkup = identity ? `<div class="nt-profile-menu__header"><div class="nt-profile-menu__identity"><span class="nt-profile-menu__name">${escapeHtml(identity.name)}</span>${identity.email ? `<span class="nt-profile-menu__email">${escapeHtml(identity.email)}</span>` : ''}</div></div>` : '';
  const accountMarkup = !account ? '' : account.state === 'loading' ? `<span class="nt-skeleton nt-skeleton--button" role="status" aria-label="${escapeHtml(labels.accountLoading)}"></span>` : disclosure(`${id}-account`, identity ? `${labels.account}: ${identity.name}` : labels.account, `${identity ? avatar(identity) : ntRenderHeaderIcon('account')}<span class="nt-header__account-name">${escapeHtml(identity?.name ?? labels.account)}</span>`, `${identityMarkup}<div class="nt-profile-menu__section">${accountItems}</div>`);
  const choices = [ ['appearance', config.appearance], ['language', config.language] ] as const;
  const choiceMarkup = choices.map(([key, menu]) => menu ? disclosure(`${id}-${key}`, menu.label, `${ntRenderHeaderIcon(key)}<span class="nt-header__control-label">${escapeHtml(menu.label)}</span>`, `<div class="nt-profile-menu__section">${choiceEntries(menu)}</div>`) : '').join('');
  const notifications = config.notifications;
  const unread = notifications?.unreadCount;
  const badge = typeof unread === 'number' && Number.isSafeInteger(unread) && unread > 0
    ? `<span class="nt-header__notification-count"${notifications?.accessibleLabel ? ' aria-hidden="true"' : ''}>${unread > 99 ? '99+' : unread}</span>` : '';
  const notificationPanel = notifications ? (notifications.items.length
    ? notifications.items.map(item => entry(item, 'nt-profile-menu__item')).join('')
    : `<p class="nt-header__notification-empty">${escapeHtml(notifications.emptyLabel)}</p>`) : '';
  const notificationMarkup = notifications ? disclosure(`${id}-notifications`, notifications.accessibleLabel ?? notifications.label,
    `${ntRenderHeaderIcon('notifications')}<span class="nt-header__control-label">${escapeHtml(notifications.label)}</span>${badge}`, `<div class="nt-profile-menu__section">${notificationPanel}</div>`) : '';
  const mobileNotifications = notifications ? `<div class="nt-mobile-nav__section" role="group" aria-label="${escapeHtml(notifications.accessibleLabel ?? notifications.label)}"><div class="nt-mobile-nav__section-label" aria-hidden="true">${escapeHtml(notifications.label)}${badge}</div>${notifications.items.length ? notifications.items.map(item => entry(item, 'nt-mobile-nav__item')).join('') : notificationPanel}</div>` : '';
  const mobileAccount = account && account.state !== 'loading' ? `<div class="nt-mobile-nav__section" role="group" aria-label="${escapeHtml(labels.account)}"><div class="nt-mobile-nav__section-label">${escapeHtml(identity?.name ?? labels.account)}</div>${account.items.map(item => entry(item, 'nt-mobile-nav__item')).join('')}</div>` : '';
  const switcher = config.appSwitcher && !config.appSwitcher.disabled ? disclosure(`${id}-apps`, config.appSwitcher.label, `${ntRenderHeaderIcon('apps')}<span class="nt-header__control-label">${escapeHtml(config.appSwitcher.label)}</span>`, `<div class="nt-profile-menu__section">${config.appSwitcher.children.map((item) => entry(item, 'nt-profile-menu__item')).join('')}</div>`) : '';
  const actions = actionItems.map((item) => entry(item, 'nt-button nt-button--ghost nt-button--sm')).join('');
  const mobileChoices = choices.map(([, menu]) => menu ? `<div class="nt-mobile-nav__section" role="group" aria-label="${escapeHtml(menu.label)}"><div class="nt-mobile-nav__section-label" aria-hidden="true">${escapeHtml(menu.label)}</div>${choiceEntries(menu, 'nt-mobile-nav__item')}</div>` : '').join('');
  const mobileSwitcher = config.appSwitcher ? mobileGroup(config.appSwitcher) : '';
  const mobileActions = actionItems.length ? `<div class="nt-mobile-nav__section">${actionItems.map((item) => entry(item, 'nt-mobile-nav__item')).join('')}</div>` : '';
  const direction = config.direction === 'rtl' || config.direction === 'ltr' ? ` dir="${config.direction}"` : '';
  const presentation = config.presentation === 'sticky' ? ' nt-header--sticky' : config.presentation === 'embedded' ? ' nt-app-shell__header' : '';
  return `<header class="nt-header${presentation}" id="${id}"${direction} data-nt-header><div class="nt-header__left"><button class="nt-header__mobile-trigger nt-header__action" type="button" id="${id}-mobile-trigger" aria-label="${escapeHtml(labels.openNavigation)}" aria-expanded="false" aria-controls="${id}-mobile">${ntRenderHeaderIcon('menu')}</button>${brandMarkup}</div><div class="nt-header__nav"><nav class="nt-navbar" aria-label="${escapeHtml(labels.primaryNavigation)}"><ul class="nt-navbar__list">${nav}</ul></nav></div><div class="nt-header__right"><div class="nt-header__extras">${actions}${choiceMarkup}${switcher}${notificationMarkup}</div>${accountMarkup}</div></header><div class="nt-mobile-nav__overlay" id="${id}-backdrop" hidden></div><aside class="nt-mobile-nav nt-mobile-nav--drawer" id="${id}-mobile" data-nt-header-mobile${direction} aria-labelledby="${id}-mobile-title" hidden><div class="nt-mobile-nav__header"><div class="nt-mobile-nav__brand">${logoMarkup}<span class="nt-mobile-nav__title" id="${id}-mobile-title">${brandName}</span></div><button type="button" class="nt-mobile-nav__close" aria-label="${escapeHtml(labels.closeNavigation)}">${ntRenderHeaderIcon('close')}</button></div><nav class="nt-mobile-nav__body" aria-label="${escapeHtml(labels.mobileNavigation)}">${mobile}${mobileActions}${mobileChoices}${mobileSwitcher}${mobileNotifications}${mobileAccount}</nav></aside>`;
}

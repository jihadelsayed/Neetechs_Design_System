import type { NtDisposable, NtRovingFocusController } from '../types/index.js';
import { ntEnsureId } from './ids.js';
import { ntCreateRovingFocus, ntIsActivationKey } from './keyboard.js';

export interface NtTabsOptions {
  root: HTMLElement;
  tabList?: HTMLElement | null;
  tabSelector?: string;
  panelSelector?: string;
  orientation?: 'horizontal' | 'vertical';
  activation?: 'automatic' | 'manual';
  loopFocus?: boolean;
  onChange?: (index: number, tab: HTMLElement, panel: HTMLElement | null) => void;
}

export interface NtTabsController extends NtDisposable {
  readonly root: HTMLElement;
  readonly selectedIndex: number;
  select(index: number, focus?: boolean): void;
}

export function ntCreateTabs(options: NtTabsOptions): NtTabsController {
  const {
    root,
    tabList: providedTabList,
    tabSelector = '[role="tab"],.nt-tabs__tab,.nt-tabs__trigger',
    panelSelector = '[role="tabpanel"],.nt-tabs__panel',
    orientation = 'horizontal',
    activation = 'automatic',
    loopFocus = true,
    onChange,
  } = options;
  const tabList = providedTabList ?? root.querySelector<HTMLElement>('.nt-tabs__list') ?? root;
  const tabs = Array.from(root.querySelectorAll<HTMLElement>(tabSelector));
  const panels = Array.from(root.querySelectorAll<HTMLElement>(panelSelector));
  let selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
  );

  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-orientation', orientation);

  tabs.forEach((tab, index) => {
    const panel = panels[index] ?? null;
    tab.setAttribute('role', 'tab');
    const tabId = ntEnsureId(tab, 'nt-tab');
    if (panel) {
      const panelId = ntEnsureId(panel, 'nt-tabpanel');
      tab.setAttribute('aria-controls', panelId);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);
      panel.tabIndex = 0;
    }
  });

  function enabled(index: number): boolean {
    const tab = tabs[index];
    return Boolean(
      tab &&
        !tab.hasAttribute('disabled') &&
        tab.getAttribute('aria-disabled') !== 'true' &&
        tab.dataset.disabled !== 'true',
    );
  }

  function select(index: number, focus = false): void {
    if (!enabled(index)) return;
    selectedIndex = index;
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.dataset.state = selected ? 'active' : 'inactive';
    });
    panels.forEach((panel, panelIndex) => {
      const selected = panelIndex === index;
      panel.hidden = !selected;
      panel.dataset.state = selected ? 'active' : 'inactive';
    });
    const tab = tabs[index];
    if (focus) tab?.focus({ preventScroll: true });
    if (tab) onChange?.(index, tab, panels[index] ?? null);
  }

  const rovingFocus: NtRovingFocusController = ntCreateRovingFocus({
    root: tabList,
    itemSelector: tabSelector,
    orientation,
    loop: loopFocus,
    initialIndex: selectedIndex,
  });

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tab = target.closest<HTMLElement>(tabSelector);
    const index = tab ? tabs.indexOf(tab) : -1;
    if (index >= 0) select(index);
  };

  const handleFocusIn = (event: FocusEvent) => {
    if (activation !== 'automatic') return;
    const target = event.target;
    const index = target instanceof HTMLElement ? tabs.indexOf(target) : -1;
    if (index >= 0) select(index);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (activation !== 'manual' || !ntIsActivationKey(event)) return;
    const target = event.target;
    const index = target instanceof HTMLElement ? tabs.indexOf(target) : -1;
    if (index >= 0) {
      event.preventDefault();
      select(index);
    }
  };

  tabList.addEventListener('click', handleClick);
  tabList.addEventListener('focusin', handleFocusIn);
  tabList.addEventListener('keydown', handleKeyDown);
  select(selectedIndex);

  return {
    root,
    get selectedIndex() {
      return selectedIndex;
    },
    select,
    destroy() {
      tabList.removeEventListener('click', handleClick);
      tabList.removeEventListener('focusin', handleFocusIn);
      tabList.removeEventListener('keydown', handleKeyDown);
      rovingFocus.destroy();
    },
  };
}

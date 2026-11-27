// @vitest-environment jsdom
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ntRenderHeader, type NtHeaderConfig } from '@neetechs/ui';
import { NtGlobalHeader } from './nt-header';

const config: NtHeaderConfig = {
  id: 'react-header-test',
  brand: { label: 'Neetechs', href: '/', internal: true },
  navigation: [{ kind: 'link', id: 'tools', label: 'Tools', href: '/tools', internal: true }],
  labels: { primaryNavigation: 'Primary', mobileNavigation: 'Site', openNavigation: 'Open menu', closeNavigation: 'Close menu', account: 'Account', accountLoading: 'Checking account' },
  account: { state: 'authenticated', identity: { name: 'Example User' }, items: [{ kind: 'action', id: 'logout', label: 'Sign out', action: 'logout' }] },
};

function element(root: ParentNode, selector: string): HTMLElement {
  const node = root.querySelector<HTMLElement>(selector);
  if (!node) throw new Error('Missing element: ' + selector);
  return node;
}

afterEach(cleanup);

describe('React 18 shared header', () => {
  it('mounts under StrictMode and dispatches actions exactly once', () => {
    const onAction = vi.fn();
    const { container } = render(<StrictMode><NtGlobalHeader config={config} onAction={onAction} /></StrictMode>);
    expect(container.querySelectorAll('header').length).toBe(1);
    fireEvent.click(element(container, '#react-header-test-account-trigger'));
    expect(element(container, '#react-header-test-account-panel').hidden).toBe(false);
    fireEvent.click(element(container, '[data-nt-header-action="logout"]'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ id: 'logout', action: 'logout' });
    expect(element(container, '#react-header-test-account-panel').hidden).toBe(true);
  });

  it('uses current callbacks without remounting and preserves native modified clicks', () => {
    const first = vi.fn(() => true);
    const next = vi.fn(() => true);
    const { container, rerender } = render(<NtGlobalHeader config={config} onNavigate={first} />);
    const header = element(container, '#react-header-test');
    rerender(<NtGlobalHeader config={config} onNavigate={next} />);
    expect(element(container, '#react-header-test')).toBe(header);
    const link = element(container, '.nt-navbar [data-nt-header-item="tools"]');
    fireEvent.click(link);
    expect(first).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledExactlyOnceWith({ id: 'tools', href: '/tools' });
    // Prevent actual jsdom navigation without intercepting the controller.
    document.addEventListener('click', event => event.preventDefault(), { once: true });
    fireEvent.click(link, { ctrlKey: true });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not restore stale SSR HTML after a state update or unrelated rerender', () => {
    const { container, rerender } = render(<NtGlobalHeader config={config} />);
    const guest: NtHeaderConfig = {
      ...config,
      account: { state: 'guest', items: [{ kind: 'action', id: 'login', label: 'Sign in', action: 'login' }] },
    };
    rerender(<NtGlobalHeader config={guest} />);
    expect(container.textContent).not.toContain('Example User');
    const updated = element(container, '#react-header-test');
    rerender(<NtGlobalHeader config={{ ...guest }} onAction={vi.fn()} />);
    expect(element(container, '#react-header-test')).toBe(updated);
    expect(container.textContent).not.toContain('Example User');
    expect(container.querySelector('[data-nt-header-action="logout"]')).toBeNull();
  });

  it('remounts when the instance ID changes and releases the owned host on unmount', () => {
    const { container, rerender, unmount } = render(<NtGlobalHeader config={config} />);
    const oldHost = element(container, '#react-header-test').parentElement!;
    rerender(<NtGlobalHeader config={{ ...config, id: 'another-header' }} />);
    expect(oldHost.childElementCount).toBe(0);
    expect(container.querySelector('#react-header-test')).toBeNull();
    const currentHost = element(container, '#another-header').parentElement!;
    unmount();
    expect(currentHost.childElementCount).toBe(0);
  });

  it('hydrates matching server markup without replacing the header node', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    // The server adapter emits this host and the renderer's deterministic HTML.
    container.innerHTML = '<div style="display:contents">' + ntRenderHeader(config) + '</div>';
    const before = element(container, '#react-header-test');
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <NtGlobalHeader config={config} />, { onRecoverableError });
      });
      expect(element(container, '#react-header-test')).toBe(before);
      expect(onRecoverableError).not.toHaveBeenCalled();
      fireEvent.click(element(container, '#react-header-test-account-trigger'));
      expect(element(container, '#react-header-test-account-panel').hidden).toBe(false);
    } finally {
      if (root) act(() => root?.unmount());
      container.remove();
    }
  });
});

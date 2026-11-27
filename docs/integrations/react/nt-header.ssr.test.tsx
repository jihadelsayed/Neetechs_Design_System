// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { NtHeaderConfig } from '@neetechs/ui';
import { NtGlobalHeader } from './nt-header';

const config: NtHeaderConfig = {
  id: 'react-ssr-header',
  brand: { label: 'Neetechs', href: '/' },
  navigation: [{ kind: 'link', id: 'tools', label: 'Tools', href: '/tools' }],
  labels: { primaryNavigation: 'Primary', mobileNavigation: 'Site', openNavigation: 'Open', closeNavigation: 'Close', account: 'Account', accountLoading: 'Checking account' },
  account: { state: 'loading' },
};

describe('React header server rendering', () => {
  it('renders deterministic markup without a browser or guest identity flash', () => {
    expect(typeof window).toBe('undefined');
    const first = renderToString(<NtGlobalHeader config={config} />);
    const second = renderToString(<NtGlobalHeader config={config} />);
    expect(first).toBe(second);
    expect(first.match(/<header /g)).toHaveLength(1);
    expect(first).toContain('Checking account');
    expect(first).not.toContain('react-ssr-header-account-panel');
    expect(first).toContain('react-ssr-header-mobile');
  });
});

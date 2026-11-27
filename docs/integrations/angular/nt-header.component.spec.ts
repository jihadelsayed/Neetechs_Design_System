import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { NtHeaderActivation, NtHeaderConfig, NtHeaderNavigation } from '@neetechs/ui';
import { NtGlobalHeaderComponent } from './nt-header.component';

const config: NtHeaderConfig = {
  id: 'angular-header-test',
  brand: { label: 'Neetechs', href: '/', internal: true },
  navigation: [{ kind: 'link', id: 'tools', label: 'Tools', href: '/tools', internal: true }],
  labels: {
    primaryNavigation: 'Primary',
    mobileNavigation: 'Site',
    openNavigation: 'Open menu',
    closeNavigation: 'Close menu',
    account: 'Account',
    accountLoading: 'Checking account',
  },
  account: {
    state: 'authenticated',
    identity: { name: 'Example User' },
    items: [{ kind: 'action', id: 'logout', action: 'logout', label: 'Sign out' }],
  },
};

describe('NtGlobalHeaderComponent (Angular 20)', () => {
  let fixture: ComponentFixture<NtGlobalHeaderComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NtGlobalHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(NtGlobalHeaderComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('config', config);
  });

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function element(selector: string): HTMLElement {
    const result = host.querySelector<HTMLElement>(selector);
    if (!result) throw new Error('Missing element: ' + selector);
    return result;
  }

  it('renders one header and delegates account actions exactly once', async () => {
    const actions: NtHeaderActivation[] = [];
    fixture.componentInstance.headerAction.subscribe(value => actions.push(value));
    await render();
    expect(host.querySelectorAll('header').length).toBe(1);
    element('#angular-header-test-account-trigger').click();
    expect(element('#angular-header-test-account-panel').hidden).toBeFalse();
    element('[data-nt-header-action="logout"]').click();
    expect(actions).toEqual([{ id: 'logout', action: 'logout' }]);
    expect(element('#angular-header-test-account-panel').hidden).toBeTrue();
  });

  it('delegates same-origin navigation to the latest host callback', async () => {
    const first = jasmine.createSpy('first').and.returnValue(true);
    fixture.componentRef.setInput('navigate', first);
    await render();
    const received: NtHeaderNavigation[] = [];
    fixture.componentRef.setInput('navigate', (value: NtHeaderNavigation) => {
      received.push(value);
      return true;
    });
    await render();
    element('.nt-navbar [data-nt-header-item="tools"]').click();
    expect(first).not.toHaveBeenCalled();
    expect(received).toEqual([{ id: 'tools', href: '/tools' }]);
  });

  it('preserves unchanged markup and removes stale account identity', async () => {
    await render();
    const first = element('#angular-header-test');
    fixture.componentRef.setInput('config', { ...config });
    await render();
    expect(element('#angular-header-test')).toBe(first);
    fixture.componentRef.setInput('config', {
      ...config,
      account: { state: 'guest', items: [{ kind: 'action', id: 'login', action: 'login', label: 'Sign in' }] },
    } satisfies NtHeaderConfig);
    await render();
    expect(host.textContent).not.toContain('Example User');
    element('#angular-header-test-account-trigger').click();
    expect(element('[data-nt-header-action="login"]').textContent).toContain('Sign in');
    expect(host.querySelector('[data-nt-header-action="logout"]')).toBeNull();
  });

  it('destroys controller-owned DOM during component teardown', async () => {
    await render();
    const ownedRoot = element('#angular-header-test').parentElement!;
    fixture.destroy();
    expect(ownedRoot.childElementCount).toBe(0);
  });
});

import { expect, test } from '@playwright/test';

test('mobile drawer delegates sign-out exactly once and closes', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
  const trigger=page.locator('#fixture-header-mobile-trigger');
  const drawer=page.locator('#fixture-header-mobile');
  await trigger.click();
  await drawer.getByRole('button',{name:'Sign out'}).click();
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(()=>window.headerFixture.actions)).toEqual([{id:'logout',action:'logout'}]);
});

test('notification disclosure coordinates with account and mobile drawer', async ({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(()=>Boolean(window.headerFixture));
  await page.evaluate(()=>{
    const f=window.headerFixture;
    f.controller.update({...f.config,notifications:{label:'Notifications',unreadCount:2,emptyLabel:'No notifications',items:[{kind:'action',id:'open-notices',label:'Open notifications',action:'notices.open'}]}});
  });
  const notices=page.locator('#fixture-header-notifications-trigger');
  const account=page.locator('#fixture-header-account-trigger');
  await notices.click();
  await expect(notices).toHaveAttribute('aria-expanded','true');
  await account.click();
  await expect(notices).toHaveAttribute('aria-expanded','false');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#fixture-header-mobile-trigger').click();
  await page.locator('#fixture-header-mobile').getByRole('button',{name:'Open notifications'}).click();
  await expect(page.locator('#fixture-header-mobile')).toBeHidden();
  expect(await page.evaluate(()=>window.headerFixture.actions)).toEqual([{id:'open-notices',action:'notices.open'}]);
});

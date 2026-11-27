import { expect, test } from '@playwright/test';

async function load(page, width = 1280, dir = 'ltr') {
  await page.setViewportSize({width,height:800});
  await page.goto('/tests/pages/unified-header.html');
  await page.waitForFunction(() => Boolean(window.headerFixture));
  await page.evaluate(dir => {
    const f = window.headerFixture;
    f.controller.update({...f.config,direction:dir,slots:{
      workspace:{kind:'group',id:'workspace',label:'Workspace',icon:'workspace',children:[{kind:'link',id:'current',label:'Current workspace',href:'/workspace',current:true,internal:true}]},
      contextualActions:[{kind:'action',id:'notify',label:'Notifications',action:'notify',icon:'notifications'}]
    }});
  },dir);
}

for (const dir of ['ltr','rtl']) {
  test('panels stay within viewport and above page content ('+dir+')',async ({page})=>{
    await load(page,1025,dir);
    const trigger=page.locator('#fixture-header-nav-0-trigger');
    await trigger.click();
    const panel=page.locator('#fixture-header-nav-0-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('z-index','400');
    const box=await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x+box.width).toBeLessThanOrEqual(1026);
  });
}

test('workspace and contextual action remain available on mobile',async ({page})=>{
  await load(page,390);
  await page.locator('#fixture-header-mobile-trigger').click();
  const drawer=page.locator('#fixture-header-mobile');
  await expect(drawer.getByRole('link',{name:'Current workspace'})).toBeVisible();
  await drawer.getByRole('button',{name:'Notifications'}).click();
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(()=>window.headerFixture.actions)).toEqual([{id:'notify',action:'notify'}]);
});

test('decorative icons preserve button accessible names; reduced motion disables animation',async ({page})=>{
  await load(page);
  await page.evaluate(()=>document.documentElement.dataset.ntMotion='reduced');
  const trigger=page.locator('#fixture-header-nav-0-trigger');
  await expect(trigger).toHaveAccessibleName('Workspace');
  await expect(trigger.locator('svg')).toHaveAttribute('aria-hidden','true');
  await trigger.click();
  await expect(page.locator('#fixture-header-nav-0-panel')).toHaveCSS('animation-name','none');
});

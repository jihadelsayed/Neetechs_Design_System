import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ntRenderHeaderIcon } from '../../dist/shell/header/unified-header.icons.js';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';
const config = { id:'extension-header', brand:{label:'Neetechs',href:'/'}, labels:{primaryNavigation:'Primary',mobileNavigation:'Site',openNavigation:'Open',closeNavigation:'Close',account:'Account',accountLoading:'Loading'}, navigation:[] };

test('named decorative icon registry rejects unknown and prototype keys', () => {
  for (const key of ['menu','close','appearance','language','apps','notifications','account','settings','workspace','tools','billing','logout']) {
    assert.match(ntRenderHeaderIcon(key), /<svg .*aria-hidden="true" focusable="false">/);
  }
  for (const key of ['__proto__','constructor','toString','<svg onload=alert(1)>',undefined]) assert.equal(ntRenderHeaderIcon(key), '');
});

test('structured workspace and contextual action appear in both responsive variants', () => {
  const html = ntRenderHeader({...config,slots:{workspace:{kind:'group',id:'workspace',label:'Workspace',icon:'workspace',children:[{kind:'link',id:'current-workspace',label:'Current workspace',href:'/workspaces/1',current:true}]},contextualActions:[{kind:'action',id:'notify',label:'Notifications',action:'notify',icon:'notifications'}]}});
  assert.equal((html.match(/data-nt-header-item="current-workspace"/g)||[]).length,2);
  assert.equal((html.match(/data-nt-header-action="notify"/g)||[]).length,2);
  assert.match(html,/nt-navbar__item--active/);
  assert.equal((html.match(/aria-current="page"/g)||[]).length,2);
});

test('slot inputs are escaped and unsafe link destinations are disabled', () => {
  const html = ntRenderHeader({...config,slots:{contextualActions:[{kind:'link',id:'unsafe',label:'<img src=x>',href:'javascript:alert(1)',icon:'<svg onload=x>'}]}});
  assert.doesNotMatch(html,/<img src=x>|onload=x|href="javascript:/);
  assert.equal((html.match(/disabled aria-disabled="true"/g)||[]).length,2);
});

test('optional slots do not introduce empty navigation items', () => {
  const html = ntRenderHeader({...config,slots:{}});
  assert.equal(html,ntRenderHeader(config));
});

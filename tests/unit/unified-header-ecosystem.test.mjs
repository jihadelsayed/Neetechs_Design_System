import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ntCreateEcosystemNavigation, NT_ECOSYSTEM_LINKS } from '../../dist/shell/header/unified-header.ecosystem.js';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';

const labels = { products:'Products', tools:'Tools', company:'Company', billing:'Billing', apps:'Applications' };
const apps = [{id:'apply',label:'Apply',href:'https://apply.neetechs.com/'},{id:'billing',label:'Billing',href:'https://billing.neetechs.com/'}];

test('baseline preserves existing links, without billing or an empty switcher', () => {
  const result = ntCreateEcosystemNavigation({labels});
  assert.deepEqual(result.navigation.map(x=>x.href), [NT_ECOSYSTEM_LINKS.tools,NT_ECOSYSTEM_LINKS.products,NT_ECOSYSTEM_LINKS.company]);
  assert.equal(result.appSwitcher,undefined);
});
test('opt-in billing and catalog group use independent stable entry ids', () => {
  const result = ntCreateEcosystemNavigation({labels,apps,currentAppId:'apply',includeBilling:true,productDropdown:true});
  const group = result.navigation[1];
  assert.equal(group.kind,'group');
  assert.equal(group.children[0].href,NT_ECOSYSTEM_LINKS.products);
  assert.equal(group.children[1].current,true);
  assert.equal(result.navigation[3].href,NT_ECOSYSTEM_LINKS.billing);
  assert.equal(result.appSwitcher.children[0].current,true);
  assert.notEqual(group.children[1].id,result.appSwitcher.children[0].id);
});
test('invalid, duplicate, blank and unsafe catalog entries are ignored', () => {
  const result = ntCreateEcosystemNavigation({labels,apps:[...apps,apps[0],{id:'unsafe',label:'Bad',href:'javascript:alert(1)'},{id:'creds',label:'Bad',href:'https://user:pass@example.com'},{id:'blank',label:' ',href:'https://example.com'},{id:'bad id',label:'Bad',href:'https://example.com'}],productDropdown:true});
  assert.equal(result.appSwitcher.children.length,2);
  assert.equal(result.navigation[1].children.length,3);
});
test('labels are app-localized and missing optional labels hide controls', () => {
  const result = ntCreateEcosystemNavigation({labels:{products:'Produkter',tools:'Verktyg',company:'Företag'},apps,includeBilling:true});
  assert.equal(result.navigation.length,3);
  assert.equal(result.navigation[0].label,'Verktyg');
  assert.equal(result.appSwitcher,undefined);
});
test('shared renderer includes catalog in desktop and mobile without raw html', () => {
  const nav = ntCreateEcosystemNavigation({labels,apps:[{id:'apply',label:'<Apply>',href:'https://apply.neetechs.com/'}],productDropdown:true});
  const html=ntRenderHeader({id:'global',brand:{label:'Neetechs',href:'/'},labels:{primaryNavigation:'Primary',mobileNavigation:'Mobile',openNavigation:'Open',closeNavigation:'Close',account:'Account',accountLoading:'Loading'},...nav});
  assert.doesNotMatch(html,/<Apply>/);
  assert.match(html,/&lt;Apply&gt;/);
  for (const id of ['ecosystem-product-apply','ecosystem-switch-apply']) assert.equal((html.match(new RegExp('data-nt-header-item="'+id+'"','g'))||[]).length,2);
});

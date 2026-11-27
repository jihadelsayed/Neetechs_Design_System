import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ntCreateHeaderAccount } from '../../dist/shell/header/unified-header.account.js';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';

const options = {
  labels: {account:'Account',login:'Login',signup:'Sign Up',myAccount:'My Account',myProducts:'My Products',settings:'Settings'},
  destinations: {
    login:{kind:'action',action:'login'},signup:{kind:'action',action:'signup'},
    myAccount:{kind:'link',href:'https://myaccount.neetechs.com/'},
    myProducts:{kind:'link',href:'https://myaccount.neetechs.com/sv/my/products'},
    settings:{kind:'link',href:'/sv/settings/profile-privacy',internal:true},
  },
  fallbackAvatarUrl:'/assets/avatar.png',
  authenticatedItems:[{kind:'action',id:'logout',label:'Logout',action:'logout',danger:true}],
};
const config = {id:'account-header',brand:{label:'Neetechs',href:'/'},navigation:[],labels:{primaryNavigation:'Primary',mobileNavigation:'Mobile',openNavigation:'Open',closeNavigation:'Close',account:'Account',accountLoading:'Loading account'}};
const render = account => ntRenderHeader({...config,account});

test('loading excludes identity and all actions', () => {
  const account=ntCreateHeaderAccount({state:'loading'},options);
  assert.deepEqual(account,{state:'loading'});
  const html=render(account);
  assert.match(html,/role="status" aria-label="Loading account"/);
  assert.doesNotMatch(html,/account-login|account-profile|data-nt-header-action="logout"/);
});
test('guest includes only guest destinations; stale profile never leaks', () => {
  const auth=ntCreateHeaderAccount({state:'authenticated',identity:{displayName:'Private Name'}},options);
  const guest=ntCreateHeaderAccount({state:'guest'},options);
  assert.equal(auth.identity.name,'Private Name');
  assert.deepEqual(guest.items.map(x=>x.id),['account-login','account-signup']);
  assert.doesNotMatch(render(guest),/Private Name|account-settings|account-profile|data-nt-header-action="logout"/);
});
test('authenticated links retain exact localized href and internal routing', () => {
  const account=ntCreateHeaderAccount({state:'authenticated',identity:{displayName:'  Test User ',avatarUrl:' /avatar.png ',email:'private@example.com'}},options);
  assert.deepEqual(account.identity,{name:'Test User',avatarUrl:'/avatar.png',fallbackAvatarUrl:'/assets/avatar.png'});
  assert.deepEqual(account.items.map(x=>x.id),['account-profile','account-products','account-settings','logout']);
  assert.equal(account.items[2].href,'/sv/settings/profile-privacy');
  assert.equal(account.items[2].internal,true);
  const html=render(account);
  assert.match(html,/data-nt-header-avatar-fallback="\/assets\/avatar.png"/);
  assert.match(html,/href="\/sv\/settings\/profile-privacy" data-nt-header-internal/);
  assert.doesNotMatch(html,/private@example.com|account-login/);
});
test('identity fallback handles blank and partial names without using email by default', () => {
  const build=identity=>ntCreateHeaderAccount({state:'authenticated',identity},options).identity;
  assert.equal(build({displayName:' ',firstName:'  Ada ',lastName:' Lovelace '}).name,'Ada Lovelace');
  assert.equal(build({username:'ada'}).name,'ada');
  assert.equal(build({email:'private@example.com'}).name,'Account');
  assert.equal(ntCreateHeaderAccount({state:'authenticated',identity:{email:'private@example.com'}},{...options,showEmail:true}).identity.email,'private@example.com');
});
test('unsupported destinations are omitted and markup is escaped', () => {
  const account=ntCreateHeaderAccount({state:'authenticated',identity:{displayName:'<script>alert(1)</script>',avatarUrl:'javascript:alert(1)'}},{...options,destinations:{settings:{kind:'action',action:'settings'}},authenticatedItems:[]});
  assert.deepEqual(account.items.map(x=>x.id),['account-settings']);
  const html=render(account);
  assert.doesNotMatch(html,/<script>|src="javascript:/);
  assert.match(html,/&lt;script&gt;/);
});

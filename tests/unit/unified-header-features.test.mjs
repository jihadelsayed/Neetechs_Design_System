import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ntCreateHeaderAccount } from '../../dist/shell/header/unified-header.account.js';
import { ntCreateHeaderPreference } from '../../dist/shell/header/unified-header.preferences.js';
import { ntRenderHeader } from '../../dist/shell/header/unified-header.js';

const labels={primaryNavigation:'Primary',mobileNavigation:'Mobile',openNavigation:'Open',closeNavigation:'Close',account:'Account',accountLoading:'Loading'};
const base={id:'feature-header',brand:{label:'Neetechs',href:'/'},navigation:[],labels};
const accountOptions={labels:{account:'Account',login:'Login',signup:'Sign Up',myAccount:'My Account',myProducts:'My Products',settings:'Settings'},destinations:{},signOut:{label:'Logout',action:'host.logout'}};
const occurrences=(html,id)=>(html.match(new RegExp('data-nt-header-item="'+id+'"','g'))||[]).length;

test('sign-out is host-owned, available only for authenticated state in both surfaces',()=>{
  const auth=ntCreateHeaderAccount({state:'authenticated',identity:{displayName:'Test'}},accountOptions);
  assert.deepEqual(auth.items,[{kind:'action',id:'account-signout',label:'Logout',action:'host.logout',icon:'logout',danger:true}]);
  assert.equal(occurrences(ntRenderHeader({...base,account:auth}),'account-signout'),2);
  for(const state of ['loading','guest']) assert.equal(occurrences(ntRenderHeader({...base,account:ntCreateHeaderAccount({state},accountOptions)}),'account-signout'),0);
  const disabled=ntCreateHeaderAccount({state:'authenticated',identity:{}},{...accountOptions,signOut:{...accountOptions.signOut,disabled:true}});
  assert.equal(disabled.items[0].disabled,true);
});
test('preference helper preserves only valid supported choices and never guesses selection',()=>{
  const options={label:'Theme',selectedId:'system',choices:[{id:'light',label:'Light',action:'theme.light'},{id:'dark',label:'Dark',action:'theme.dark'},{id:'dark',label:'Duplicate',action:'duplicate'},{id:'bad',label:' ',action:'bad'}]};
  const result=ntCreateHeaderPreference(options);
  assert.equal(result.selectedId,'');
  assert.deepEqual(result.choices.map(x=>x.id),['light','dark']);
  assert.equal(ntCreateHeaderPreference({...options,choices:[]}),undefined);
  const appearance=ntCreateHeaderPreference({...options,selectedId:'dark'});
  const language=ntCreateHeaderPreference({label:'Language',selectedId:'ar',choices:[{id:'en',label:'English',action:'locale.en'},{id:'ar',label:'العربية',action:'locale.ar'}]});
  const html=ntRenderHeader({...base,appearance,language,direction:'rtl'});
  assert.equal(occurrences(html,'dark'),2);
  assert.equal(occurrences(html,'ar'),2);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,4);
});
test('optional notification summary renders in both surfaces with bounded badge',()=>{
  const notifications={label:'Notifications',unreadCount:120,emptyLabel:'Nothing new',items:[{kind:'link',id:'notice-1',label:'<Update>',href:'/notifications/1'}]};
  const html=ntRenderHeader({...base,notifications});
  assert.equal(occurrences(html,'notice-1'),2);
  assert.equal((html.match(/>99\+<\/span>/g)||[]).length,2);
  assert.match(html,/aria-label="Notifications \(120\)"/);
  assert.doesNotMatch(html,/<Update>/);
  assert.doesNotMatch(ntRenderHeader(base),/feature-header-notifications/);
});
test('empty notifications and invalid counts do not fabricate unread state',()=>{
  for(const unreadCount of [0,-1,NaN,Infinity,1.5]){
    const html=ntRenderHeader({...base,notifications:{label:'Notifications',unreadCount,emptyLabel:'No notifications',items:[]}});
    assert.doesNotMatch(html,/nt-header__notification-count/);
    assert.equal((html.match(/No notifications/g)||[]).length,2);
  }
});

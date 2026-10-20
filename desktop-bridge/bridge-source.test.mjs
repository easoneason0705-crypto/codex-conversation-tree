import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { bridgeExpression } from './bridge-source.mjs';

test('native bridge never clicks a matching Codex rail DOM item', () => {
  let listener, clicks = 0, scrolls = 0;
  const matching={dataset:{threadUserMessageNavigationItemId:'turn-1234:message-1234'},click:()=>clicks++};
  const unit={dataset:{contentSearchUnitKey:'turn-1234:message-1234'},scrollIntoView:()=>scrolls++,querySelector:()=>null};
  const context={
    document:{querySelector:()=>unit,querySelectorAll:selector=>selector==='[data-content-search-unit-key]'?[unit]:[matching]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},
    Date,
  };
  vm.runInNewContext(bridgeExpression,context);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',threadId:'thread-1234',turnId:'turn-1234',messageId:'wrong?',messageIndex:0}});
  assert.equal(clicks,0);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',nonce:'nonce-1234',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-1234',messageIndex:0}});
  assert.equal(clicks,0);
  assert.equal(scrolls,1);
  assert.equal(typeof context.__conversationTreeNativeBridgeV6.handle,'function');
  assert.equal(context.__conversationTreeNativeBridgeV6.lastResult.result,'scrolled-loaded-message');
});

test('native bridge invokes the current Codex React navigation callback when the rail is hidden', async () => {
  let listener, reveals = 0;
  const item={id:'turn-1234:0:user',turnKey:'turn-1234',isLoaded:false};
  const fiber={memoizedProps:{getItems:()=>[item],onRevealItem:async value=>{assert.equal(value,item);reveals++;}},return:null,child:null,sibling:null};
  const host={__reactFiber$test:fiber};
  const context={document:{documentElement:{},querySelector:selector=>selector.includes('thread-find-target')?host:null,querySelectorAll:()=>[]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},
    Date,Promise,Set,Object};
  vm.runInNewContext(bridgeExpression,context);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',nonce:'nonce-1234',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-9999',messageIndex:0}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(reveals,1);
  assert.equal(context.__conversationTreeNativeBridgeV6.lastResult.result,'invoked-native-reveal');
});

test('native bridge scrolls a currently rendered message when its navigation callback is absent', () => {
  let listener, scrolls = 0, animations = 0;
  const unit={dataset:{contentSearchUnitKey:'turn-1234:message-1234'},scrollIntoView:()=>scrolls++,
    querySelector:()=>({animate:()=>animations++})};
  const context={document:{documentElement:{},querySelector:selector=>selector==='[data-content-search-unit-key]'?unit:null,
    querySelectorAll:selector=>selector==='[data-content-search-unit-key]'?[unit]:[]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},
    Date,Set};
  vm.runInNewContext(bridgeExpression,context);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',nonce:'nonce-1234',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-1234',messageIndex:0}});
  assert.equal(scrolls,1);
  assert.equal(animations,1);
  assert.equal(context.__conversationTreeNativeBridgeV6.lastResult.result,'scrolled-loaded-message');
});

test('native bridge runs the same nonce only once', () => {
  let listener, scrolls = 0;
  const unit={dataset:{contentSearchUnitKey:'turn-1234:message-1234'},scrollIntoView:()=>scrolls++,querySelector:()=>null};
  const context={document:{querySelector:()=>unit,querySelectorAll:selector=>selector==='[data-content-search-unit-key]'?[unit]:[]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},Date,Set};
  vm.runInNewContext(bridgeExpression, context);
  const request={source:'conversation-tree',version:1,type:'reveal-user-message',nonce:'nonce-1234',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-1234',messageIndex:0};
  listener({source:{},data:request});
  listener({source:{},data:request});
  assert.equal(scrolls,1);
});

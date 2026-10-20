import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { bridgeExpression } from './bridge-source.mjs';

test('native bridge validates a tree event and clicks only the matching Codex rail item', () => {
  let listener, clicks = 0;
  const matching={dataset:{threadUserMessageNavigationItemId:'turn-1234:message-1234'},click:()=>clicks++};
  const context={
    document:{documentElement:{},querySelectorAll:()=>[matching]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},
    MutationObserver:class{observe(){} disconnect(){}},
    setTimeout:()=>1,clearTimeout:()=>{},Date,
    sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  };
  vm.runInNewContext(bridgeExpression,context);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',threadId:'thread-1234',turnId:'turn-1234',messageId:'wrong?',messageIndex:0}});
  assert.equal(clicks,0);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-1234',messageIndex:0}});
  assert.equal(clicks,1);
  assert.equal(typeof context.__conversationTreeNativeBridgeV4.handle,'function');
  assert.equal(context.__conversationTreeNativeBridgeV4.lastResult.result,'clicked-native-rail');
});

test('native bridge supports legacy turn item navigation IDs', () => {
  let listener, clicks = 0;
  const legacy={dataset:{threadUserMessageNavigationItemId:'turn-1234:0:user'},click:()=>clicks++};
  const context={document:{documentElement:{},querySelectorAll:()=>[legacy]},
    addEventListener:(type,fn)=>{if(type==='message')listener=fn;},
    MutationObserver:class{observe(){} disconnect(){}},setTimeout:()=>1,clearTimeout:()=>{},Date,
    sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};
  vm.runInNewContext(bridgeExpression,context);
  listener({source:{},data:{source:'conversation-tree',version:1,type:'reveal-user-message',threadId:'thread-1234',turnId:'turn-1234',messageId:'message-9999',messageIndex:0}});
  assert.equal(clicks,1);
});

test('native bridge reopens an existing conversation-tree app result', () => {
  let opens = 0;
  const openButton={click:()=>opens++};
  const status={textContent:'已打开 對話樹',parentElement:{parentElement:{querySelector:()=>openButton}}};
  const context={document:{documentElement:{},querySelectorAll:selector=>selector==='[role="status"]'?[status]:[]},
    addEventListener:()=>{},MutationObserver:class{observe(){} disconnect(){}},
    setInterval:fn=>{fn();return 1;},clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{},Date,
    sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};
  vm.runInNewContext(bridgeExpression,context);
  assert.equal(opens,1);
});

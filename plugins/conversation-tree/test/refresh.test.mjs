import test from 'node:test';
import assert from 'node:assert/strict';
import {TreeService} from '../src/service.mjs';

test('history refresh reads a fresh backend snapshot and links later branch prompts', async()=>{
  const message=id=>({id,status:'completed',items:[{id:`msg-${id}`,type:'userMessage',content:[{type:'text',text:id}]}]});
  let history=[message('base'),message('test')], readers=0;
  const service=new TreeService({
    call:async()=>({data:[message('base'),message('test')]}),
    withFreshConnection:async callback=>{readers++;return callback({call:async()=>({data:history})});},
  });
  const thread={id:'branch-1234'};
  assert.equal((await service.turns(thread,true)).length,2);
  history=[...history,message('test2')];
  const turns=await service.turns(thread,true);
  assert.equal(turns.length,3);
  assert.equal(turns.at(-1).id,'test2');
  assert.equal(readers,2);
});

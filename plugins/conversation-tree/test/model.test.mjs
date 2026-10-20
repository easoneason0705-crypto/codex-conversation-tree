import test from 'node:test';
import assert from 'node:assert/strict';
import { nodesFromTurns, promptTitle, cleanPrompt } from '../src/model.mjs';
const message=(id,text)=>({type:'userMessage',id,content:[{type:'text',text}]});
const turn=(id,items,status='completed')=>({id,items,status});
test('only user prompts become nodes, with stable IDs and chronological parents',()=>{
  const turns=[turn('t1',[message('m1','午餐'),{type:'reasoning',content:['private']}]),turn('t2',[message('m2','煎蛋')])];
  const nodes=nodesFromTurns('root',turns);
  assert.deepEqual(nodes.map(n=>n.id),['root:m1','root:m2']);
  assert.equal(nodes[1].parentId,'root:m1');
  assert.deepEqual(nodesFromTurns('root',turns),nodes);
  assert.ok(!JSON.stringify(nodes).includes('private'));
});
test('fork omits inherited turns and links new prompts to the source node',()=>{
  const turns=[turn('t1',[message('m1','午餐')]),turn('t2',[message('m2','煎蛋')]),turn('t3',[message('m3','買雞蛋')])];
  const nodes=nodesFromTurns('child',turns,{baseTurnId:'t2',parentNodeId:'root:m2'});
  assert.equal(nodes.length,1);assert.equal(nodes[0].text,'買雞蛋');assert.equal(nodes[0].parentId,'root:m2');
  assert.deepEqual(nodesFromTurns('child',turns.slice(0,2),{baseTurnId:'t2',parentNodeId:'root:m2'}),[]);
});
test('missing fork boundary fails rather than inventing ancestry',()=>{
  assert.throws(()=>nodesFromTurns('child',[],{baseTurnId:'missing',parentNodeId:'root:m1'}),/來源回合/);
});
test('steering inputs remain separate nodes but only the final prompt can be a turn boundary',()=>{
  const nodes=nodesFromTurns('root',[turn('t1',[message('m1','第一個'),message('m2','補充')]),turn('t2',[message('m3','等待')],'inProgress')]);
  assert.deepEqual(nodes.map(n=>n.branchable),[false,true,false]);
});
test('attachment wrapper is removed for display and titles preserve Unicode',()=>{
  assert.equal(cleanPrompt('# Files mentioned\nabc\n## My request:\n如何煎蛋？'),'如何煎蛋？');
  assert.equal(promptTitle('如何煎蛋？'),'如何煎蛋？');
  const nodes=nodesFromTurns('r',[turn('t',[message('m','原文')])],null,{'r:m':'改名'});
  assert.equal(nodes[0].title,'改名');assert.equal(nodes[0].text,'原文');
});

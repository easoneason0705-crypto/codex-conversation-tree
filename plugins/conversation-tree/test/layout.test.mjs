import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTreeNodes } from '../src/layout.mjs';

test('manual offsets do not accumulate through later nodes', () => {
  const nodes=[
    {id:'a',threadId:'root',parentId:null},
    {id:'b',threadId:'root',parentId:'a'},
    {id:'c',threadId:'root',parentId:'b'},
  ];
  const offsets=new Map([['a',{x:100,y:0}],['b',{x:-50,y:0}]]);
  const {positions}=layoutTreeNodes(nodes,[{id:'root'}],'root',offsets);
  assert.equal(positions.get('a').x,126);
  assert.equal(positions.get('b').x,186);
  assert.equal(positions.get('c').x,446);
});

test('a branch starts below its displayed parent and empty intermediates use no lane', () => {
  const nodes=[
    {id:'parent',threadId:'root',parentId:null},
    {id:'branch',threadId:'child',parentId:'parent'},
  ];
  const branches=[{id:'root'},{id:'intermediate'},{id:'child'}];
  const {positions,lanes}=layoutTreeNodes(nodes,branches,'root',new Map([['parent',{x:100,y:0}]]));
  assert.equal(positions.get('branch').x,positions.get('parent').x);
  assert.equal(lanes.get('child'),1);
  assert.equal(positions.get('branch').y,132);
  assert.equal(lanes.has('intermediate'),false);
});

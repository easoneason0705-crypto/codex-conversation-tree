import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTreeNodes } from '../src/layout.mjs';

test('manual offsets do not accumulate through later nodes', () => {
  const nodes=[
    {id:'a',threadId:'root',parentId:null},
    {id:'b',threadId:'root',parentId:'a'},
    {id:'c',threadId:'root',parentId:'b'},
  ];
  const offsets=new Map([['a',{x:0,y:100}],['b',{x:0,y:-50}]]);
  const {positions}=layoutTreeNodes(nodes,[{id:'root'}],'root',offsets);
  assert.equal(positions.get('a').y,130);
  assert.equal(positions.get('b').y,82);
  assert.equal(positions.get('c').y,234);
});

test('branches start beside their displayed parent and empty intermediates use no lane', () => {
  const nodes=[
    {id:'parent',threadId:'root',parentId:null},
    {id:'branch',threadId:'child',parentId:'parent'},
  ];
  const branches=[{id:'root'},{id:'intermediate'},{id:'child'}];
  const {positions,lanes}=layoutTreeNodes(nodes,branches,'root',new Map([['parent',{x:0,y:40}]]));
  assert.equal(lanes.get('child'),-1);
  assert.ok(positions.get('branch').x<positions.get('parent').x);
  assert.equal(positions.get('branch').y,positions.get('parent').y);
  assert.equal(lanes.has('intermediate'),false);
});

test('visible branches alternate left and right while every thread grows downward', () => {
  const nodes=[
    {id:'root-a',threadId:'root',parentId:null},
    {id:'root-b',threadId:'root',parentId:'root-a'},
    {id:'left-a',threadId:'left',parentId:'root-a'},
    {id:'left-b',threadId:'left',parentId:'left-a'},
    {id:'right-a',threadId:'right',parentId:'root-b'},
  ];
  const branches=[{id:'root'},{id:'left'},{id:'right'}];
  const {positions,lanes}=layoutTreeNodes(nodes,branches,'root');
  assert.equal(lanes.get('root'),0);
  assert.equal(lanes.get('left'),-1);
  assert.equal(lanes.get('right'),1);
  assert.ok(positions.get('left-a').x<positions.get('root-a').x);
  assert.ok(positions.get('right-a').x>positions.get('root-b').x);
  assert.ok(positions.get('root-b').y>positions.get('root-a').y);
  assert.ok(positions.get('left-b').y>positions.get('left-a').y);
});

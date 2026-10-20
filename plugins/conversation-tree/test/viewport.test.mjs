import test from 'node:test';
import assert from 'node:assert/strict';
import { centerOfNodes, createWorldGeometry, MAX_ZOOM, MIN_ZOOM, panWithinWorld, scrollForCenter } from '../src/viewport.mjs';

test('world keeps finite space around the tree at every supported zoom level', () => {
  const positions=new Map([['a',{x:26,y:30}],['b',{x:236,y:30}],['branch',{x:236,y:132}]]);
  for(const scale of [MIN_ZOOM,1,MAX_ZOOM]){
    const world=createWorldGeometry(positions,{width:800,height:420},scale);
    assert.ok(world.offsetX*scale>=480*.999);
    assert.ok(world.offsetY*scale>=252*.999);
    assert.ok(world.width*scale>800);
    assert.ok(world.height*scale>420);
  }
});

test('mainline center produces a bounded initial scroll position', () => {
  const nodes=[{id:'a'},{id:'b'}];
  const positions=new Map([['a',{x:26,y:30}],['b',{x:236,y:30}]]);
  const viewport={width:500,height:300};
  const world=createWorldGeometry(positions,viewport,1);
  const center=centerOfNodes(nodes,positions);
  assert.deepEqual(center,{x:221,y:64});
  const scroll=scrollForCenter(center,world,viewport,1);
  assert.equal(scroll.left,center.x+world.offsetX-viewport.width/2);
  assert.equal(scroll.top,center.y+world.offsetY-viewport.height/2);
  assert.ok(scroll.left>=0&&scroll.left<=world.width-viewport.width);
  assert.ok(scroll.top>=0&&scroll.top<=world.height-viewport.height);
});

test('empty node selection has no center', () => {
  assert.equal(centerOfNodes([],new Map()),null);
});

test('blank-space panning stops at every world edge', () => {
  const world={width:1000,height:800};
  const viewport={width:500,height:300};
  assert.deepEqual(panWithinWorld({left:200,top:100},{x:50,y:-75},world,viewport,1),{left:150,top:175});
  assert.deepEqual(panWithinWorld({left:200,top:100},{x:9999,y:9999},world,viewport,1),{left:0,top:0});
  assert.deepEqual(panWithinWorld({left:200,top:100},{x:-9999,y:-9999},world,viewport,1),{left:500,top:500});
});

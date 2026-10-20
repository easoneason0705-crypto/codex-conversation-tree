import test from 'node:test';
import assert from 'node:assert/strict';
import { TreeService, config } from '../src/service.mjs';

test('desktop continuation with a different ID supplies branch prompts without duplicating inherited messages', async () => {
  const root='root-1234', branch='branch-1234', continued='continued-1234';
  const turn=(id,text)=>({id,status:'completed',items:[{id:`msg-${id}`,type:'userMessage',content:[{type:'text',text}]}]});
  const inherited=turn('base','same prompt');
  const threads=Object.fromEntries([root,branch,continued,'unrelated-1234'].map(id=>[id,{id,cwd:config.workspace,name:id,forkedFromId:id===continued?branch:null}]));
  const rpc={call:async(method,args)=>{
    if(method==='thread/read')return {thread:threads[args.threadId]};
    if(method==='thread/list')return {data:Object.values(threads).map(t=>({...t,forkedFromId:null}))};
    if(method==='thread/turns/list')return {data:args.threadId===continued?[inherited,turn('new','same prompt')]:[inherited]};
    throw new Error(method);
  }};
  const service=new TreeService(rpc);
  service.records=async directory=>directory==='branches'?[{id:branch,rootThreadId:root,parentThreadId:root,parentNodeId:`${root}:msg-base`,baseTurnId:'base',name:'test3'}]:[];
  const snapshot=await service.snapshot(root);
  assert.deepEqual(snapshot.warnings,[]);
  assert.equal(snapshot.branches.length,3);
  const nodes=snapshot.nodes.filter(n=>n.threadId===continued);
  assert.equal(nodes.length,1);
  assert.equal(nodes[0].messageId,'msg-new');
  assert.equal(nodes[0].parentId,`${root}:msg-base`);
  assert.ok(!snapshot.branches.some(b=>b.id==='unrelated-1234'));
});

test('a saved branch removed from the active Codex chat list is pruned', async () => {
  const root='root-1234', deleted='deleted-1234';
  const base={id:'base',status:'completed',items:[{id:'msg-base',type:'userMessage',content:[{type:'text',text:'root'}]}]};
  const threads={
    [root]:{id:root,cwd:config.workspace,name:'root'},
    [deleted]:{id:deleted,cwd:config.workspace,name:'deleted'},
  };
  const rpc={call:async(method,args)=>{
    if(method==='thread/read')return {thread:threads[args.threadId]};
    if(method==='thread/list')return {data:[threads[root]]};
    if(method==='thread/turns/list')return {data:[base]};
    throw new Error(method);
  }};
  const service=new TreeService(rpc);
  service.records=async directory=>directory==='branches'?[{
    id:deleted,rootThreadId:root,parentThreadId:root,parentNodeId:`${root}:msg-base`,baseTurnId:'base',name:'discarded branch'
  }]:[];
  const removed=[];
  service.remove=async(directory,id)=>removed.push([directory,id]);
  const snapshot=await service.snapshot(root);
  assert.deepEqual(snapshot.branches.map(branch=>branch.id),[root]);
  assert.ok(!snapshot.nodes.some(node=>node.threadId===deleted));
  assert.deepEqual(removed,[['branches',deleted]]);
});

test('a temporary active-list failure never deletes saved branches', async () => {
  const root='root-1234', branch='branch-1234';
  const base={id:'base',status:'completed',items:[{id:'msg-base',type:'userMessage',content:[{type:'text',text:'root'}]}]};
  const threads=Object.fromEntries([root,branch].map(id=>[id,{id,cwd:config.workspace,name:id}]));
  const rpc={call:async(method,args)=>{
    if(method==='thread/read')return {thread:threads[args.threadId]};
    if(method==='thread/list')throw new Error('temporarily unavailable');
    if(method==='thread/turns/list')return {data:[base]};
    throw new Error(method);
  }};
  const service=new TreeService(rpc);
  service.records=async directory=>directory==='branches'?[{
    id:branch,rootThreadId:root,parentThreadId:root,parentNodeId:`${root}:msg-base`,baseTurnId:'base',name:'kept branch'
  }]:[];
  service.remove=async()=>assert.fail('must not delete without an authoritative active list');
  const snapshot=await service.snapshot(root);
  assert.ok(snapshot.branches.some(item=>item.id===branch));
  assert.match(snapshot.warnings[0],/活動聊天同步失敗/);
});

test('an active desktop continuation reconstructs its missing intermediate branch', async () => {
  const root='root-1234', intermediate='middle-1234', child='child-1234';
  const turn=(id,text)=>({id,status:'completed',items:[{id:`msg-${id}`,type:'userMessage',content:[{type:'text',text}]}]});
  const base=turn('base','branch point'), next=turn('next','new branch prompt');
  const threads={
    [root]:{id:root,cwd:config.workspace,name:'root',forkedFromId:null},
    [intermediate]:{id:intermediate,cwd:config.workspace,name:'plugin branch',forkedFromId:root},
    [child]:{id:child,cwd:config.workspace,name:'desktop continuation',forkedFromId:intermediate},
  };
  const rpc={call:async(method,args)=>{
    if(method==='thread/read')return {thread:threads[args.threadId]};
    if(method==='thread/list')return {data:[threads[root],threads[child]].map(value=>({...value,forkedFromId:null}))};
    if(method==='thread/turns/list')return {data:args.threadId===child?[base,next]:[base]};
    throw new Error(method);
  }};
  const service=new TreeService(rpc);
  service.records=async()=>[];
  const snapshot=await service.snapshot(root);
  assert.deepEqual(snapshot.branches.map(branch=>branch.id),[root,intermediate,child]);
  const node=snapshot.nodes.find(item=>item.threadId===child);
  assert.equal(node.text,'new branch prompt');
  assert.equal(node.parentId,`${root}:msg-base`);
});

test('an inactive intermediate record is retained while it has an active descendant', async () => {
  const root='root-1234', intermediate='middle-1234', child='child-1234';
  const base={id:'base',status:'completed',items:[{id:'msg-base',type:'userMessage',content:[{type:'text',text:'branch point'}]}]};
  const threads={
    [root]:{id:root,cwd:config.workspace,name:'root',forkedFromId:null},
    [intermediate]:{id:intermediate,cwd:config.workspace,name:'plugin branch',forkedFromId:root},
    [child]:{id:child,cwd:config.workspace,name:'desktop continuation',forkedFromId:intermediate},
  };
  const rpc={call:async(method,args)=>{
    if(method==='thread/read')return {thread:threads[args.threadId]};
    if(method==='thread/list')return {data:[threads[root],threads[child]].map(value=>({...value,forkedFromId:null}))};
    if(method==='thread/turns/list')return {data:[base]};
    throw new Error(method);
  }};
  const service=new TreeService(rpc);
  service.records=async directory=>directory==='branches'?[{
    id:intermediate,rootThreadId:root,parentThreadId:root,parentNodeId:`${root}:msg-base`,baseTurnId:'base',name:'kept intermediate'
  }]:[];
  service.remove=async()=>assert.fail('an intermediate with an active descendant must be retained');
  const snapshot=await service.snapshot(root);
  assert.ok(snapshot.branches.some(branch=>branch.id===intermediate));
});

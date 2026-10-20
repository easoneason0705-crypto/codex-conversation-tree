import test from 'node:test';
import assert from 'node:assert/strict';
import { needsThreadSwitch, openThread } from '../src/navigation.mjs';

test('chat navigation skips deep links while selecting nodes in the active chat', () => {
  assert.equal(needsThreadSwitch('chat-123','chat-123'),false);
  assert.equal(needsThreadSwitch('chat-123','branch-456'),true);
  assert.equal(needsThreadSwitch(null,'chat-123'),true);
});

test('chat navigation uses host link bridge without inventing message anchors', async () => {
  const links=[];
  const app={getHostCapabilities:()=>({openLinks:{}}),openLink:async value=>{links.push(value);return {};}};
  await openThread(app,'chat-123');
  assert.deepEqual(links,[{url:'codex://threads/chat-123'}]);
  await assert.rejects(openThread(app,'chat-123',{preview:true}),/預覽/);
  await assert.rejects(openThread(app,'chat-123?message=x'),/ID/);
  assert.equal(links.length,1);
});

test('missing host capability and refused navigation remain visible failures', async () => {
  await assert.rejects(openThread({getHostCapabilities:()=>({})},'chat-123'),/沒有開放/);
  await assert.rejects(openThread({getHostCapabilities:()=>({openLinks:{}}),openLink:async()=>({isError:true})},'chat-123'),/未能開啟/);
});

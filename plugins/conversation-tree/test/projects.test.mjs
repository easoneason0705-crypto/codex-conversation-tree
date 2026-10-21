import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TreeService } from '../src/service.mjs';

test('project catalog deduplicates chats, groups workspaces and excludes saved branches', async () => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'conversation-tree-projects-'));
  const alpha = join(dataDirectory, 'alpha');
  const beta = join(dataDirectory, 'beta');
  const threads = {
    'root-a111': { id: 'root-a111', cwd: alpha, name: 'Alpha old' },
    'root-a222': { id: 'root-a222', cwd: alpha, name: 'Alpha current' },
    'root-b111': { id: 'root-b111', cwd: beta, name: 'Beta root' },
    'branch-111': { id: 'branch-111', cwd: alpha, name: 'Saved branch', forkedFromId: null },
    'native-111': { id: 'native-111', cwd: beta, name: 'Native branch', forkedFromId: 'root-b111' },
  };
  const pages = {
    first: { data: [
      { ...threads['root-a111'], updatedAt: 1 },
      { ...threads['root-a222'], updatedAt: 2 },
      { ...threads['branch-111'], updatedAt: 4 },
    ], nextCursor: 'second' },
    second: { data: [
      { ...threads['root-a222'], name: 'duplicate summary', updatedAt: 3 },
      { ...threads['root-b111'], updatedAt: 5 },
      { ...threads['native-111'], updatedAt: 6 },
    ] },
  };
  const reads = new Map();
  const rpc = { call: async (method, args) => {
    if (method === 'thread/list') return args.cursor ? pages.second : pages.first;
    if (method === 'thread/read') { reads.set(args.threadId, (reads.get(args.threadId) || 0) + 1); return { thread: threads[args.threadId] }; }
    throw new Error(method);
  } };
  const service = new TreeService(rpc, { dataDirectory });
  service.records = async directory => directory === 'branches' ? [{ id: 'branch-111', rootThreadId: 'root-a111' }] : [];
  try {
    const catalog = await service.projects();
    assert.equal(catalog.projects.length, 2);
    assert.deepEqual(catalog.projects.flatMap(project => project.roots.map(root => root.id)).sort(), ['root-a111', 'root-a222', 'root-b111']);
    assert.equal(reads.get('root-a222'), 1, 'duplicate thread/list rows must be read once');
    assert.equal(reads.has('branch-111'), false, 'saved plugin branches must never become roots');
    assert.equal(reads.has('native-111'), false, 'native branches must never become roots');
    assert.equal(catalog.projects.find(project => project.workspace === alpha).roots.length, 2);
  } finally { await rm(dataDirectory, { recursive: true, force: true }); }
});

test('each project remembers its own selected root and restores the last tree', async () => {
  const dataDirectory = await mkdtemp(join(tmpdir(), 'conversation-tree-preferences-'));
  const alpha = join(dataDirectory, 'alpha');
  const beta = join(dataDirectory, 'beta');
  const threads = {
    'root-a111': { id: 'root-a111', cwd: alpha, name: 'Alpha one' },
    'root-a222': { id: 'root-a222', cwd: alpha, name: 'Alpha two' },
    'root-b111': { id: 'root-b111', cwd: beta, name: 'Beta one' },
  };
  const rpc = { call: async (method, args) => {
    if (method === 'thread/list') return { data: Object.values(threads) };
    if (method === 'thread/read') return { thread: threads[args.threadId] };
    throw new Error(method);
  } };
  const service = new TreeService(rpc, { dataDirectory });
  try {
    await service.selectRoot('root-a222');
    await service.selectRoot('root-b111');
    const catalog = await service.projects();
    assert.equal(catalog.selectedRootId, 'root-b111');
    assert.equal(catalog.projects.find(project => project.workspace === alpha).selectedRootId, 'root-a222');
    assert.equal(catalog.projects.find(project => project.workspace === beta).selectedRootId, 'root-b111');
    assert.equal((await service.resolveRoot()).rootThreadId, 'root-b111');
    const saved = JSON.parse(await readFile(join(dataDirectory, 'preferences.json'), 'utf8'));
    assert.equal(Object.keys(saved.lastRootByWorkspace).length, 2);
    await assert.rejects(() => service.selectRoot('missing-111'), /找不到這個主線聊天/);
  } finally { await rm(dataDirectory, { recursive: true, force: true }); }
});

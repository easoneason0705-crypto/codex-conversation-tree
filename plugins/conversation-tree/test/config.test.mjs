import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/config.mjs';

test('user config supports portable relative paths and environment overrides', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'conversation-tree-config-'));
  const path = join(directory, 'config.json');
  const previous = process.env.CONVERSATION_TREE_CONFIG;
  const previousRoot = process.env.CONVERSATION_TREE_ROOT_THREAD_ID;
  try {
    await writeFile(path, JSON.stringify({
      workspace: './workspace', defaultThreadId: 'saved-thread', dataDirectory: './data', codexExecutable: null,
    }));
    process.env.CONVERSATION_TREE_CONFIG = path;
    process.env.CONVERSATION_TREE_ROOT_THREAD_ID = 'environment-thread';
    const loaded = await loadConfig();
    assert.equal(loaded.workspace, resolve(directory, 'workspace'));
    assert.equal(loaded.dataDirectory, resolve(directory, 'data'));
    assert.equal(loaded.defaultThreadId, 'environment-thread');
    assert.equal(loaded.configPath, path);
  } finally {
    if (previous === undefined) delete process.env.CONVERSATION_TREE_CONFIG;
    else process.env.CONVERSATION_TREE_CONFIG = previous;
    if (previousRoot === undefined) delete process.env.CONVERSATION_TREE_ROOT_THREAD_ID;
    else process.env.CONVERSATION_TREE_ROOT_THREAD_ID = previousRoot;
    await rm(directory, { recursive: true, force: true });
  }
});

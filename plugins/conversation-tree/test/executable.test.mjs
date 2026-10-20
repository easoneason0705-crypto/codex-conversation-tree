import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveCodexExecutable } from '../src/service.mjs';

test('missing versioned Codex path follows the current desktop installation', async () => {
  const root=await mkdtemp(join(tmpdir(),'conversation-tree-codex-'));
  try {
    const current=join(root,'OpenAI','Codex','bin','current','codex.exe');
    await mkdir(join(current,'..'),{recursive:true});
    await writeFile(current,'');
    assert.equal(await resolveCodexExecutable(join(root,'removed','codex.exe'),root),current);
  } finally { await rm(root,{recursive:true,force:true}); }
});

import { resolve } from 'node:path';
import { CodexRpc } from '../plugins/conversation-tree/src/rpc.mjs';
import { resolveCodexExecutable } from '../plugins/conversation-tree/src/service.mjs';

const workspaceArg = process.argv[process.argv.indexOf('--workspace') + 1];
if (!workspaceArg || workspaceArg === '--workspace') {
  console.error('Usage: node scripts/list-threads.mjs --workspace <path>');
  process.exit(2);
}
const workspace = resolve(workspaceArg);
const normalized = value => process.platform === 'win32' ? resolve(value).toLowerCase() : resolve(value);
const rpc = new CodexRpc(await resolveCodexExecutable());
try {
  const threads = [];
  let cursor;
  do {
    const page = await rpc.call('thread/list', { limit: 100, ...(cursor ? { cursor } : {}) });
    threads.push(...page.data.filter(thread => normalized(thread.cwd) === normalized(workspace)));
    cursor = page.nextCursor;
  } while (cursor);
  threads.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  if (!threads.length) {
    console.log('此工作區目前沒有可用聊天。請先在 Codex 中開啟此專案並建立聊天。');
  } else {
    for (const [index, thread] of threads.entries()) {
      console.log(`${String(index + 1).padStart(2)}  ${thread.id}  ${thread.name || '(未命名聊天)'}`);
    }
  }
} finally {
  rpc.close();
}

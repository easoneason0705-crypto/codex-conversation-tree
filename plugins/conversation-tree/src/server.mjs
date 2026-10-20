import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TreeService, pluginRoot, config } from './service.mjs';

const service = new TreeService();
const server = new McpServer({ name: 'conversation-tree', title: '對話樹', version: '0.2.14' });
const uri = 'ui://conversation-tree/panel.html';
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
function result(data) {
  // Full prompts belong to the UI result metadata; do not add them to model context.
  return { content: [{ type: 'text', text: '對話樹面板資料已更新。' }], _meta: { tree: data } };
}
const handle = callback => async args => {
  try { return result(await callback(args)); }
  catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
};
registerAppResource(server, '對話樹面板', uri, {}, async () => ({ contents: [{
  uri, mimeType: RESOURCE_MIME_TYPE, text: await readFile(join(pluginRoot, 'dist/panel.html'), 'utf8'),
  _meta: { ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: [] } },
    'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] } },
}] }));
registerAppTool(server, 'tree_open', {
  title: '對話樹', description: 'Open a local conversation tree panel for this workspace. Defaults to the configured chat. Does not jump or send messages in the native chat.',
  inputSchema: { rootThreadId: z.string().optional() }, annotations: readOnly,
  _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'thread' }] } },
}, handle(args => service.snapshot(args.rootThreadId || config.defaultThreadId)));
registerAppTool(server, 'tree_snapshot', {
  title: '更新對話樹', inputSchema: { rootThreadId: z.string() }, annotations: readOnly,
  _meta: { ui: { resourceUri: uri, visibility: ['app'] } },
}, handle(args => service.snapshot(args.rootThreadId)));
registerAppTool(server, 'tree_rename', {
  title: '修改節點名稱', inputSchema: { rootThreadId: z.string(), nodeId: z.string(), title: z.string().min(1).max(120) },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  _meta: { ui: { resourceUri: uri, visibility: ['app'] } },
}, handle(args => service.renameNode(args.rootThreadId, args.nodeId, args.title)));
registerAppTool(server, 'tree_reveal', {
  title: '定位提示詞', description: 'Queue a validated local request for the desktop bridge to invoke Codex native prompt navigation.',
  inputSchema: { rootThreadId: z.string(), nodeId: z.string() }, annotations: readOnly,
  _meta: { ui: { resourceUri: uri, visibility: ['app'] } },
}, handle(args => service.revealNode(args.rootThreadId, args.nodeId)));
registerAppTool(server, 'tree_fork', {
  title: '建立獨立對話分支', description: 'Create a real local Codex thread through a completed turn, without sending a prompt or switching the native chat. Workspace files are shared.',
  inputSchema: { rootThreadId: z.string(), nodeId: z.string(), name: z.string().min(1).max(60) },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
  _meta: { ui: { resourceUri: uri, visibility: ['app'] } },
}, handle(args => service.fork(args.rootThreadId, args.nodeId, args.name)));
process.on('SIGINT', () => { service.close(); process.exit(0); });
process.on('SIGTERM', () => { service.close(); process.exit(0); });
process.stdin.on('end', () => { service.close(); process.exit(0); });
await server.connect(new StdioServerTransport());

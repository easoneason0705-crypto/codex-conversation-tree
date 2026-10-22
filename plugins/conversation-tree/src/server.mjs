import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TreeService, pluginRoot } from './service.mjs';
import { config } from './config.mjs';
import { translate } from './i18n.mjs';

const service = new TreeService();
const version = '0.2.33';
const t = (key, variables) => translate(config.locale, key, variables);
const server = new McpServer({ name: 'conversation-tree', title: t('appTitle'), version });
// Codex caches MCP App resources by URI. Version the URI so an upgraded
// plugin always receives the matching panel bundle instead of an old iframe.
const uri = `ui://conversation-tree/${version}/panel.html`;
// Keep historical resource URIs readable because Codex can rehydrate old
// tree_open results from chat history after a restart. Do not force those
// historical results into fullscreen tabs. Codex otherwise defaults to
// fullscreen whenever both inline and fullscreen are advertised.
const panelUris = [
  uri,
  'ui://conversation-tree/panel.html',
  'ui://conversation-tree/0.2.20/panel.html',
  'ui://conversation-tree/0.2.24/panel.html',
  'ui://conversation-tree/0.2.27/panel.html',
  'ui://conversation-tree/0.2.29/panel.html',
  'ui://conversation-tree/0.2.31/panel.html',
  'ui://conversation-tree/0.2.32/panel.html',
];
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
function result(data) {
  // Full prompts belong to the UI result metadata; do not add them to model context.
  return { content: [{ type: 'text', text: t('panelUpdated') }], _meta: { tree: data } };
}
const handle = callback => async args => {
  try { return result(await callback(args)); }
  catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] }; }
};
for (const resourceUri of panelUris) {
  registerAppResource(server, t('panelResource'), resourceUri, {}, async () => ({ contents: [{
    uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: await readFile(join(pluginRoot, 'dist/panel.html'), 'utf8'),
    _meta: { ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: [] } },
      'openai/ui': { preferredDisplayMode: 'inline', availableDisplayModes: ['inline'] } },
  }] }));
}
registerAppTool(server, 'tree_open', {
  title: t('appTitle'), description: 'Open the conversation tree for the selected Codex chat. Pass the current chat thread ID as rootThreadId when available; otherwise use the configured default.',
  inputSchema: { rootThreadId: z.string().optional() }, annotations: readOnly,
  _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'thread' }] } },
}, handle(args => service.open(args.rootThreadId)));
registerAppTool(server, 'tree_projects', {
  title: t('listTrees'), description: 'List Codex projects and root chats so the panel can switch without sharing one global tree.',
  inputSchema: {}, annotations: readOnly, _meta: { ui: { visibility: ['app'] } },
}, handle(() => service.projects()));
registerAppTool(server, 'tree_select_root', {
  title: t('switchTree'), description: 'Select and remember one root chat for its project, then return that tree.',
  inputSchema: { rootThreadId: z.string() }, annotations: readOnly,
  _meta: { ui: { visibility: ['app'] } },
}, handle(async args => {
  await service.selectRoot(args.rootThreadId);
  return service.snapshot(args.rootThreadId);
}));
registerAppTool(server, 'tree_snapshot', {
  title: t('updateTree'), inputSchema: { rootThreadId: z.string() }, annotations: readOnly,
  _meta: { ui: { visibility: ['app'] } },
}, handle(args => service.snapshot(args.rootThreadId)));
registerAppTool(server, 'tree_rename', {
  title: t('renameNode'), inputSchema: { rootThreadId: z.string(), nodeId: z.string(), title: z.string().min(1).max(120) },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: true },
  _meta: { ui: { visibility: ['app'] } },
}, handle(args => service.renameNode(args.rootThreadId, args.nodeId, args.title)));
registerAppTool(server, 'tree_reveal', {
  title: t('locatePrompt'), description: 'Queue a validated local request for the desktop bridge to invoke Codex native prompt navigation.',
  inputSchema: { rootThreadId: z.string(), nodeId: z.string() }, annotations: readOnly,
  _meta: { ui: { visibility: ['app'] } },
}, handle(args => service.revealNode(args.rootThreadId, args.nodeId)));
registerAppTool(server, 'tree_queue_reveal', {
  title: t('preparePromptLocation'), description: 'Persist a validated local prompt-navigation request before Codex changes chats.',
  inputSchema: { rootThreadId: z.string(), nodeId: z.string() }, annotations: readOnly,
  _meta: { ui: { visibility: ['app'] } },
}, handle(args => service.queueRevealNode(args.rootThreadId, args.nodeId)));
registerAppTool(server, 'tree_fork', {
  title: t('createIndependentBranch'), description: 'Create a real local Codex thread through a completed turn, without sending a prompt or switching the native chat. Workspace files are shared.',
  inputSchema: { rootThreadId: z.string(), nodeId: z.string(), name: z.string().min(1).max(60) },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
  _meta: { ui: { visibility: ['app'] } },
}, handle(args => service.fork(args.rootThreadId, args.nodeId, args.name)));
process.on('SIGINT', () => { service.close(); process.exit(0); });
process.on('SIGTERM', () => { service.close(); process.exit(0); });
process.stdin.on('end', () => { service.close(); process.exit(0); });
await server.connect(new StdioServerTransport());

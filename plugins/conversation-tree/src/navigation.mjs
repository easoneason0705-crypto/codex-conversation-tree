function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value); }

// The host opens the chat. Precise reveal requests are queued through the MCP
// server because an MCP App iframe cannot postMessage across Electron
// WebContents boundaries.
export async function openThread(app, threadId, { preview = false } = {}) {
  if (preview) throw new Error('本機瀏覽器預覽無法切換原生聊天；請使用對話旁的插件面板。');
  if (!validId(threadId)) throw new Error('聊天 ID 無效。');
  if (!app.getHostCapabilities()?.openLinks) throw new Error('目前宿主沒有開放聊天連結。');
  const result = await app.openLink({ url: `codex://threads/${threadId}` });
  if (result?.isError) throw new Error('宿主未能開啟聊天連結。');
}

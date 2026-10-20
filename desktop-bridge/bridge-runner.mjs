import { writeFile, appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { bridgeExpression } from './bridge-source.mjs';
import { isPrimaryCodexPage } from './bridge-target.mjs';

const port = Number(process.argv[2]);
const statePath = process.argv[3];
if (!Number.isInteger(port) || port < 1024 || port > 65535 || !statePath) {
  throw new Error('Usage: node bridge-runner.mjs <debug-port> <state-file>');
}
await mkdir(dirname(statePath), { recursive: true });
const logPath = `${statePath}.log`;
const commandPath = `${dirname(statePath)}/reveal-command.json`;
const resultPath = `${dirname(statePath)}/reveal-result.json`;
const attached = new Map();
let shuttingDown = false;
let everAttached = false;
let lastNonce = null;
let activeReveal = null;

async function log(message) {
  await appendFile(logPath, `${new Date().toISOString()} ${message}\n`, 'utf8').catch(() => {});
}
async function save(status, extra = {}) {
  await writeFile(statePath, JSON.stringify({
    status, port, runnerPid: process.pid, attachedTargets: attached.size,
    updatedAt: new Date().toISOString(), ...extra,
  }, null, 2), 'utf8');
}
function validRevealRequest(request) {
  return request?.source === 'conversation-tree' && request.version === 1 &&
    request.type === 'reveal-user-message' && validId(request.nonce) &&
    [request.threadId, request.turnId, request.messageId].every(validId) &&
    Number.isInteger(request.messageIndex) && request.messageIndex >= 0;
}
async function receivePanelReveal(socket, params) {
  if (socket.__target?.type !== 'webview' || !socket.__target?.url?.includes('mcp-app-')) return;
  const [marker, encoded] = params.args || [];
  if (marker?.value !== 'conversation-tree:reveal' || typeof encoded?.value !== 'string') return;
  let request; try { request = JSON.parse(encoded.value); } catch { return; }
  if (!validRevealRequest(request)) return;
  await writeFile(commandPath, JSON.stringify(request, null, 2), 'utf8');
  lastNonce = null;
  await log(`received panel reveal ${request.nonce}`);
}
function send(socket, method, params = {}) {
  const id = (socket.__sequence = (socket.__sequence || 0) + 1);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.__pending.delete(id); reject(new Error(`${method} timed out`)); }, 5000);
    socket.__pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function attach(target) {
  if (!target.webSocketDebuggerUrl || attached.has(target.id)) return;
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  socket.__pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.consoleAPICalled') { void receivePanelReveal(socket, message.params).catch(error => log(`panel event failed: ${error.message}`)); return; }
    const pending = socket.__pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer); socket.__pending.delete(message.id);
    message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  attached.set(target.id, socket);
  socket.__target = target;
  everAttached = true;
  socket.addEventListener('close', () => attached.delete(target.id));
  await send(socket, 'Runtime.enable');
  if (target.type === 'page') {
    await send(socket, 'Page.enable');
    await send(socket, 'Page.addScriptToEvaluateOnNewDocument', { source: bridgeExpression });
    const evaluated = await send(socket, 'Runtime.evaluate', { expression: bridgeExpression, returnByValue: true });
    await log(`attached ${target.type} ${target.url} ${JSON.stringify(evaluated.result?.result?.value || {})}`);
  }
}
function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}
async function deliverRevealCommand() {
  let request;
  try { request = JSON.parse(await readFile(commandPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') await log(`command read failed: ${error.message}`); return; }
  if (request?.nonce === lastNonce) return;
  if (!validRevealRequest(request)) {
    lastNonce = request?.nonce || 'invalid';
    await writeFile(resultPath, JSON.stringify({ nonce: request?.nonce, status: 'rejected', at: Date.now() }, null, 2), 'utf8');
    return;
  }
  if (!attached.size) return;
  if (activeReveal?.request.nonce !== request.nonce) {
    const expression = `globalThis.__conversationTreeNativeBridgeV6?.handle(${JSON.stringify(request)})`;
    const deliveries = [];
    for (const [targetId, socket] of attached) {
      if (!isPrimaryCodexPage(socket.__target)) continue;
      try {
        const response = await send(socket, 'Runtime.evaluate', { expression, returnByValue: true });
        deliveries.push({ targetId, url: socket.__target?.url, accepted: response.result?.value === true });
        if (response.result?.value === true) break;
      } catch (error) { deliveries.push({ targetId, url: socket.__target?.url, error: error.message }); }
    }
    if (!deliveries.some(item => item.accepted)) return;
    activeReveal = { request, deliveries, startedAt: Date.now() };
  }
  const completed = [];
  const pollExpression = `(() => { const value=globalThis.__conversationTreeNativeBridgeV6?.lastResult; return value?.request?.nonce===${JSON.stringify(request.nonce)} ? value : null; })()`;
  for (const [targetId, socket] of attached) {
    if (!isPrimaryCodexPage(socket.__target)) continue;
    try {
      const response = await send(socket, 'Runtime.evaluate', { expression: pollExpression, returnByValue: true });
      if (response.result?.value) completed.push({ targetId, url: socket.__target?.url, ...response.result.value });
    } catch {}
  }
  const success = completed.find(item => item.result && item.result !== 'timed-out');
  if (success) {
    lastNonce = request.nonce;
    await writeFile(resultPath, JSON.stringify({ nonce: request.nonce, status: 'delivered', result: success.result,
      deliveries: activeReveal.deliveries, completed, at: Date.now() }, null, 2), 'utf8');
    await log(`reveal completed ${request.nonce}: ${success.result} via ${success.targetId} ${success.url}`);
    activeReveal = null;
    return;
  }
  if (Date.now() - activeReveal.startedAt >= 16_000) {
    lastNonce = request.nonce;
    await writeFile(resultPath, JSON.stringify({ nonce: request.nonce, status: 'timed-out',
      deliveries: activeReveal.deliveries, completed, at: Date.now() }, null, 2), 'utf8');
    await log(`reveal timed out ${request.nonce}`);
    activeReveal = null;
  }
}
async function targets() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`DevTools endpoint returned ${response.status}`);
  return response.json();
}
async function loop() {
  let misses = 0;
  while (!shuttingDown) {
    try {
      const list = await targets(); misses = 0;
      for (const target of list) if (target.type === 'webview' || isPrimaryCodexPage(target)) await attach(target).catch(error => log(`attach failed: ${error.message}`));
      await deliverRevealCommand();
      await save('running');
    } catch (error) {
      misses++;
      await save(misses > 30 ? 'waiting-for-codex' : 'starting', { message: error.message });
      if (misses > 300) {
        if (everAttached) { shuttingDown = true; continue; }
        throw new Error('Codex DevTools endpoint did not become available.');
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { shuttingDown = true; });
await save('starting');
try { await loop(); await save('stopped'); }
catch (error) { await log(error.stack || error.message); await save('failed', { message: error.message }); process.exitCode = 1; }

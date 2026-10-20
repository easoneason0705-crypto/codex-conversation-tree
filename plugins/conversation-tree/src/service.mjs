import { readFile, writeFile, mkdir, readdir, rename, stat, access, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { CodexRpc } from './rpc.mjs';
import { nodesFromTurns } from './model.mjs';
import { config, pluginRoot } from './config.mjs';

export { config, pluginRoot };
const idPattern = /^[a-zA-Z0-9_-]{8,100}$/;
const normalized = path => process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);

export async function resolveCodexExecutable(configured, localAppData = process.env.LOCALAPPDATA) {
  if (configured) { try { await access(configured); return configured; } catch {} }
  if (process.platform === 'win32' && localAppData) {
    const bin = join(localAppData, 'OpenAI', 'Codex', 'bin');
    try {
      const candidates = [];
      for (const entry of await readdir(bin, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const executable = join(bin, entry.name, 'codex.exe');
        try { candidates.push({ executable, modified: (await stat(executable)).mtimeMs }); } catch {}
      }
      candidates.sort((a, b) => b.modified - a.modified);
      if (candidates[0]) return candidates[0].executable;
    } catch {}
  }
  return 'codex';
}
const codexExecutable = await resolveCodexExecutable(config.codexExecutable);

export class TreeService {
  constructor(rpc = new CodexRpc(codexExecutable)) {
    this.rpc = rpc;
    this.cache = new Map();
    this.forkBusy = false;
  }
  async readThread(id) {
    if (!idPattern.test(id)) throw new Error('無效的對話 ID');
    const { thread } = await this.rpc.call('thread/read', { threadId: id });
    if (normalized(thread.cwd) !== normalized(config.workspace)) throw new Error('此原型僅能存取指定工作區的對話');
    return thread;
  }
  async turns(thread, force = false) {
    const modified = thread.path ? (await stat(thread.path)).mtimeMs : Date.now();
    const cached = this.cache.get(thread.id);
    if (!force && cached?.modified === modified) return cached.turns;
    const turns = [];
    let cursor;
    const readTurns = async rpc => {
    do {
      const result = await rpc.call('thread/turns/list', {
        threadId: thread.id, limit: 100, itemsView: 'summary', sortDirection: 'asc', ...(cursor ? { cursor } : {}),
      });
      // Keep only user messages. Preserve their original item position because
      // older Codex chats use `<index>:user` instead of the item UUID in the
      // native prompt-navigation rail.
      for (const turn of result.data) turns.push({ ...turn, items: (turn.items || [])
        .map((item, navigationIndex) => ({ ...item, navigationIndex }))
        .filter(item => item.type === 'userMessage') });
      cursor = result.nextCursor;
    } while (cursor);
    };
    // The independent app-server keeps its own loaded history. A file change
    // must invalidate that server snapshot as well as our local turns cache.
    if (this.rpc.withFreshConnection) await this.rpc.withFreshConnection(readTurns);
    else await readTurns(this.rpc);
    const unique = [...new Map(turns.map(turn => [turn.id, turn])).values()];
    this.cache.set(thread.id, { modified, turns: unique });
    return unique;
  }
  async records(directory) {
    const folder = join(config.dataDirectory, directory);
    await mkdir(folder, { recursive: true });
    const values = [];
    for (const name of await readdir(folder)) {
      if (name.endsWith('.json')) values.push(JSON.parse(await readFile(join(folder, name), 'utf8')));
    }
    return values;
  }
  async save(directory, id, value) {
    const folder = join(config.dataDirectory, directory);
    await mkdir(folder, { recursive: true });
    const name = createHash('sha256').update(id).digest('hex');
    const destination = join(folder, `${name}.json`);
    const temp = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
    await rename(temp, destination);
  }
  async remove(directory, id) {
    const name = createHash('sha256').update(id).digest('hex');
    await rm(join(config.dataDirectory, directory, `${name}.json`), { force: true });
  }
  async snapshot(rootThreadId = config.defaultThreadId) {
    if (!rootThreadId) throw new Error(`尚未設定主線對話 ID。請執行安裝精靈，或編輯 ${config.configPath || '使用者設定檔'}。`);
    const root = await this.readThread(rootThreadId);
    const records = (await this.records('branches')).filter(record => record.rootThreadId === rootThreadId);
    const titles = Object.fromEntries((await this.records('titles')).map(record => [record.id, record.title]));
    const nodes = nodesFromTurns(root.id, await this.turns(root), null, titles);
    const branches = [{ id: root.id, name: '主線', parentNodeId: null }];
    const warnings = [];
    // A chat removed from the Codex sidebar may remain readable in local history.
    // Treat the paginated active-thread list as the deletion authority so stale
    // branch records do not keep producing nodes forever.
    let activeThreads = null;
    try {
      activeThreads = [];
      let cursor;
      do {
        const page = await this.rpc.call('thread/list', { limit: 100, ...(cursor ? { cursor } : {}) });
        activeThreads.push(...page.data.filter(summary => normalized(summary.cwd) === normalized(config.workspace)));
        cursor = page.nextCursor;
      } while (cursor);
    } catch (error) {
      activeThreads = null;
      warnings.push(`活動聊天同步失敗：${error.message}`);
    }
    const activeIds = activeThreads ? new Set(activeThreads.map(thread => thread.id)) : null;
    const candidates = [];
    const candidateIds = new Set();
    if (activeThreads) {
      // Read the real ancestry because list summaries intentionally omit it.
      for (const summary of activeThreads) {
        if (summary.id === rootThreadId) continue;
        try {
          const thread = await this.readThread(summary.id);
          if (thread.forkedFromId && !candidateIds.has(thread.id)) {
            candidates.push(thread); candidateIds.add(thread.id);
          }
        } catch {}
      }
      // A desktop-owned continuation can point at a plugin-created intermediate
      // chat which is not itself in the sidebar. Follow and retain that chain.
      for (let index = 0; index < candidates.length; index++) {
        const parentId = candidates[index].forkedFromId;
        if (!parentId || parentId === rootThreadId || candidateIds.has(parentId)) continue;
        try {
          const parent = await this.readThread(parentId);
          if (parent.forkedFromId) { candidates.push(parent); candidateIds.add(parent.id); }
        } catch {}
      }
    }
    const relevantCandidateIds = new Set();
    const recordedBranchIds = new Set(records.map(record => record.id));
    let ancestryAdded;
    do {
      ancestryAdded = false;
      for (const thread of candidates) {
        if (relevantCandidateIds.has(thread.id)) continue;
        if (thread.forkedFromId === rootThreadId || recordedBranchIds.has(thread.forkedFromId) || relevantCandidateIds.has(thread.forkedFromId)) {
          relevantCandidateIds.add(thread.id); ancestryAdded = true;
        }
      }
    } while (ancestryAdded);
    for (const record of records) {
      const awaitingListPropagation = record.createdAt && Date.now() - record.createdAt < 15_000;
      const hasActiveDescendant = relevantCandidateIds.has(record.id);
      if (activeIds && !activeIds.has(record.id) && !hasActiveDescendant && !awaitingListPropagation) {
        this.cache.delete(record.id);
        try { await this.remove('branches', record.id); }
        catch (error) { warnings.push(`${record.name}：已刪除的分支無法清理本機關係（${error.message}）`); }
        continue;
      }
      try {
        const thread = await this.readThread(record.id);
        nodes.push(...nodesFromTurns(record.id, await this.turns(thread), record, titles));
        branches.push({ ...record, name: record.name });
      } catch (error) { warnings.push(`${record.name}：${error.message}`); }
    }
    // Desktop may fork again when opening a plugin-created chat. Discover those
    // descendants from authoritative thread/read ancestry, never from titles.
    try {
      for (let index = candidates.length - 1; index >= 0; index--) {
        if (!relevantCandidateIds.has(candidates[index].id) || branches.some(branch => branch.id === candidates[index].id)) candidates.splice(index, 1);
      }
      let added;
      do {
        added = false;
        for (let i = candidates.length - 1; i >= 0; i--) {
          const thread = candidates[i];
          const parent = branches.find(b => b.id === thread.forkedFromId);
          if (!parent) continue;
          const turns = await this.turns(thread);
          const parentNodes = nodes.filter(n => n.threadId === parent.id);
          // The inherited prefix must match actual turn IDs in the parent.
          const parentThread = await this.readThread(parent.id);
          const parentTurns = new Set((await this.turns(parentThread)).map(t => t.id));
          let boundary;
          for (const turn of turns) { if (!parentTurns.has(turn.id)) break; boundary = turn.id; }
          if (!boundary) continue;
          const inherited = new Set(turns.slice(0, turns.findIndex(t => t.id === boundary) + 1).map(t => t.id));
          const parentNodeId = parentNodes.filter(n => inherited.has(n.turnId)).at(-1)?.id || parent.parentNodeId;
          if (!parentNodeId) continue;
          const record = { id: thread.id, rootThreadId, parentThreadId: parent.id, parentNodeId,
            baseTurnId: boundary, name: thread.name || '原生分支', discovered: true };
          nodes.push(...nodesFromTurns(thread.id, turns, record, titles));
          branches.push(record);
          candidates.splice(i, 1); added = true;
        }
      } while (added);
    } catch (error) { warnings.push(`原生分支同步失敗：${error.message}`); }
    return {
      rootThreadId, name: root.name || '目前對話', nodes, branches, warnings,
      refreshedAt: Date.now(), pollMs: 3000,
      capabilities: { liveRead: true, fork: true, nativeMessageJump: 'desktop-bridge', nativeBranchSwitch: true },
    };
  }
  async renameNode(rootThreadId, nodeId, title) {
    const snapshot = await this.snapshot(rootThreadId);
    if (!snapshot.nodes.some(node => node.id === nodeId)) throw new Error('找不到節點');
    const clean = title.trim();
    if (!clean || Array.from(clean).length > 60) throw new Error('標題需介於 1–60 個字');
    await this.save('titles', nodeId, { id: nodeId, title: clean });
    return this.snapshot(rootThreadId);
  }
  async revealNode(rootThreadId, nodeId) {
    // Re-read the tree and derive all native IDs server-side. The panel only
    // supplies a node ID, so it cannot ask the desktop bridge to click an
    // unrelated native navigation item.
    this.cache.clear();
    const snapshot = await this.snapshot(rootThreadId);
    const node = snapshot.nodes.find(item => item.id === nodeId);
    if (!node) throw new Error('找不到節點');
    if (![node.threadId, node.turnId, node.messageId].every(value => idPattern.test(value))) {
      throw new Error('此節點缺少原生定位資料');
    }
    const command = {
      source: 'conversation-tree', version: 1, type: 'reveal-user-message',
      nonce: randomUUID(), requestedAt: Date.now(),
      threadId: node.threadId, turnId: node.turnId, messageId: node.messageId,
      messageIndex: node.messageIndex,
    };
    await this.saveRevealCommand(command);
    const resultPath = join(config.dataDirectory, 'desktop-bridge', 'reveal-result.json');
    for (let attempt = 0; attempt < 25; attempt++) {
      await delay(100);
      try {
        const result = JSON.parse(await readFile(resultPath, 'utf8'));
        if (result.nonce !== command.nonce) continue;
        if (result.status !== 'delivered') throw new Error('桌面橋接器拒絕了定位指令');
        return { queued: true, delivered: true, nonce: command.nonce, threadId: command.threadId };
      } catch (error) { if (error.code !== 'ENOENT' && error.message === '桌面橋接器拒絕了定位指令') throw error; }
    }
    throw new Error('桌面橋接器未連接。請完全退出 Codex，再使用桌面的「Codex 對話樹」捷徑重新開啟。');
  }
  async saveRevealCommand(command) {
    const folder = join(config.dataDirectory, 'desktop-bridge');
    await mkdir(folder, { recursive: true });
    const destination = join(folder, 'reveal-command.json');
    const temp = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(command, null, 2), 'utf8');
    await rename(temp, destination);
  }
  async fork(rootThreadId, nodeId, name) {
    if (this.forkBusy) throw new Error('上一個分支仍在建立中');
    this.forkBusy = true;
    try {
      // Re-read the selected history before the mutation; never trust a client-supplied turn ID.
      this.cache.clear();
      const snapshot = await this.snapshot(rootThreadId);
      const node = snapshot.nodes.find(item => item.id === nodeId);
      if (!node?.branchable) throw new Error('只能從已完成回合的最後一則提示詞建立分支');
      const cleanName = name.trim();
      if (!cleanName || cleanName.length > 60) throw new Error('請輸入 1–60 個字的分支名稱');
      const { thread } = await this.rpc.call('thread/fork', {
        threadId: node.threadId, lastTurnId: node.turnId, excludeTurns: true,
      });
      const record = { id: thread.id, rootThreadId, parentThreadId: node.threadId,
        parentNodeId: node.id, baseTurnId: node.turnId, name: cleanName, createdAt: Date.now() };
      try { await this.save('branches', thread.id, record); }
      catch (error) { throw new Error(`分支已建立（${thread.id}），但保存樹關係失敗：${error.message}。請勿重試建立。`); }
      let warning = null;
      try { await this.rpc.call('thread/name/set', { threadId: thread.id, name: `🌿 ${cleanName}` }); }
      catch { warning = `分支已建立，但命名未成功。對話 ID：${thread.id}`; }
      let updated;
      try { updated = await this.snapshot(rootThreadId); }
      catch (error) {
        warning = `分支已建立（${thread.id}），但刷新失敗：${error.message}。請使用更新按鈕，勿重複建立。`;
        updated = { ...snapshot, branches: [...snapshot.branches, record] };
      }
      return { branch: record, warning, snapshot: updated };
    } finally { this.forkBusy = false; }
  }
  close() { this.rpc.close(); }
}

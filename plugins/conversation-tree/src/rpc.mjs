import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

// A separate, documented app-server connection. Never attach to private UI pipes.
export class CodexRpc {
  constructor(executable = process.env.CODEX_CLI_PATH || 'codex') {
    this.executable = executable;
    this.pending = new Map();
    this.sequence = 0;
  }
  async connect() {
    if (this.ready) return this.ready;
    this.ready = this.start();
    return this.ready;
  }
  async start() {
    this.process = spawn(this.executable, ['app-server', '--listen', 'stdio://'], {
      windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.process.stderr.on('data', () => {});
    this.process.stdin.on('error', error => this.fail(error));
    this.process.on('error', error => this.fail(error));
    this.process.on('exit', () => this.fail(new Error('Codex connection closed')));
    createInterface({ input: this.process.stdout }).on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    await this.request('initialize', {
      clientInfo: { name: 'conversation_tree', title: 'Conversation Tree', version: '0.1.0' },
    });
    this.process.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
  }
  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(method === 'thread/fork' ? '建立分支請求逾時，結果未知。請先檢查 Codex 聊天列表，不要重複建立。' : `Codex request timed out: ${method}`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.process.stdin.write(JSON.stringify({ id, method, params }) + '\n', error => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }
  async call(method, params) { await this.connect(); return this.request(method, params); }
  async withFreshConnection(callback) {
    const reader = new CodexRpc(this.executable);
    try { return await callback(reader); }
    finally { reader.close(); }
  }
  fail(error) {
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(error); }
    this.pending.clear();
    this.ready = undefined;
  }
  close() { this.process?.kill(); }
}

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeLocale } from './i18n.mjs';

export const pluginRoot = fileURLToPath(new URL('../', import.meta.url));
export const defaultConfigPath = join(homedir(), '.codex', 'conversation-tree', 'config.json');

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    const locale = normalizeLocale(process.env.CONVERSATION_TREE_LOCALE);
    throw new Error(locale === 'en' ? `Could not read configuration ${path}: ${error.message}`
      : locale === 'zh-CN' ? `无法读取设置文件 ${path}：${error.message}`
        : `無法讀取設定檔 ${path}：${error.message}`);
  }
}

function expandPath(value, base) {
  if (!value) return null;
  const expanded = value.replace(/^~(?=$|[\\/])/, homedir());
  return isAbsolute(expanded) ? resolve(expanded) : resolve(base, expanded);
}

export async function loadConfig() {
  const explicit = process.env.CONVERSATION_TREE_CONFIG;
  const candidates = explicit
    ? [resolve(explicit)]
    : [defaultConfigPath, join(pluginRoot, 'config.local.json'), join(pluginRoot, 'config.json')];
  let raw = null;
  let source = null;
  for (const path of candidates) {
    raw = await readJson(path);
    if (raw) { source = path; break; }
  }
  const base = source ? dirname(source) : process.cwd();
  const dataDirectory = expandPath(
    process.env.CONVERSATION_TREE_DATA_DIR || raw?.dataDirectory,
    base,
  ) || join(homedir(), '.codex', 'conversation-tree', 'data');
  return {
    workspace: expandPath(process.env.CONVERSATION_TREE_WORKSPACE || raw?.workspace, base) || resolve(process.cwd()),
    defaultThreadId: process.env.CONVERSATION_TREE_ROOT_THREAD_ID || raw?.defaultThreadId || null,
    dataDirectory,
    codexExecutable: expandPath(process.env.CONVERSATION_TREE_CODEX_EXECUTABLE || raw?.codexExecutable, base),
    locale: normalizeLocale(process.env.CONVERSATION_TREE_LOCALE || raw?.locale),
    configPath: source,
  };
}

export const config = await loadConfig();

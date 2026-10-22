import { translate } from './i18n.mjs';

export function cleanPrompt(text) {
  // Strip the attachment wrapper only when the host's explicit request marker exists.
  const marker = '## My request:';
  const start = text.indexOf(marker);
  return (start >= 0 ? text.slice(start + marker.length) : text).trim();
}

export function promptTitle(text, locale = 'zh-TW') {
  const line = cleanPrompt(text).replace(/\s+/g, ' ').replace(/^[#*>\s]+/, '');
  return Array.from(line).slice(0, 22).join('') + (Array.from(line).length > 22 ? '…' : '') || translate(locale, 'attachmentTitle');
}

export function nodesFromTurns(threadId, turns, branch, titles = {}, locale = 'zh-TW') {
  let start = 0;
  if (branch) {
    const index = turns.findIndex(turn => turn.id === branch.baseTurnId);
    if (index < 0) throw new Error(translate(locale, 'branchBoundaryMissing'));
    start = index + 1;
  }
  const nodes = [];
  let parentId = branch?.parentNodeId || null;
  for (const turn of turns.slice(start)) {
    const messages = (turn.items || []).filter(item => item.type === 'userMessage');
    for (let index = 0; index < messages.length; index++) {
      const item = messages[index];
      const text = cleanPrompt(item.content.filter(part => part.type === 'text').map(part => part.text).join('\n'));
      const id = `${threadId}:${item.id}`;
      nodes.push({
        id, parentId, threadId, turnId: turn.id, messageId: item.id,
        messageIndex: Number.isInteger(item.navigationIndex) ? item.navigationIndex : index,
        text: text || translate(locale, 'attachmentOnly'), title: titles[id] || promptTitle(text, locale),
        status: turn.status, branchId: threadId, createdAt: turn.startedAt,
        // The underlying fork boundary is a completed turn, not an individual steer message.
        branchable: turn.status === 'completed' && index === messages.length - 1,
      });
      parentId = id;
    }
  }
  return nodes;
}

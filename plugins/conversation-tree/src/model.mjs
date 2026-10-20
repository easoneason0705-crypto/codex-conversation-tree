export function cleanPrompt(text) {
  // Strip the attachment wrapper only when the host's explicit request marker exists.
  const marker = '## My request:';
  const start = text.indexOf(marker);
  return (start >= 0 ? text.slice(start + marker.length) : text).trim();
}

export function promptTitle(text) {
  const line = cleanPrompt(text).replace(/\s+/g, ' ').replace(/^[#*>\s]+/, '');
  return Array.from(line).slice(0, 22).join('') + (Array.from(line).length > 22 ? '…' : '') || '圖片或附件';
}

export function nodesFromTurns(threadId, turns, branch, titles = {}) {
  let start = 0;
  if (branch) {
    const index = turns.findIndex(turn => turn.id === branch.baseTurnId);
    if (index < 0) throw new Error('分支的來源回合不在歷史中；停止連線以免顯示錯誤關係。');
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
        text: text || '（此提示詞只有圖片或附件）', title: titles[id] || promptTitle(text),
        status: turn.status, branchId: threadId, createdAt: turn.startedAt,
        // The underlying fork boundary is a completed turn, not an individual steer message.
        branchable: turn.status === 'completed' && index === messages.length - 1,
      });
      parentId = id;
    }
  }
  return nodes;
}

export function installConversationTreeBridge() {
  const scope = globalThis;
  const marker = '__conversationTreeNativeBridgeV4';
  const storageKey = 'conversationTreePendingRevealV4';
  if (scope[marker]?.installed) return scope[marker];
  const state = { installed: true, observer: null, timer: null, lastResult: null, autoOpenTimer: null };
  scope[marker] = state;

  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
  const findButton = ({ turnId, messageId, messageIndex }) => {
    const expected = new Set([`${turnId}:${messageId}`, `${turnId}:${messageIndex}:user`]);
    return Array.from(scope.document.querySelectorAll('[data-thread-user-message-navigation-item-id]'))
      .find(element => expected.has(element.dataset.threadUserMessageNavigationItemId)) || null;
  };
  const finish = (result, request) => {
    state.observer?.disconnect();
    state.observer = null;
    scope.clearTimeout(state.timer);
    state.timer = null;
    state.lastResult = { result, request, at: Date.now() };
    try { scope.sessionStorage.removeItem(storageKey); } catch {}
  };
  const reveal = request => {
    const button = findButton(request);
    if (!button) return false;
    button.click(); // Delegate loading, virtual-list scrolling and highlight to Codex.
    finish('clicked-native-rail', request);
    return true;
  };
  const handle = request => {
    if (request?.source !== 'conversation-tree' || request.version !== 1 ||
      request.type !== 'reveal-user-message' ||
      ![request.threadId, request.turnId, request.messageId].every(validId) ||
      !Number.isInteger(request.messageIndex) || request.messageIndex < 0) return false;
    state.observer?.disconnect();
    scope.clearTimeout(state.timer);
    try { scope.sessionStorage.setItem(storageKey, JSON.stringify({ ...request, requestedAt: Date.now() })); } catch {}
    if (reveal(request)) return true;
    state.observer = new scope.MutationObserver(() => reveal(request));
    state.observer.observe(scope.document.documentElement, { childList: true, subtree: true });
    state.timer = scope.setTimeout(() => finish('timed-out', request), 15000);
    return true;
  };
  state.handle = handle;
  scope.addEventListener('message', event => {
    if (event.source === scope) return;
    handle(event.data);
  });
  // Once this chat contains a conversation-tree app result, reopen its app tab
  // automatically on bridged Codex launches. The native host still owns tab
  // creation; this only clicks the same "open app in tab" control a user sees.
  if (typeof scope.setInterval === 'function') {
    const autoOpenTree = () => {
      const tab = Array.from(scope.document.querySelectorAll('button[role="tab"]'))
        .find(button => button.getAttribute('aria-label') === '對話樹');
      if (tab) {
        if (tab.getAttribute('aria-selected') !== 'true') tab.click();
        scope.clearInterval(state.autoOpenTimer); state.autoOpenTimer = null;
        return true;
      }
      const statuses = Array.from(scope.document.querySelectorAll('[role="status"]'));
      const status = statuses.reverse().find(element => element.textContent?.trim() === '已打开 對話樹');
      const open = status?.parentElement?.parentElement?.querySelector?.('button[aria-label="在标签页中打开应用"]');
      if (!open) return false;
      open.click();
      return true;
    };
    state.autoOpenTimer = scope.setInterval(autoOpenTree, 500);
    scope.setTimeout(() => { scope.clearInterval(state.autoOpenTimer); state.autoOpenTimer = null; }, 30000);
  }
  try {
    const pending = JSON.parse(scope.sessionStorage.getItem(storageKey));
    if (Date.now() - pending.requestedAt < 30000) handle(pending);
    else scope.sessionStorage.removeItem(storageKey);
  } catch {}
  return state;
}

export const bridgeExpression = `(${installConversationTreeBridge.toString()})()`;

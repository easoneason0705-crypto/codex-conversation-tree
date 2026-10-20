export function installConversationTreeBridge() {
  const scope = globalThis;
  const marker = '__conversationTreeNativeBridgeV6';
  if (scope[marker]?.installed) {
    return scope[marker];
  }
  for (const legacyMarker of ['__conversationTreeNativeBridgeV4', '__conversationTreeNativeBridgeV5']) {
    const legacy = scope[legacyMarker];
    legacy?.observer?.disconnect?.();
    scope.clearTimeout?.(legacy?.timer);
    scope.clearInterval?.(legacy?.autoOpenTimer);
  }
  const state = { installed: true, lastResult: null, inFlight: false, activeNonce: null };
  scope[marker] = state;

  const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
  const expectedIds = ({ turnId, messageId, messageIndex }) =>
    new Set([`${turnId}:${messageId}`, `${turnId}:${messageIndex}:user`]);
  const findContentUnit = request => {
    const expected = expectedIds(request);
    return Array.from(scope.document.querySelectorAll('[data-content-search-unit-key]'))
      .find(element => expected.has(element.dataset.contentSearchUnitKey)) || null;
  };
  const scrollLoadedUnit = request => {
    const unit = findContentUnit(request);
    if (!unit) return false;
    unit.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const bubble = unit.querySelector?.('[data-user-message-bubble]') || unit;
    bubble.animate?.([
      { outline: '2px solid transparent', outlineOffset: '3px' },
      { outline: '2px solid rgba(255,255,255,.72)', outlineOffset: '3px' },
      { outline: '2px solid transparent', outlineOffset: '3px' },
    ], { duration: 900, easing: 'ease-out' });
    return true;
  };
  const findNativeReveal = request => {
    const host = scope.document.querySelector('[data-thread-find-target="conversation"]')
      || scope.document.querySelector('[data-content-search-unit-key]');
    if (!host) return null;
    const fiberKey = Object.keys(host).find(key => key.startsWith('__reactFiber$'));
    if (!fiberKey) return null;
    let root = host[fiberKey];
    while (root?.return) root = root.return;
    const expected = expectedIds(request);
    const stack = [root];
    const seen = new Set();
    while (stack.length && seen.size < 100000) {
      const fiber = stack.pop();
      if (!fiber || seen.has(fiber)) continue;
      seen.add(fiber);
      const props = fiber.memoizedProps;
      if (typeof props?.onRevealItem === 'function') {
        let items = props.items;
        try { if (!Array.isArray(items) && typeof props.getItems === 'function') items = props.getItems(); } catch {}
        const item = Array.isArray(items) && items.find(candidate => expected.has(candidate?.id));
        if (item) return { callback: props.onRevealItem, item };
      }
      if (fiber.sibling) stack.push(fiber.sibling);
      if (fiber.child) stack.push(fiber.child);
    }
    return null;
  };
  const finish = (result, request) => {
    if (state.activeNonce !== request.nonce) return;
    state.inFlight = false;
    state.activeNonce = null;
    state.lastResult = { result, request, at: Date.now() };
  };
  const reveal = request => {
    if (scrollLoadedUnit(request)) {
      finish('scrolled-loaded-message', request);
      return true;
    }
    const native = findNativeReveal(request);
    if (!native || state.inFlight) return false;
    state.inFlight = true;
    Promise.resolve(native.callback(native.item)).then(() => {
      scrollLoadedUnit(request);
      finish('invoked-native-reveal', request);
    }, () => {
      if (state.activeNonce === request.nonce) {
        state.inFlight = false;
        state.activeNonce = null;
      }
    });
    return true;
  };
  const handle = request => {
    if (request?.source !== 'conversation-tree' || request.version !== 1 ||
      request.type !== 'reveal-user-message' ||
      ![request.nonce, request.threadId, request.turnId, request.messageId].every(validId) ||
      !Number.isInteger(request.messageIndex) || request.messageIndex < 0) return false;
    if (state.lastResult?.request?.nonce === request.nonce || state.activeNonce === request.nonce) return true;
    if (state.inFlight) return false;
    const host = scope.document.querySelector('[data-thread-find-target="conversation"]')
      || scope.document.querySelector('[data-thread-user-message-navigation-content]')
      || scope.document.querySelector('[data-content-search-unit-key]');
    if (!host) return false;
    state.activeNonce = request.nonce;
    if (reveal(request)) return true;
    state.activeNonce = null;
    return false;
  };
  state.handle = handle;
  scope.addEventListener('message', event => {
    if (event.source === scope) return;
    handle(event.data);
  });
  return state;
}

export const bridgeExpression = `(${installConversationTreeBridge.toString()})()`;

import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrimaryCodexPage } from './bridge-target.mjs';

test('only the canonical Codex chat page receives reveal commands', () => {
  assert.equal(isPrimaryCodexPage({ type: 'page', url: 'app://-/index.html' }), true);
  assert.equal(isPrimaryCodexPage({ type: 'page', url: 'app://-/index.html?initialRoute=%2Favatar-overlay' }), false);
  assert.equal(isPrimaryCodexPage({ type: 'page', url: 'app://-/detached-window.html?initialRoute=%2Fdetached-window' }), false);
  assert.equal(isPrimaryCodexPage({ type: 'webview', url: 'codex-sandbox://mcp-app-example/' }), false);
});

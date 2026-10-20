# Conversation Tree desktop bridge

This bridge lets the MCP App ask the native Codex prompt-navigation rail to reveal a user message. It does not replace or edit the signed Microsoft Store package.

The plugin posts only `threadId`, `turnId`, and `messageId` to the top-level Codex page. The injected listener validates those IDs, waits for the matching native rail button, and clicks that button. Codex keeps responsibility for history hydration, virtual-list scrolling, and highlight animation.

## Run

1. Fully exit Codex.
2. Double-click `launch-codex-with-bridge.cmd`, or run `launch-codex-with-bridge.ps1` from PowerShell.
3. Open the conversation-tree panel and click a populated node.

The launcher enables Chromium DevTools on a random loopback-only port and starts a hidden local Node runner. Codex can briefly restart itself during startup; the runner waits through that restart. Status, logs, and any launcher error are written under the configured `dataDirectory/desktop-bridge/` (by default `%USERPROFILE%\.codex\conversation-tree\data\desktop-bridge`).

The desktop shortcut starts PowerShell with a hidden window. If Codex is still running or startup fails, it shows a dialog and writes `launcher-error.txt` instead of briefly flashing a console window.

Use `stop-bridge.ps1` to stop the runner. Closing Codex also removes the injected code; the Store installation remains unchanged. The launcher must be used again after every complete Codex restart.

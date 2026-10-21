# Conversation Tree for Codex Desktop

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

Conversation Tree turns local Codex conversations into an interactive visual tree. Follow the main conversation from left to right, explore branches below their parent prompts, jump back to earlier prompts, and create real Codex conversation forks directly from the panel.

Current stable release: **0.2.30**.

> Native prompt navigation currently supports Codex Desktop on Windows. The plugin panel and conversation data remain on your computer and are not sent to third-party services.

> Conversation Tree is an independent open-source project. It is not created, supported, certified, or endorsed by OpenAI.

## Features

- Organizes local Codex conversations by project and working directory.
- Remembers the selected main conversation for every project.
- Switches to the correct chat and uses Codex's native prompt navigation when you click a node.
- Creates real Codex conversation forks from completed prompts, then lets you continue in the native composer.
- Discovers descendant branches created later by Codex Desktop.
- Removes stale tree nodes after their corresponding branch chats are deleted.
- Lets you drag nodes by their circular handle without changing the tree structure; the rest of each node remains available for navigation.
- Supports bounded canvas panning, mouse-wheel and trackpad zooming, and adjustable panel height.
- Saves node titles, positions, zoom level, canvas position, and panel height locally.

## Requirements

- Windows 10 or Windows 11.
- Codex Desktop installed and signed in.
- [Node.js 22 LTS](https://nodejs.org/) or later, with `node` and `npm` available in PowerShell.
- Git.
- At least one existing Codex chat in the project you want to view.

Check the required commands in PowerShell:

```powershell
node --version
npm --version
git --version
codex --version
```

## Quick installation

### 1. Download the source

```powershell
git clone https://github.com/easoneason0705-crypto/codex-conversation-tree.git
Set-Location .\codex-conversation-tree
```

You can also download the source ZIP from GitHub Releases, extract it, and open PowerShell in that folder.

### 2. Run the setup wizard

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

The wizard will:

1. Check Node.js, npm, and the Codex CLI.
2. Ask which project folder to use initially.
3. List the Codex chats in that project and let you choose the initial main conversation.
4. Create your personal configuration at `%USERPROFILE%\.codex\conversation-tree\config.json`.
5. Install dependencies, build the panel, and run the tests.
6. Add this repository as a local Codex marketplace, then install and enable the plugin.
7. Create a **Codex Conversation Tree** shortcut on your desktop.

For repeatable installation, provide both values directly:

```powershell
.\scripts\setup.ps1 `
  -Workspace 'D:\Projects\my-project' `
  -RootThreadId 'your-main-chat-id'
```

`RootThreadId` is a chat identifier, not a chat title. Omit it if you do not know the ID; the wizard will show the available chats.

### 3. Start Codex with the dedicated shortcut

1. Save any text that has not been sent.
2. Fully quit every running Codex process.
3. Double-click **Codex Conversation Tree** on the desktop.
4. If the launcher detects Codex running normally, choose **Yes** so it can close and restart it.

The shortcut starts that Codex session with a random loopback-only `127.0.0.1` DevTools port, then starts the local desktop bridge. It does not modify the Microsoft Store package or permanently expose a remote-debugging port.

### 4. Open the panel

Confirm that **對話樹 · Conversation Tree** is enabled in Codex, then either:

- Open **Conversation Tree** from the plugin entry beside the chat; or
- Type `Open the conversation tree panel` in the chat.

The panel synchronizes every three seconds. You can also select **Refresh** manually.

The first menu at the top selects a Codex project; the second selects a main conversation within that project. Projects are detected from each chat's working directory, so the plugin does not need to be reinstalled for every project.

## Usage

### Jump to a prompt

Click any node. If it belongs to another chat, Codex first switches to that chat. After the native chat loads, the desktop bridge invokes the existing prompt-navigation rail to reveal the matching prompt.

If Codex switches chats but does not reveal the prompt, it was usually started without the dedicated shortcut. See [Troubleshooting](docs/TROUBLESHOOTING.md).

### Create a branch

1. Move the pointer over a node whose turn has completed.
2. Select **+ Create branch**.
3. Enter a branch name.
4. The plugin creates a real Codex fork and asks the host to open the new chat.
5. Continue by typing the next prompt in the native composer.

The new prompt appears below its parent node after it is sent. If Codex creates another descendant chat while continuing, the plugin follows `forkedFromId` and reconnects it to the same tree.

### Switch projects or main conversations

1. Select a project from the first menu at the top of the panel.
2. Select one of that project's main chats from the second menu.
3. The corresponding tree loads immediately, and the selection is remembered when the panel is reopened.

The MCP App sandbox cannot directly read which project is currently selected in the Codex sidebar. Each project therefore needs to be selected in the panel once. This explicit choice is portable and does not depend on a private project-selection API.

### Return to the main conversation

Select **Return to main** from a branch view. This opens the selected tree's main chat; it does not merge or delete a branch.

### Adjust the layout

- **Pan the canvas:** Hold and drag an empty area. The canvas has boundaries and cannot be moved indefinitely; its initial view centers the main line.
- **Move a node:** Drag the circular handle at the node's upper-left corner. The rest of the node remains clickable for navigation.
- **Zoom:** Place the pointer over the canvas and use the mouse wheel or trackpad. The supported range is 40%–250%.
- **Resize the panel:** Drag the bottom border of the canvas.
- **Rename a node:** Use the node rename action. This changes only the displayed title, not the original prompt.

Visual adjustments are stored in the plugin data directory and never change the conversation tree structure.

## Use another project or main conversation

You do not need to rerun the setup wizard. Once another project has at least one Codex chat, it appears in the project menu. Select the project and then choose its main conversation from the adjacent menu.

The installation values `workspace` and `defaultThreadId` are initial defaults only. After you select a tree in the panel, the plugin stores the last choice in `preferences.json` and keeps a separate main conversation selection for each working directory.

Configuration format:

```json
{
  "workspace": "D:\\Projects\\my-project",
  "defaultThreadId": "00000000-0000-0000-0000-000000000000",
  "dataDirectory": "C:\\Users\\name\\.codex\\conversation-tree\\data",
  "codexExecutable": null
}
```

Use `CONVERSATION_TREE_CONFIG` to select another configuration file, or override individual fields with:

- `CONVERSATION_TREE_WORKSPACE`
- `CONVERSATION_TREE_ROOT_THREAD_ID`
- `CONVERSATION_TREE_DATA_DIR`
- `CONVERSATION_TREE_CODEX_EXECUTABLE`

## Why a 127.0.0.1 page may appear

The development preview opens a temporary local page on `127.0.0.1`, which refers to your own computer. Opening this address does not send data to the internet. Normal use should open the native plugin panel inside Codex. The browser preview is intended for development and diagnostics and cannot fully emulate native chat switching or prompt navigation.

## Data and privacy

- Codex manages the original chat content. The plugin reads local chats through the local Codex App Server and groups them by working directory.
- The plugin does not rewrite chat history or create Git worktrees.
- Branch relationships, project selections, display titles, and layout data are stored under `%USERPROFILE%\.codex\conversation-tree\data` by default.
- The desktop bridge listens only on a loopback address and validates the chat, turn, and message IDs in navigation requests.
- User settings, chat IDs, local data, and logs are excluded from Git releases.

See [Architecture](docs/ARCHITECTURE.md) for the full data flow and trust boundaries.

## Update

```powershell
Set-Location .\codex-conversation-tree
git pull
.\scripts\setup.ps1 -Workspace 'your-project-path' -RootThreadId 'your-main-chat-id'
```

After updating, fully quit Codex and reopen it from the **Codex Conversation Tree** shortcut.

## Uninstall

Keep layout data and settings:

```powershell
.\scripts\uninstall.ps1
```

Also remove the local layout data:

```powershell
.\scripts\uninstall.ps1 -RemoveLocalData -Confirm
```

Uninstalling the plugin does not delete Codex chats or project source code.

## Development and verification

```powershell
Set-Location .\plugins\conversation-tree
npm ci
npm run build
npm test
npm run package
```

Run the complete release checks from the repository root:

```powershell
.\scripts\check-release.ps1
```

Start the local browser preview:

```powershell
Set-Location .\plugins\conversation-tree
npm run preview
```

See [Architecture](docs/ARCHITECTURE.md) for the project structure, communication flow, and design constraints. See [Contributing](CONTRIBUTING.md) for contribution instructions.

## Known limitations

- Native prompt navigation depends on the current Codex Desktop prompt rail and Electron DevTools behavior. A future Codex update may require bridge changes.
- The native navigation bridge currently supports Windows only. Without the bridge, the plugin can still display trees, create branches, and switch chats.
- Large conversation trees do not yet provide collapsing or search.
- The active user configuration selects one main conversation at a time.

## Disclaimer

Conversation Tree is an independent, community-developed open-source project. It is not affiliated with, sponsored by, supported by, certified by, or endorsed by OpenAI. “OpenAI” and “Codex” are trademarks of their respective owner.

The desktop bridge is experimental and may stop working after Codex Desktop updates. Use it only with conversations and computers that you are authorized to access.

## License

[MIT License](LICENSE)

## References

- [OpenAI: Build plugins](https://developers.openai.com/plugins/build/plugins)
- [OpenAI: Plugin submission and distribution](https://developers.openai.com/plugins/deploy/submission)
- [Model Context Protocol Apps](https://modelcontextprotocol.io/docs/extensions/apps)

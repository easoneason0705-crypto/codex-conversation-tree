# Conversation Tree for Codex Desktop

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

[![最新版本](https://img.shields.io/github/v/release/easoneason0705-crypto/codex-conversation-tree?label=release)](https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/latest)
[![CI](https://github.com/easoneason0705-crypto/codex-conversation-tree/actions/workflows/ci.yml/badge.svg)](https://github.com/easoneason0705-crypto/codex-conversation-tree/actions/workflows/ci.yml)
[![MIT 授權](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Windows 平台](https://img.shields.io/badge/platform-Windows-0078D4.svg)

Conversation Tree 把 Codex 聊天中的使用者提示詞整理成可互動的樹。主線由左向右展開，分支向下延伸；點擊節點可以回到對應聊天與提示詞，並可從既有節點建立真正的 Codex 對話分支。

<p align="center">
  <img src="docs/assets/conversation-tree-demo.gif" width="400" alt="Conversation Tree 自動生成節點、跳轉到提示詞、建立分支並編輯樹狀版面">
</p>

<p align="center"><em>自動生成節點、原生提示詞跳轉、真實 Codex 分支與視覺化樹狀編輯。</em></p>

**[下載最新版本](https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/latest)** · [安裝說明](#最簡單的安裝方式) · [疑難排解](docs/TROUBLESHOOTING.md)

目前正式版本：**0.2.30**。

> 目前的原生訊息定位橋接只支援 Windows 版 Codex Desktop。插件面板與對話資料都在本機運行，不會把聊天內容傳送到第三方服務。

> Conversation Tree 是獨立開發的開源專案，並非由 OpenAI 建立、支援、認證或認可。

## 示範內容

上方 GIF 展示了完整的核心流程：

1. 新提示詞會自動生成對應的樹節點。
2. 點擊節點會回到對應的 Codex 聊天與提示詞位置。
3. 可以從已完成的提示詞建立真實的 Codex 對話分支。
4. 可以自由調整節點與畫布位置，而不改變真實對話結構。

## 功能

- 依 Codex 工作目錄整理所有本機項目，並在面板中切換項目與主線聊天。
- 為每個項目記住最後選擇的主線，重新打開面板時自動恢復。
- 點擊節點後切換到所屬聊天，並使用 Codex 原生提示詞導覽條定位。
- 從已完成的提示詞建立 Codex 對話分支，之後直接在原生聊天框續寫。
- 自動發現由 Codex 桌面版再次建立的後代分支。
- 刪除 Codex 分支聊天後，自動清除樹上的失效節點。
- 使用節點左上角的圓形拖曳把手自由拖動，只改變視覺位置，不改變父子關係；節點本體的任何位置都可直接點擊跳轉。
- 在空白處按住並拖動可查看有限畫布；首次開啟時主線自動位於中央。
- 滑鼠滾輪或觸摸板縮放；拖動畫布底邊調整面板高度。
- 保存節點標題、位置、縮放倍率與畫布高度。
- 自動跟隨 Codex 的淺色或深色主題，也可持久選擇「自動／淺色／深色」。

## 系統需求

- Windows 10 或 Windows 11。
- 已安裝並登入 Codex Desktop。
- [Node.js 22 LTS](https://nodejs.org/) 或更新版本，`node` 與 `npm` 可從 PowerShell 執行。
- Git。
- 目標專案至少已有一個 Codex 聊天。

可先在 PowerShell 檢查：

```powershell
node --version
npm --version
git --version
codex --version
```

## 最簡單的安裝方式

### 1. 下載程式碼

```powershell
git clone https://github.com/easoneason0705-crypto/codex-conversation-tree.git
Set-Location .\codex-conversation-tree
```

也可以從 GitHub Releases 下載 Source code ZIP，解壓後在該資料夾開啟 PowerShell。

### 2. 執行安裝精靈

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

精靈會依序：

1. 檢查 Node.js、npm 與 Codex CLI。
2. 詢問首次打開時使用的專案資料夾。
3. 列出該專案的 Codex 聊天，讓你選擇初始主線聊天。
4. 在 `%USERPROFILE%\.codex\conversation-tree\config.json` 建立個人設定。
5. 安裝依賴、建置面板並執行測試。
6. 把本儲存庫加入 Codex 本機 marketplace，安裝並啟用插件。
7. 在桌面建立「Codex 對話樹」捷徑。

也可一次傳入參數，適合重複部署：

```powershell
.\scripts\setup.ps1 `
  -Workspace 'D:\Projects\my-project' `
  -RootThreadId '你的主線聊天-ID'
```

`RootThreadId` 是聊天識別碼，不是聊天標題。若不知道 ID，省略此參數，安裝精靈會列出可選聊天。

### 3. 用專用捷徑啟動 Codex

1. 儲存尚未送出的文字。
2. 完全退出目前正在運行的 Codex。
3. 雙擊桌面的 **Codex 對話樹**。
4. 如果啟動器偵測到一般方式啟動的 Codex，選擇「是」讓它關閉後重開。

專用捷徑會用隨機的 `127.0.0.1` DevTools 埠啟動當次 Codex 程序，再啟動本機橋接器。它不會修改 Microsoft Store 安裝包，也不會永久開放遠端連線。

### 4. 打開面板

在 Codex 中確認「對話樹 · Conversation Tree」已啟用，然後：

- 從對話旁的插件入口打開「對話樹」；或
- 在聊天中輸入「打開對話樹面板」。

面板每三秒同步一次，也可點擊「更新」。

面板頂部有兩個選單：左側選擇 Codex 項目，右側選擇該項目的主線聊天。項目由聊天的工作目錄自動辨識，不需要為每個項目重裝插件。

## 使用教學

### 跳到提示詞

直接點擊節點。若節點屬於另一個聊天，Codex 會先切換聊天；原生聊天載入後，桌面橋接會觸發左側小白條的既有定位行為。

若只切換聊天但沒有定位，通常是 Codex 沒有透過專用捷徑啟動。請參考 [疑難排解](docs/TROUBLESHOOTING.md)。

### 建立分支

1. 將滑鼠移到已完成回合的節點上。
2. 點擊「＋ 建立分支」。
3. 輸入分支名稱。
4. 插件會建立真正的 Codex fork，並請宿主打開新聊天。
5. 直接在原生聊天框輸入下一個提示詞。

新提示詞送出後會出現在父節點下方。若 Codex 為了續寫建立了另一個後代聊天，插件會沿 `forkedFromId` 自動接回原樹。

### 切換項目或主線

1. 在面板頂部第一個選單選擇項目。
2. 在第二個選單選擇該項目的主線聊天。
3. 面板會立即載入對應的樹，之後重新打開時也會記住每個項目的選擇。

插件無法從 MCP App 沙箱直接讀取 Codex 左側目前選中的項目，因此第一次切換需在面板選一次。這個明確選擇不依賴私人 API，也能隨 GitHub 版本一起部署到其他電腦。

### 回到主線

在分支視圖點擊「回到主線」。這會打開目前所選樹的主線聊天，不會合併或刪除任何分支。

### 調整版面

- **移動畫布：**在空白處按住並拖動。畫布四周設有邊界，不會無限移動；重新開啟時主線位於中央。
- **移動節點：**拖動節點左上角的圓形把手。節點其他位置保留給點擊跳轉。
- **縮放：**將游標放在畫布中，使用滑鼠滾輪或觸摸板；範圍為 40%–250%。
- **調整高度：**拖動畫布最下方的邊框。
- **重新命名：**使用節點操作中的改名功能；只改顯示標題，不修改原始提示詞。

所有視覺調整都由插件保存在本機，不會改變聊天的樹狀結構。

### 切換外觀

使用「更新」旁邊的外觀選單。「自動」優先跟隨 Codex 宿主主題；宿主沒有提供主題時跟隨作業系統。「淺色」和「深色」會覆寫宿主主題，並在重新開啟面板後保留。

## 使用另一個專案或主線

不需要重新執行安裝精靈。只要該專案已在 Codex 建立至少一個聊天，它就會出現在面板頂部的項目選單；選擇項目後，再從相鄰選單選擇主線聊天。

安裝時的 `workspace` 與 `defaultThreadId` 只作為第一次使用的預設值。第一次在面板完成選擇後，插件會把最後選擇寫入資料目錄中的 `preferences.json`，並為每個工作目錄分別保存主線聊天。

設定檔格式：

```json
{
  "workspace": "D:\\Projects\\my-project",
  "defaultThreadId": "00000000-0000-0000-0000-000000000000",
  "dataDirectory": "C:\\Users\\name\\.codex\\conversation-tree\\data",
  "codexExecutable": null
}
```

也可用 `CONVERSATION_TREE_CONFIG` 指定另一份設定檔，或用下列環境變數覆寫單一欄位：

- `CONVERSATION_TREE_WORKSPACE`
- `CONVERSATION_TREE_ROOT_THREAD_ID`
- `CONVERSATION_TREE_DATA_DIR`
- `CONVERSATION_TREE_CODEX_EXECUTABLE`

## 為什麼會看到 127.0.0.1 網址

插件開發預覽會在 `127.0.0.1` 開一個臨時本機網頁。`127.0.0.1` 代表你的電腦本身，資料沒有因此上傳到網際網路。正式使用應從 Codex 的插件面板打開；瀏覽器預覽只用於開發與診斷，無法完整模擬原生聊天切換和提示詞定位。

## 資料與隱私

- 聊天內容由 Codex 本身管理；插件透過本機 Codex App Server 讀取本機聊天，並按每個聊天的工作目錄分組。
- 插件不改寫聊天歷史，也不建立 Git worktree。
- 分支關係、項目選擇、標題和版面資料預設位於 `%USERPROFILE%\.codex\conversation-tree\data`。
- 桌面橋接只監聽 loopback 位址，並驗證定位指令中的聊天、回合與訊息 ID。
- 使用者設定、聊天 ID、本機資料與記錄檔不會包含在 Git 發佈內容中。

更完整的資料流與信任邊界見 [架構說明](docs/ARCHITECTURE.md)。

## 更新

```powershell
Set-Location .\codex-conversation-tree
git pull
.\scripts\setup.ps1 -Workspace '你的專案路徑' -RootThreadId '你的主線聊天-ID'
```

更新後請完全退出 Codex，再從「Codex 對話樹」捷徑重開。

## 移除

保留版面資料與設定：

```powershell
.\scripts\uninstall.ps1
```

連同本機版面資料一起刪除：

```powershell
.\scripts\uninstall.ps1 -RemoveLocalData -Confirm
```

移除插件不會刪除 Codex 聊天或專案原始碼。

## 開發與驗證

```powershell
Set-Location .\plugins\conversation-tree
npm ci
npm run build
npm test
npm run package
```

完整發佈檢查：

```powershell
.\scripts\check-release.ps1
```

本機瀏覽器預覽：

```powershell
Set-Location .\plugins\conversation-tree
npm run preview
```

專案結構、通訊流程與設計限制見 [架構說明](docs/ARCHITECTURE.md)，貢獻方式見 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 已知限制

- 原生訊息定位依賴 Codex Desktop 目前的小白條與 Electron DevTools 行為；Codex 更新後可能需要調整橋接器。
- 原生定位橋接目前只支援 Windows。沒有橋接器時，插件仍可顯示樹、建立分支與切換聊天。
- 大型聊天樹尚未提供折疊與搜尋。
- 同一時間的使用者設定只指定一個主線聊天。

## 授權

[MIT License](LICENSE)

## 聲明

Conversation Tree 是由社群獨立開發的開源專案，與 OpenAI 不存在隸屬、合作、贊助、認證或官方認可關係。「OpenAI」與「Codex」是其各自權利人的商標。

桌面橋接器屬於實驗性功能，可能在 Codex Desktop 更新後失效。請只在你有權存取的電腦與聊天中使用本專案。

## 參考

- [OpenAI：Build plugins](https://developers.openai.com/plugins/build/plugins)
- [OpenAI：Plugin submission and distribution](https://developers.openai.com/plugins/deploy/submission)
- [Model Context Protocol Apps](https://modelcontextprotocol.io/docs/extensions/apps)



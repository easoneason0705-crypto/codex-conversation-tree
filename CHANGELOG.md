# Changelog

本專案遵循 [Semantic Versioning](https://semver.org/)。

## [0.2.30] - 2026-10-21

### 新增

- 對話樹面板可按 Codex 工作目錄切換項目，再選擇該項目的主線聊天；不再把所有視窗固定到安裝時設定的同一棵樹。
- 每個項目會記住最後選擇的主線聊天，重新打開面板時恢復上次選擇。

### 修正

- 對聊天清單按 ID 去重，並使用已保存的分支關係排除分支聊天，避免分支被誤列為另一棵主線樹。
- 升級插件與面板資源版本，確保 Codex 不會繼續載入 0.2.29 快取。

## [0.2.29] - 2026-10-20

### 修正

- 修正節點拖曳的上邊界計算，允許節點移動到畫布上方保留的世界空間，不再被看不見的水平線擋住。

## [0.2.28] - 2026-10-20

### 修正

- 將對話樹面板明確限制為 inline 顯示，避免 Codex 在重新載入歷史 `tree_open` 結果時把每個面板建立成 fullscreen 頁籤。

## [0.2.27] - 2026-10-20

### 修正

- 移除面板資源的強制 fullscreen 偏好，並兼容舊 UI 資源 URI，避免歷史 `tree_open` 結果重新載入時建立多個對話樹頁籤。
- 切換聊天後才送出原生提示詞定位命令，修正分支節點點擊後定位失敗。

## [0.2.26] - 2026-10-20

### 改進

- 首次開啟對話樹時自動將橫向主線置於畫布中央，背景刷新不會改變使用者目前視野。
- 可在空白處按住並拖動有限畫布；四周保留可查看空間，移動到世界邊界後停止。
- 縮放後維持游標下方的內容位置，並沿用 40%–250% 的縮放範圍。

## [0.2.24] - 2026-10-20

### 修正

- 原生提示詞定位不再對小白條 DOM 執行程式化點擊，改用 Codex 內部的訊息定位回調或直接滾動已載入訊息，避免節點點擊建立重複的對話樹頁籤。
- 桌面橋接器只把定位要求交給一個主聊天頁，不再向 detached window、avatar overlay 等頁面廣播；同一 nonce 最多執行一次，也不再保留可能延遲重播的 DOM 監聽器。

## [0.2.23] - 2026-10-20

### 修正

- 同一聊天內點擊節點只執行原生提示詞定位，不再重複呼叫聊天深連結；只有主線與分支之間真正切換聊天時才開啟目標聊天，避免 Codex 成批複製對話樹分頁。

## [0.2.22] - 2026-10-20

### 修正

- 內部刷新與互動工具不再聲明可建立 UI 面板的資源地址，避免每次自動刷新或節點操作被 Codex 誤判為重新開啟對話樹。

## [0.2.21] - 2026-10-20

### 修正

- 移除桌面橋接器的自動開啟面板行為。它會在多個 Codex 頁面各自建立一個對話樹分頁；現在只會由使用者明確開啟面板。
- 重新注入橋接器時清理舊版頁面殘留的自動開啟計時器。

## [0.2.20] - 2026-10-20

### 修正

- 將節點拖動完全移至左上角的圓形拖曳把手。節點其餘區域不再參與拖動判斷，專用於點擊後切換聊天並定位提示詞。

## [0.2.19] - 2026-10-20

### 修正

- 修正長按拖動與節點點擊衝突：只有實際移動節點後才會取消點擊；單純點擊或停留按住後放開都會送出原生提示詞定位。
- 節點點擊時立即顯示「正在定位對應提示詞」回饋，方便確認已收到操作。

## [0.2.18] - 2026-10-20

### 修正

- 桌面橋接器直接監聽對話樹面板的受驗證 DevTools 事件並持久化定位請求，避開 Codex MCP App 私有工具呼叫未回應與 sandbox 網路封鎖。
- 已以實際插件面板節點點擊驗證：橋接器收到新請求並調用 Codex 原生小白條定位。

## [0.2.17] - 2026-10-20

### 修正

- 以捷徑啟動的桌面橋接器提供受限的本機 loopback 定位端點，面板節點點擊不再依賴新版 Codex 未回應的 MCP App 私有工具呼叫。
- 端點只監聽 `127.0.0.1`、僅接受 Codex sandbox 的跨域請求，並驗證定位資料後才寫入原生導航命令。

## [0.2.16] - 2026-10-20

### 修正

- 對 MCP App 面板資源 URI 加入版本號；更新插件後，Codex 會載入同版本的面板程式，不會重用已快取的舊 iframe。
- 確保節點點擊的定位修正可在每台完成更新的電腦上生效。

## [0.2.15] - 2026-10-20

### 修正

- 在切換聊天前持久化節點定位請求，避免 Codex 卸載面板後請求遺失。
- 使用版本化插件資源，避免既有 MCP App 面板繼續執行舊版前端。
- 橋接器改為等待實際完成的原生定位結果，避免僅送達命令就回報成功。

## [0.2.14] - 2026-10-20

第一個公開正式版本。

### 功能

- 顯示真實 Codex 主線與分支提示詞。
- 使用原生聊天分支與聊天切換能力。
- Windows 桌面橋接支援點擊節點後原生訊息定位。
- 支援長按拖動節點、滾輪／觸摸板縮放及可調畫布高度。
- 保存節點標題與個人化版面。
- 自動同步 Codex 原生後代分支與已刪除分支。

### 修正

- 相容新舊聊天的原生導覽 ID。
- 修正分支後續提示詞不同步、新節點生成於畫布外與節點重疊。
- 移除示例資料與介紹區，只保留真實對話。
- 移除套件中的個人路徑、聊天 ID 和固定 Node/Codex 執行檔路徑。

[0.2.30]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.30
[0.2.29]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.29
[0.2.28]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.28
[0.2.27]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.27
[0.2.26]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.26
[0.2.24]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.24
[0.2.23]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.23
[0.2.22]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.22
[0.2.21]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.21
[0.2.20]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.20
[0.2.19]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.19
[0.2.18]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.18
[0.2.17]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.17
[0.2.16]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.16
[0.2.14]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.14
[0.2.15]: https://github.com/easoneason0705-crypto/codex-conversation-tree/releases/tag/v0.2.15

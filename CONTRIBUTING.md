# 貢獻指南

開發需要 Windows、Codex Desktop、Node.js 22 與 npm。

```powershell
git clone <repository-url>
Set-Location .\codex-conversation-tree\plugins\conversation-tree
npm ci
npm run build
npm test
```

請勿提交 `config.json`、聊天 ID、使用者資料目錄、日誌或含真實聊天內容的截圖。

## 修改原則

- 樹的視覺座標與真實父子關係分開處理。
- 不以標題或提示詞文字推測分支關係。
- 前端只傳節點 ID，敏感的原生 ID 由伺服器重新解析。
- 桌面橋接必須限制於 loopback，且不得修改 Codex 安裝檔。
- 新增資料格式時需考慮舊版資料相容。

提交前執行：

```powershell
.\scripts\check-release.ps1
```

PR 請說明問題、最終行為、測試方式，以及是否影響桌面橋接或本機資料格式。

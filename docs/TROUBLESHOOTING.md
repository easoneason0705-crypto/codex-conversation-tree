# 疑難排解

## 面板沒有出現

1. 執行 `codex plugin list`，確認 `conversation-tree` 已啟用。
2. 重新執行 `scripts\setup.ps1`。
3. 完全退出 Codex，包括通知區中的背景程序，再重新開啟。
4. 確認 `plugins\conversation-tree\dist\server.mjs` 與 `dist\panel.html` 存在。

## 點擊節點沒有反應

最常見原因是 Codex 從一般捷徑啟動。完全退出後，改用桌面的「Codex 對話樹」捷徑。

檢查橋接狀態：

```powershell
$config = Get-Content "$HOME\.codex\conversation-tree\config.json" -Raw | ConvertFrom-Json
Get-Content (Join-Path $config.dataDirectory 'desktop-bridge\state.json')
```

正常狀態應為 `running`，並且 `attachedTargets` 大於 0。詳細記錄在同資料夾的 `state.json.log` 與 `launcher-run.log`。

## 可以切換聊天，但沒有跳到提示詞

- 等待聊天完整載入後再試一次。
- 點擊面板的「更新」，再點節點。
- 插件會依序嘗試新舊聊天的兩種原生導覽 ID。
- Codex 更新可能改變原生導覽元素。請附上版本和已去識別化的橋接記錄提交 issue。

## 顯示錯誤項目的樹

使用面板頂部第一個選單選擇 Codex 項目，再從第二個選單選擇主線聊天。插件會為每個項目記住選擇。Codex 目前不會向 MCP App 公開左側正在查看的項目，所以第一次需要在面板明確選擇。

如果新建立的項目或聊天尚未出現，點擊「更新」重新讀取項目清單。仍未出現時，確認該聊天已送出至少一則提示詞，並完全退出 Codex 後重新開啟 0.2.30 插件。

若更新後仍看到 0.2.29 的舊介面，代表 Codex 還在使用舊插件快取。重新執行 `scripts\setup.ps1`，完全退出所有 Codex 背景程序，再從「Codex 對話樹」捷徑啟動。

## 安裝精靈列不出聊天

- 確認專案路徑與 Codex 開啟聊天時使用的工作目錄一致。
- 先在該專案中建立並完成至少一個聊天。
- 確認 `codex app-server --listen stdio://` 能啟動。
- 如果 Codex CLI 不在 PATH，可在設定檔的 `codexExecutable` 填入實際路徑。

## 分支建立後沒有節點

空分支不顯示假的提示詞節點。切換到新聊天，在原生聊天框送出第一個提示詞；面板最慢約三秒後同步，也可手動按「更新」。

## 刪除聊天後節點仍存在

活動聊天清單同步失敗時，插件會保守保留分支，避免誤刪。確認 Codex App Server 可用後刷新。新建分支另有約 15 秒同步寬限。

## 節點重疊或跑出畫布

先刷新面板。新版會將新支線第一個節點放在父節點下方並移動到可視範圍；既有的手動偏移仍會保留。若要重置版面，可先備份再刪除資料目錄中的 UI 儲存資料，分支和 Codex 聊天不受影響。

## PowerShell 阻止執行腳本

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

## 如何回報問題

請提供 Conversation Tree、Codex Desktop 與 Windows 版本，重現步驟、預期和實際結果，以及與問題時間相近的橋接狀態。提交前移除聊天文字、使用者名稱、專案路徑和其他私密資訊。

# 發佈 0.2.29

## 發佈前檢查

在儲存庫根目錄執行：

```powershell
.\scripts\check-release.ps1
```

確認以下項目：

- `package.json`、portable manifest 與 Codex 相容 manifest 都是 0.2.29。
- 依賴能以 `npm ci` 乾淨安裝。
- 面板與 MCP Server 能重新建置。
- 全部單元、佈局與協定測試通過。
- `packages/conversation-tree` 能重新產生，且不含使用者設定。
- PowerShell 腳本無語法錯誤。
- 原始碼不含開發電腦的絕對路徑。

仍需在 Windows Codex Desktop 手動驗證：

1. 從專用捷徑啟動 Codex。
2. 打開 Conversation Tree 原生面板。
3. 點擊一個主線節點和一個分支節點，確認聊天切換及原生定位。
4. 建立測試分支並送出第一個提示詞，確認節點同步。
5. 拖動節點、縮放與調整畫布高度。
6. 刪除測試分支聊天，確認節點消失。

## 建立 Git 與標籤

```powershell
git init
git add .
git commit -m "Release Conversation Tree 0.2.29"
git branch -M main
git remote add origin https://github.com/easoneason0705-crypto/codex-conversation-tree.git
git push -u origin main
git tag -a v0.2.29 -m "Conversation Tree 0.2.29"
git push origin v0.2.29
```

## GitHub Release 內容

標題：`Conversation Tree 0.2.29`

建議說明：

```markdown
Conversation Tree 0.2.29 是第一個公開正式版本，為 Codex Desktop 提供可互動的本機對話樹。

### 主要功能
- 顯示真實主線、分支與後續提示詞。
- 點擊節點切換聊天，並在 Windows 上使用 Codex 原生導覽定位提示詞。
- 從節點建立真正的 Codex 對話分支。
- 長按拖動節點、滾輪／觸摸板縮放、調整畫布高度。
- 自動同步原生後代分支與已刪除分支。

### 安裝
請閱讀 README 的「最簡單的安裝方式」。首次安裝需要 Windows、Codex Desktop、Node.js 22 和 Git。

### 已知限制
原生提示詞定位橋接目前只支援 Windows，且可能受後續 Codex Desktop UI 更新影響。
```

建立 Release 時附上 tag `v0.2.29`，可使用 GitHub 自動產生的 source `.zip` 與 `.tar.gz`。目前無需上傳包含個人設定的二進位包。

## 發佈後

- 確認 README 與 CHANGELOG 的儲存庫網址仍正確。
- 在乾淨 Windows 使用者帳戶依 README 重新安裝一次。
- 啟用 GitHub 的 Private vulnerability reporting。
- 確認 Actions 的 Windows CI 通過。

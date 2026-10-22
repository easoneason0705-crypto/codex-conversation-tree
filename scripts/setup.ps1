[CmdletBinding()]
param(
  [string]$Workspace,
  [string]$RootThreadId,
  [ValidateSet('en', 'zh-CN', 'zh-TW')]
  [string]$Language,
  [string]$DataDirectory = (Join-Path $HOME '.codex\conversation-tree\data'),
  [switch]$SkipInstall,
  [switch]$NoShortcut
)

$ErrorActionPreference = 'Stop'

if (-not $Language) {
  Write-Host "Select language / 选择语言 / 選擇語言" -ForegroundColor Cyan
  Write-Host '  1. English'
  Write-Host '  2. 简体中文'
  Write-Host '  3. 繁體中文'
  $languageChoice = Read-Host 'Enter 1, 2, or 3 / 请输入 1、2 或 3 / 請輸入 1、2 或 3 [3]'
  $Language = switch ($languageChoice) { '1' { 'en' } '2' { 'zh-CN' } default { 'zh-TW' } }
}

$messages = @{
  en = @{
    workspacePrompt='Enter the full path of the project to use with Conversation Tree'; chatsHeader='Chats in this workspace:';
    threadPrompt='Paste the chat ID to use as the mainline'; ready='Conversation Tree 0.2.33 is ready.'; config='Configuration:';
    restart='Fully quit Codex, then reopen it with the “Codex Conversation Tree” desktop shortcut.'; shortcut='Codex Conversation Tree.lnk';
    restartNoShortcut='Fully quit Codex, then run desktop-bridge\launch-codex-with-bridge.cmd.';
    shortcutDescription='Start Codex with the Conversation Tree desktop bridge'; cacheBusy='Codex is using the previous plugin cache. Fully quit Codex, then run the same setup.ps1 command again.';
    nodeRequired='Node.js 22 LTS is required and must be available on PATH.'; codexRequired='The Codex desktop app is required and must be available on PATH.';
    nodeVersion='Node.js 22 or newer is required. Installed version:'; workspaceMissing='The project folder does not exist:';
    listFailed='Could not list Codex chats.'; invalidThread='The mainline chat ID is invalid.'; npmFailed='Installing dependencies failed.';
    buildFailed='Building the plugin failed.'; testsFailed='Plugin tests failed.'
  }
  'zh-CN' = @{
    workspacePrompt='请输入要建立对话树的项目完整路径'; chatsHeader='此工作区的聊天：'; threadPrompt='请粘贴要作为主线的聊天 ID';
    ready='Conversation Tree 0.2.33 已准备完成。'; config='设置文件：'; restart='请完全退出 Codex，然后使用桌面的“Codex 对话树”快捷方式重新打开。';
    shortcut='Codex 对话树.lnk'; shortcutDescription='以 Conversation Tree 桌面桥接启动 Codex'; cacheBusy='Codex 正在使用旧插件缓存。请完全退出 Codex，再运行同一个 setup.ps1 命令。'
    restartNoShortcut='请完全退出 Codex，再运行 desktop-bridge\launch-codex-with-bridge.cmd。';
    nodeRequired='需要 Node.js 22 LTS，并且 node 与 npm 必须已加入 PATH。'; codexRequired='需要 Codex 桌面版，并且 codex 必须已加入 PATH。';
    nodeVersion='需要 Node.js 22 或更新版本。当前版本：'; workspaceMissing='项目文件夹不存在：'; listFailed='无法列出 Codex 聊天。';
    invalidThread='主线聊天 ID 无效。'; npmFailed='安装依赖失败。'; buildFailed='构建插件失败。'; testsFailed='插件测试失败。'
  }
  'zh-TW' = @{
    workspacePrompt='請輸入要建立對話樹的專案完整路徑'; chatsHeader='此工作區的聊天：'; threadPrompt='請貼上要作為主線的聊天 ID';
    ready='Conversation Tree 0.2.33 已準備完成。'; config='設定檔：'; restart='請完全退出 Codex，然後使用桌面的「Codex 對話樹」捷徑重新開啟。';
    shortcut='Codex 對話樹.lnk'; shortcutDescription='以 Conversation Tree 桌面橋接啟動 Codex'; cacheBusy='Codex 正在使用舊插件快取。請完全退出 Codex，再執行同一個 setup.ps1 命令。'
    restartNoShortcut='請完全退出 Codex，再執行 desktop-bridge\launch-codex-with-bridge.cmd。';
    nodeRequired='需要 Node.js 22 LTS，並且 node 與 npm 必須已加入 PATH。'; codexRequired='需要 Codex 桌面版，並且 codex 必須已加入 PATH。';
    nodeVersion='需要 Node.js 22 或更新版本。目前版本：'; workspaceMissing='專案資料夾不存在：'; listFailed='無法列出 Codex 聊天。';
    invalidThread='主線聊天 ID 無效。'; npmFailed='安裝相依套件失敗。'; buildFailed='建置插件失敗。'; testsFailed='插件測試失敗。'
  }
}
function T([string]$Key) { return $messages[$Language][$Key] }

$repoRoot = Split-Path -Parent $PSScriptRoot
$pluginRoot = Join-Path $repoRoot 'plugins\conversation-tree'
$configDirectory = Join-Path $HOME '.codex\conversation-tree'
$configPath = Join-Path $configDirectory 'config.json'

function Require-Command([string]$Name, [string]$Help) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) { throw "$Name is required. $Help" }
  return $command.Source
}

$node = Require-Command 'node' (T 'nodeRequired')
$null = Require-Command 'npm' (T 'nodeRequired')
$codex = Require-Command 'codex' (T 'codexRequired')
$nodeMajor = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 22) { throw "$(T 'nodeVersion') $(& $node --version)" }

if (-not $Workspace) { $Workspace = Read-Host (T 'workspacePrompt') }
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) { throw "$(T 'workspaceMissing') $Workspace" }
$Workspace = (Resolve-Path -LiteralPath $Workspace).Path

if (-not $RootThreadId) {
  Write-Host "`n$(T 'chatsHeader')" -ForegroundColor Cyan
  & $node (Join-Path $PSScriptRoot 'list-threads.mjs') --workspace $Workspace
  if ($LASTEXITCODE -ne 0) { throw (T 'listFailed') }
  $RootThreadId = Read-Host "`n$(T 'threadPrompt')"
}
if ($RootThreadId -notmatch '^[a-zA-Z0-9_-]{8,100}$') { throw (T 'invalidThread') }

New-Item -ItemType Directory -Force -Path $configDirectory, $DataDirectory | Out-Null
$configJson = [ordered]@{
  workspace = $Workspace
  defaultThreadId = $RootThreadId
  dataDirectory = (Resolve-Path -LiteralPath $DataDirectory).Path
  codexExecutable = $null
  locale = $Language
} | ConvertTo-Json
[System.IO.File]::WriteAllText($configPath, $configJson, [System.Text.UTF8Encoding]::new($false))

Push-Location $pluginRoot
try {
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw (T 'npmFailed') }
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw (T 'buildFailed') }
  & npm test
  if ($LASTEXITCODE -ne 0) { throw (T 'testsFailed') }
} finally { Pop-Location }

if (-not $SkipInstall) {
  $marketplaceResult = (& $codex plugin marketplace add $repoRoot 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -and $marketplaceResult -notmatch 'already|exists|已存在') { throw $marketplaceResult.Trim() }
  $installResult = (& $codex plugin add 'conversation-tree@conversation-tree-local' --json 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -and $installResult -match 'access|denied|拒绝访问|拒絕存取') {
    throw (T 'cacheBusy')
  }
  if ($LASTEXITCODE -ne 0 -and $installResult -notmatch 'already|installed|已安裝') { throw $installResult.Trim() }
}

if (-not $NoShortcut) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop (T 'shortcut')))
  $shortcut.TargetPath = Join-Path $repoRoot 'desktop-bridge\launch-codex-with-bridge.cmd'
  $shortcut.WorkingDirectory = $repoRoot
  $shortcut.Description = T 'shortcutDescription'
  $shortcut.Save()
}

Write-Host "`n$(T 'ready')" -ForegroundColor Green
Write-Host "$(T 'config')$configPath"
if ($NoShortcut) { Write-Host (T 'restartNoShortcut') }
else { Write-Host (T 'restart') }

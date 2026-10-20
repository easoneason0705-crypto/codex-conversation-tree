[CmdletBinding()]
param(
  [string]$Workspace,
  [string]$RootThreadId,
  [string]$DataDirectory = (Join-Path $HOME '.codex\conversation-tree\data'),
  [switch]$SkipInstall,
  [switch]$NoShortcut
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pluginRoot = Join-Path $repoRoot 'plugins\conversation-tree'
$configDirectory = Join-Path $HOME '.codex\conversation-tree'
$configPath = Join-Path $configDirectory 'config.json'

function Require-Command([string]$Name, [string]$Help) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) { throw "$Name is required. $Help" }
  return $command.Source
}

$node = Require-Command 'node' 'Install Node.js 22 LTS and add it to PATH.'
$null = Require-Command 'npm' 'Install Node.js 22 LTS and add it to PATH.'
$codex = Require-Command 'codex' 'Install or update the Codex desktop app.'
$nodeMajor = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 22) { throw "Node.js 22 or newer is required; found $(& $node --version)." }

if (-not $Workspace) { $Workspace = Read-Host '請輸入要建立對話樹的專案完整路徑' }
if (-not (Test-Path -LiteralPath $Workspace -PathType Container)) { throw "Workspace does not exist: $Workspace" }
$Workspace = (Resolve-Path -LiteralPath $Workspace).Path

if (-not $RootThreadId) {
  Write-Host "`n此工作區的聊天：" -ForegroundColor Cyan
  & $node (Join-Path $PSScriptRoot 'list-threads.mjs') --workspace $Workspace
  if ($LASTEXITCODE -ne 0) { throw 'Unable to list Codex chats.' }
  $RootThreadId = Read-Host "`n請貼上要作為主線的聊天 ID"
}
if ($RootThreadId -notmatch '^[a-zA-Z0-9_-]{8,100}$') { throw 'The root chat ID is invalid.' }

New-Item -ItemType Directory -Force -Path $configDirectory, $DataDirectory | Out-Null
$configJson = [ordered]@{
  workspace = $Workspace
  defaultThreadId = $RootThreadId
  dataDirectory = (Resolve-Path -LiteralPath $DataDirectory).Path
  codexExecutable = $null
} | ConvertTo-Json
[System.IO.File]::WriteAllText($configPath, $configJson, [System.Text.UTF8Encoding]::new($false))

Push-Location $pluginRoot
try {
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Plugin build failed.' }
  & npm test
  if ($LASTEXITCODE -ne 0) { throw 'Plugin tests failed.' }
} finally { Pop-Location }

if (-not $SkipInstall) {
  $marketplaceResult = (& $codex plugin marketplace add $repoRoot 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -and $marketplaceResult -notmatch 'already|exists|已存在') { throw $marketplaceResult.Trim() }
  $installResult = (& $codex plugin add 'conversation-tree@conversation-tree-local' --json 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -and $installResult -match 'access|denied|拒绝访问|拒絕存取') {
    throw 'Codex 正在使用舊插件快取。請完全退出 Codex，再執行同一個 setup.ps1 命令。'
  }
  if ($LASTEXITCODE -ne 0 -and $installResult -notmatch 'already|installed|已安裝') { throw $installResult.Trim() }
}

if (-not $NoShortcut) {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $desktop 'Codex 對話樹.lnk'))
  $shortcut.TargetPath = Join-Path $repoRoot 'desktop-bridge\launch-codex-with-bridge.cmd'
  $shortcut.WorkingDirectory = $repoRoot
  $shortcut.Description = '以 Conversation Tree 桌面橋接啟動 Codex'
  $shortcut.Save()
}

Write-Host "`nConversation Tree 0.2.29 已準備完成。" -ForegroundColor Green
Write-Host "設定檔：$configPath"
if ($NoShortcut) { Write-Host '請完全退出 Codex，再執行 desktop-bridge\launch-codex-with-bridge.cmd。' }
else { Write-Host '請完全退出 Codex，然後使用桌面的「Codex 對話樹」捷徑重新開啟。' }

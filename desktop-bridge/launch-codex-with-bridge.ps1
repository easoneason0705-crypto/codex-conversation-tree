param(
  [int]$Port = 0,
  [string]$ConfigPath = (Join-Path $HOME '.codex\conversation-tree\config.json')
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Conversation Tree config was not found: $ConfigPath`nRun scripts\setup.ps1 first."
}
$treeConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $ConfigPath | ConvertFrom-Json
if (-not $treeConfig.dataDirectory) { throw "Config is missing dataDirectory: $ConfigPath" }
$stateDirectory = Join-Path $treeConfig.dataDirectory 'desktop-bridge'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$launcherError = Join-Path $stateDirectory 'launcher-error.txt'
$launcherLog = Join-Path $stateDirectory 'launcher-run.log'
Remove-Item -LiteralPath $launcherError -Force -ErrorAction SilentlyContinue
function Write-LauncherLog([string]$Message) {
  Add-Content -LiteralPath $launcherLog -Value "$(Get-Date -Format o) $Message" -Encoding UTF8
}
Write-LauncherLog 'launcher started'
trap {
  $_ | Out-String | Set-Content -LiteralPath $launcherError -Encoding UTF8
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message, '對話樹啟動器', 'OK', 'Error') | Out-Null
  exit 1
}

$running = Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -notmatch '--type=' }
if ($running) {
  if ($running.CommandLine -match '--remote-debugging-port=') {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show('Codex 對話樹橋接已經啟動。', '對話樹啟動器', 'OK', 'Information') | Out-Null
    exit 0
  }
  Add-Type -AssemblyName PresentationFramework
  $choice = [System.Windows.MessageBox]::Show(
    "目前 Codex 是從一般入口啟動，因此節點無法跳轉。`n`n要現在關閉並以對話樹橋接重新啟動嗎？未送出的輸入內容可能會遺失。",
    '重新啟動 Codex 對話樹', 'YesNo', 'Warning')
  if ($choice -ne 'Yes') { exit 0 }
  Write-LauncherLog 'user approved restart'
  # Electron child processes can keep the single-instance lock alive after the
  # main window exits. Stop the complete Codex process family and require five
  # consecutive empty checks before launching with bridge flags.
  $emptyChecks = 0
  for ($attempt = 0; $attempt -lt 100; $attempt++) {
    $codexProcesses = Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue
    foreach ($process in $codexProcesses) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 100
    $remaining = Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue
    if ($remaining) { $emptyChecks = 0 } else { $emptyChecks++ }
    if ($emptyChecks -ge 5) { break }
  }
  if ($remaining) { throw '無法關閉目前的 Codex，請手動完全退出後再試一次。' }
  Write-LauncherLog 'all Codex processes stopped'
}

$package = Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
if (-not $package) { throw 'The OpenAI.Codex package is not installed.' }
$app = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $app)) { throw "Codex executable was not found: $app" }

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw 'Node.js 22 was not found on PATH.' }

if ($Port -eq 0) {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start(); $Port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port; $listener.Stop()
}
$state = Join-Path $stateDirectory 'state.json'
$runner = Join-Path $PSScriptRoot 'bridge-runner.mjs'

# A previous bridge may wait on a port belonging to an earlier Codex process.
# Stop only the PID recorded by this workspace after verifying its command.
if (Test-Path -LiteralPath $state) {
  try {
    $previousPid = (Get-Content -Raw -LiteralPath $state | ConvertFrom-Json).runnerPid
    $previous = Get-CimInstance Win32_Process -Filter "ProcessId=$previousPid" -ErrorAction SilentlyContinue
    if ($previous -and $previous.CommandLine -match [regex]::Escape($runner)) {
      Stop-Process -Id $previousPid -Force
    }
  } catch {}
}

$runnerArgument = '"' + $runner + '"'
$stateArgument = '"' + $state + '"'
Start-Process -FilePath $node -ArgumentList @($runnerArgument, "$Port", $stateArgument) -WindowStyle Hidden
Start-Process -FilePath $app -ArgumentList @(
  '--remote-debugging-address=127.0.0.1',
  "--remote-debugging-port=$Port"
)
$debugReady = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
  Start-Sleep -Milliseconds 250
  try {
    $version = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/version" -TimeoutSec 1
    if ($version.webSocketDebuggerUrl) { $debugReady = $true; break }
  } catch {}
}
if (-not $debugReady) {
  try {
    $runnerProcess = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match [regex]::Escape($runner) -and $_.CommandLine -match "\s$Port\s" }
    foreach ($process in $runnerProcess) { Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue }
  } catch {}
  throw "Codex 未在預期時間開放本機橋接埠 $Port。請不要從一般 Codex 入口再次開啟；確認所有 Codex 視窗已關閉後，再使用「Codex 對話樹」捷徑。"
}
Write-LauncherLog "Codex launched with verified bridge port $Port"
Write-Host "Codex started with the verified conversation-tree desktop bridge on loopback port $Port."
Write-Host "Bridge status: $state"

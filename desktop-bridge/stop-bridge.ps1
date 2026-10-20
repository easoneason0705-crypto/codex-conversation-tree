param([string]$ConfigPath = (Join-Path $HOME '.codex\conversation-tree\config.json'))
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ConfigPath)) { Write-Host "Config was not found: $ConfigPath"; exit 0 }
$treeConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $ConfigPath | ConvertFrom-Json
$state = Join-Path $treeConfig.dataDirectory 'desktop-bridge\state.json'
if (-not (Test-Path -LiteralPath $state)) { Write-Host 'No bridge state file exists.'; exit 0 }
$info = Get-Content -LiteralPath $state -Raw | ConvertFrom-Json
$process = Get-Process -Id $info.runnerPid -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.Id; Write-Host "Stopped bridge runner $($process.Id)." }
else { Write-Host 'The bridge runner is not running.' }

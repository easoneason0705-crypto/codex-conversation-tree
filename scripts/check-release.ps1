$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$pluginRoot = Join-Path $repoRoot 'plugins\conversation-tree'
$version = (Get-Content -Raw -Encoding UTF8 (Join-Path $pluginRoot 'package.json') | ConvertFrom-Json).version
foreach ($manifest in @('plugin.json', '.codex-plugin\plugin.json')) {
  $manifestVersion = (Get-Content -Raw -Encoding UTF8 (Join-Path $pluginRoot $manifest) | ConvertFrom-Json).version
  if ($manifestVersion -ne $version) { throw "Version mismatch: $manifest is $manifestVersion, package.json is $version" }
}
$trackedText = Get-ChildItem $repoRoot -Recurse -File | Where-Object {
  $_.FullName -notmatch '[\\/](node_modules|dist|packages|\.data|\.git)[\\/]'
}
$privatePatterns = @(
  ('D:' + '\\Codex Conversation Tree'),
  ('C:' + '\\Users\\' + 'eason'),
  ('D:' + '/Node.js')
)
foreach ($pattern in $privatePatterns) {
  $matches = $trackedText | Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue
  if ($matches) { throw "Private path remains in release source: $($matches[0].Path):$($matches[0].LineNumber)" }
}
foreach ($script in Get-ChildItem (Join-Path $repoRoot 'desktop-bridge'), (Join-Path $repoRoot 'scripts') -Filter *.ps1 -File) {
  $tokens = $null; $errors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile($script.FullName, [ref]$tokens, [ref]$errors)
  if ($errors.Count) { throw "PowerShell syntax error in $($script.FullName): $($errors[0].Message)" }
}
Push-Location $pluginRoot
try {
  & npm ci
  if ($LASTEXITCODE) { throw 'npm ci failed.' }
  & npm run check
  if ($LASTEXITCODE) { throw 'Release checks failed.' }
} finally { Pop-Location }
Write-Host "Conversation Tree $version release checks passed." -ForegroundColor Green

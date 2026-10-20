[CmdletBinding(SupportsShouldProcess)]
param([switch]$RemoveLocalData)
$ErrorActionPreference = 'Stop'
& codex plugin remove 'conversation-tree@conversation-tree-local'
& codex plugin marketplace remove 'conversation-tree-local'
$shortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Codex 對話樹.lnk'
if (Test-Path -LiteralPath $shortcut) { Remove-Item -LiteralPath $shortcut -Force }
if ($RemoveLocalData) {
  $directory = Join-Path $HOME '.codex\conversation-tree'
  if ($PSCmdlet.ShouldProcess($directory, 'Remove Conversation Tree settings and layout data')) {
    Remove-Item -LiteralPath $directory -Recurse -Force -ErrorAction SilentlyContinue
  }
}
Write-Host 'Conversation Tree has been removed. Codex chats and project files were not changed.'

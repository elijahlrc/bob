# Zips a built game folder (dist) for an itch.io HTML upload: index.html at the top level, forward-slash paths,
# compressed files, no directory entries (the `tar -a` zip was refused). Usage:
#   pwsh -File itch-zip.ps1 -Dist <dist folder> -Out <zip file>
param(
  [Parameter(Mandatory = $true)][string]$Dist,
  [Parameter(Mandatory = $true)][string]$Out
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$root = (Resolve-Path $Dist).Path
if (-not (Test-Path (Join-Path $root 'index.html'))) { throw "No index.html in $root" }
if (Test-Path $Out) { Remove-Item $Out }
$zip = [System.IO.Compression.ZipFile]::Open($Out, 'Create')
try {
  Get-ChildItem $root -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, 'Optimal')
  }
} finally { $zip.Dispose() }
$z = [System.IO.Compression.ZipFile]::OpenRead($Out)
try { $z.Entries | ForEach-Object { '{0}  {1}' -f $_.FullName, $_.Length } } finally { $z.Dispose() }
'{0}: {1} bytes' -f $Out, (Get-Item $Out).Length

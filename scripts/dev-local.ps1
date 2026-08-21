param(
  [int]$Port = 5173,
  [switch]$ForceInstall,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

function Get-ToolPath {
  param(
    [string]$Name,
    [string]$FallbackPath
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($command) {
    return $command.Source
  }

  if (Test-Path $FallbackPath) {
    return $FallbackPath
  }

  throw "Cannot find $Name. Install Node.js 22.13+ or run this from Codex Desktop with the bundled runtime available."
}

$nodePath = Get-ToolPath "node" (Join-Path $HOME ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe")
$nodeDir = Split-Path $nodePath -Parent
$env:PATH = "$nodeDir;$env:PATH"

$pnpmPath = Get-ToolPath "pnpm" (Join-Path $HOME ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd")

Write-Host "Using Node: $(& $nodePath --version)"
Write-Host "Using pnpm: $(& $pnpmPath --version)"

if (-not $SkipInstall -and ($ForceInstall -or -not (Test-Path (Join-Path $projectRoot "node_modules")))) {
  Write-Host "Installing project dependencies..."
  & $pnpmPath install --config.confirmModulesPurge=false
}

$env:WRANGLER_WRITE_LOGS = "false"
$env:WRANGLER_LOG_PATH = ".wrangler/wrangler.log"

$vitePath = Join-Path $projectRoot "node_modules\.bin\vite.cmd"
if (-not (Test-Path $vitePath)) {
  throw "Cannot find local Vite. Run .\scripts\dev-local.ps1 -ForceInstall first."
}

Write-Host "Starting local dev server on http://127.0.0.1:$Port"
& $vitePath --host 127.0.0.1 --port $Port

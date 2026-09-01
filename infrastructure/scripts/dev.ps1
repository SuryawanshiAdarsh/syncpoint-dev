#requires -Version 5.1
<#
.SYNOPSIS
  Start infrastructure and tail logs. Ctrl+C stops tailing; containers keep running.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

& (Join-Path $PSScriptRoot 'up.ps1')

Write-Host ''
Write-Host 'tailing logs (Ctrl+C to stop tailing; containers keep running)' -ForegroundColor Cyan
docker compose logs -f --tail=200

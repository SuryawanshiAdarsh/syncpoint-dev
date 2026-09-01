#requires -Version 5.1
<#
.SYNOPSIS
  Layer richer demo data on top of demo.sql so the dashboard looks like an
  active tenant (multiple controls covered, integration + collection run,
  AI analyses).

.DESCRIPTION
  Wraps `docker compose exec ... psql < demo-extra.sql`.
  Safe to re-run — the seed is idempotent.
  Requires demo.sql to have been loaded first (via demo.ps1).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

Write-Host 'Loading extra demo data into Postgres...' -ForegroundColor Cyan
Get-Content -Raw .\database\seed\demo-extra.sql |
    docker compose exec -T postgres psql -U compliance -d compliance -q

Write-Host ''
Write-Host 'Extras loaded.' -ForegroundColor Green
Write-Host '  Dashboard should now show ~4 COVERED, 3 PARTIAL, 1 NEEDS_REVIEW.'
Write-Host '  Integrations page: 1 connected GitHub (demo).'
Write-Host '  Collection Runs:  1 completed run with 3 items.'

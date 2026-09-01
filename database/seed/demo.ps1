#requires -Version 5.1
<#
.SYNOPSIS
  Load the Syncpoint demo tenant into a running Postgres.

.DESCRIPTION
  Wraps `docker compose exec ... psql < demo.sql`. Safe to re-run — the
  seed is idempotent.

  Demo credentials created:
    demo-owner@syncpoint.local     / demo-password-2026  (OWNER)
    demo-reviewer@syncpoint.local  / demo-password-2026  (REVIEWER)
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

Write-Host 'Loading demo seed into Postgres...' -ForegroundColor Cyan
Get-Content -Raw .\database\seed\demo.sql |
    docker compose exec -T postgres psql -U compliance -d compliance -q

Write-Host ''
Write-Host 'Demo tenant loaded.' -ForegroundColor Green
Write-Host '  UI:              http://localhost:4200'
Write-Host '  Owner login:     demo-owner@syncpoint.local / demo-password-2026'
Write-Host '  Reviewer login:  demo-reviewer@syncpoint.local / demo-password-2026'

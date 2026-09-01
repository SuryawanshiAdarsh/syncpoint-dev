#requires -Version 5.1
<#
.SYNOPSIS
  Start local infrastructure (postgres, redis, qdrant, minio) via Docker Compose.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

if (-not (Test-Path '.env')) {
    Write-Host 'creating .env from .env.example' -ForegroundColor Yellow
    Copy-Item '.env.example' '.env'
}

docker compose up -d
docker compose ps

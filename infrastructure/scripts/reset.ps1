#requires -Version 5.1
<#
.SYNOPSIS
  Stop containers and REMOVE named volumes. Deletes all local Postgres, Qdrant,
  and MinIO data. Requires -Force to skip the confirmation prompt.
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

if (-not $Force) {
    $answer = Read-Host 'This will DELETE all local database, vector, and object-storage data. Type "yes" to continue'
    if ($answer -ne 'yes') {
        Write-Host 'aborted.' -ForegroundColor Yellow
        exit 1
    }
}

docker compose down -v
Write-Host 'local infrastructure volumes removed.' -ForegroundColor Green

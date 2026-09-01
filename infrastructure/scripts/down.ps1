#requires -Version 5.1
<#
.SYNOPSIS
  Stop local infrastructure. Preserves volumes.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

docker compose down

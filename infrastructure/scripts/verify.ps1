#requires -Version 5.1
<#
.SYNOPSIS
  Basic connectivity checks against the running local infrastructure.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Continue'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

function Test-Endpoint {
    param([string]$Name, [scriptblock]$Check)
    Write-Host -NoNewline ("{0,-10}" -f "$Name`:")
    try {
        & $Check | Out-Null
        Write-Host 'OK' -ForegroundColor Green
    } catch {
        Write-Host ('FAIL - ' + $_.Exception.Message) -ForegroundColor Red
    }
}

Test-Endpoint 'postgres' {
    docker compose exec -T postgres pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB
    if ($LASTEXITCODE -ne 0) { throw "pg_isready exit $LASTEXITCODE" }
}
Test-Endpoint 'redis' {
    $r = docker compose exec -T redis redis-cli ping
    if ($r.Trim() -ne 'PONG') { throw "unexpected: $r" }
}
Test-Endpoint 'qdrant' {
    Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:6333/collections' -TimeoutSec 5
}
Test-Endpoint 'minio' {
    Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:9000/minio/health/live' -TimeoutSec 5
}
Test-Endpoint 'backend' {
    Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8080/actuator/health/liveness' -TimeoutSec 5
}
Test-Endpoint 'ai-service' {
    Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8000/health' -TimeoutSec 5
}
Test-Endpoint 'frontend' {
    Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:4200/' -TimeoutSec 5
}

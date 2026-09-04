# Run this yourself: `.\deploy\scripts\clean-dockerhub.ps1`
# Prompts for Docker Hub username + password/PAT locally — never sent anywhere but hub.docker.com.
# Deletes: adarshs1612/syncpoint-{backend,ai-service,frontend,appliance} entirely (all tags/history).

$user = Read-Host "Docker Hub username"
$secpass = Read-Host "Docker Hub password or Personal Access Token" -AsSecureString
$pass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secpass))

$login = Invoke-RestMethod -Uri "https://hub.docker.com/v2/users/login/" -Method Post `
    -ContentType "application/json" -Body (@{ username = $user; password = $pass } | ConvertTo-Json)
$headers = @{ Authorization = "JWT $($login.token)" }

foreach ($repo in @("syncpoint-backend", "syncpoint-ai-service", "syncpoint-frontend", "syncpoint-appliance")) {
    try {
        Invoke-RestMethod -Uri "https://hub.docker.com/v2/repositories/adarshs1612/$repo/" -Method Delete -Headers $headers
        Write-Host "Deleted adarshs1612/$repo"
    } catch {
        Write-Host "Could not delete $repo (may not exist, or PAT lacks delete scope): $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "Now run: docker login"
Write-Host "Then tell the assistant you're done — it will rebuild, tag 0.6.0 + latest, and push all three images."

# Fix PostgreSQL Data Directory Permissions
# Run this with Administrator privileges

Write-Host "=== Fixing PostgreSQL Data Directory Permissions ===" -ForegroundColor Green

$pgData = "C:\Program Files\PostgreSQL\18\data"
$serviceName = "postgresql-x64-18"

# Stop service first
Write-Host "`nStopping PostgreSQL service..." -ForegroundColor Cyan
try {
    Stop-Service -Name $serviceName -Force -ErrorAction Stop
    Start-Sleep -Seconds 2
    Write-Host "Service stopped" -ForegroundColor Green
} catch {
    Write-Host "Could not stop service (may be already stopped)" -ForegroundColor Yellow
}

# Fix ownership and permissions
Write-Host "`nFixing directory permissions..." -ForegroundColor Cyan

try {
    # Take ownership
    Write-Host "Taking ownership..." -ForegroundColor Cyan
    & icacls "$pgData" /grant:r "NT SERVICE\postgresql-x64-18:(OI)(CI)F" /T /Q /C
    Write-Host "Permissions set" -ForegroundColor Green
    
    # Alternative: Grant Users full access
    & icacls "$pgData" /grant:r "Users:(OI)(CI)F" /T /Q /C
    Write-Host "User permissions set" -ForegroundColor Green
} catch {
    Write-Host "Error setting permissions: $_" -ForegroundColor Red
}

# Start service
Write-Host "`nStarting PostgreSQL service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    $svc = Get-Service -Name $serviceName
    if ($svc.Status -eq 'Running') {
        Write-Host "Service started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Service status: $($svc.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error starting service: $_" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Green

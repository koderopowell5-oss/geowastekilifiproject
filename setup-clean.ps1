# Clean PostgreSQL Full Reinit with Permissions Fix
# Run this with Administrator privileges

Write-Host "=== PostgreSQL Clean Reinit ===" -ForegroundColor Green

$pgPath = "C:\Program Files\PostgreSQL\18"
$pgBin = "$pgPath\bin"
$pgData = "$pgPath\data"
$serviceName = "postgresql-x64-18"

# Step 1: Stop service
Write-Host "`n[1] Stopping service..." -ForegroundColor Cyan
Try {
    Stop-Service -Name $serviceName -Force -ErrorAction Stop
    Start-Sleep -Seconds 2
} Catch {
    Write-Host "Already stopped" -ForegroundColor Yellow
}

# Step 2: Remove data directory completely
Write-Host "[2] Removing old data directory..." -ForegroundColor Cyan
if (Test-Path $pgData) {
    try {
        Remove-Item -Path $pgData -Recurse -Force -ErrorAction Stop
        Write-Host "Removed" -ForegroundColor Green
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Step 3: Create fresh data directory with correct permissions
Write-Host "[3] Creating new data directory with permissions..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path $pgData -Force -ErrorAction Stop | Out-Null
    Write-Host "Directory created" -ForegroundColor Green
    
    # Set permissions BEFORE initdb
    Write-Host "     Setting permissions..." -ForegroundColor Cyan
    & icacls "$pgData" /grant:r "NT SERVICE\postgresql-x64-18:(OI)(CI)F" /T /Q /C | Out-Null
    & icacls "$pgData" /grant:r "Users:(OI)(CI)F" /T /Q /C | Out-Null
    Write-Host "     Permissions set" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Initialize database
Write-Host "[4] Initializing database cluster..." -ForegroundColor Cyan
try {
    $initdbPath = "$pgBin\initdb.exe"
    & $initdbPath -D $pgData -U postgres -E UTF8 --encoding=UTF8 --lc-collate=C --lc-ctype=C
    Write-Host "Database initialized" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Start service
Write-Host "[5] Starting service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    $svc = Get-Service -Name $serviceName
    if ($svc.Status -eq 'Running') {
        Write-Host "Service running!" -ForegroundColor Green
    } else {
        Write-Host "Status: $($svc.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    
    # Try to show error details
    Write-Host "`nAttempting to get error details..." -ForegroundColor Yellow
    Get-EventLog -LogName Application -Source "postgresql-x64-18*" -Newest 5 -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  $($_.Message)" -ForegroundColor Yellow
    }
    
    exit 1
}

# Step 6: Create database
Write-Host "[6] Creating geowaste_kilifi database..." -ForegroundColor Cyan
try {
    & "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE geowaste_kilifi;" 2>$null
    Write-Host "Database created" -ForegroundColor Green
} catch {
    Write-Host "Note: $_" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Successful ===" -ForegroundColor Green
Write-Host "`nNext: Run .\load-schema.ps1"

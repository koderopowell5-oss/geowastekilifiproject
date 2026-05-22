# GeoKollect - PostgreSQL Database Setup Script
# Run this with Administrator privileges

Write-Host "=== GeoKollect Database Setup ===" -ForegroundColor Green

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\18"
$pgBin = "$pgPath\bin"
$pgData = "$pgPath\data"
$serviceName = "postgresql-x64-18"

Write-Host "PostgreSQL Installation: $pgPath"
Write-Host "Data Directory: $pgData"

# Step 1: Stop PostgreSQL service
Write-Host "`nStopping PostgreSQL service..." -ForegroundColor Cyan
try {
    Stop-Service -Name $serviceName -Force -ErrorAction Stop
    Start-Sleep -Seconds 2
    Write-Host "Service stopped" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not stop service" -ForegroundColor Yellow
}

# Step 2: Remove old data directory
Write-Host "`nPreparing data directory..." -ForegroundColor Cyan
if (Test-Path $pgData) {
    try {
        Remove-Item -Path $pgData -Recurse -Force -ErrorAction Stop
        Write-Host "Old data directory removed" -ForegroundColor Green
    } catch {
        Write-Host "Error removing directory: $_" -ForegroundColor Red
    }
}

# Step 3: Create fresh data directory
Write-Host "Creating new data directory..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path $pgData -Force -ErrorAction Stop | Out-Null
    Write-Host "Data directory created" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Could not create directory: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Initialize database cluster
Write-Host "`nInitializing database cluster..." -ForegroundColor Cyan
$initdbPath = "$pgBin\initdb.exe"

if (Test-Path $initdbPath) {
    try {
        & $initdbPath -D $pgData -U postgres -E UTF8 -W
        Write-Host "Database cluster initialized" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Could not initialize cluster: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: initdb.exe not found at $initdbPath" -ForegroundColor Red
    exit 1
}

# Step 5: Start PostgreSQL service
Write-Host "`nStarting PostgreSQL service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 2
    Write-Host "Service started" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Could not start service: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Create database
Write-Host "`nCreating geowaste_kilifi database..." -ForegroundColor Cyan
try {
    & "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE geowaste_kilifi;"
    Write-Host "Database created" -ForegroundColor Green
} catch {
    Write-Host "Warning: Database creation message: $_" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext steps:"
Write-Host "1. Set PostgreSQL password:"
Write-Host "   psql -U postgres -h localhost"
Write-Host "   Type: ALTER USER postgres WITH PASSWORD 'postgres123';"
Write-Host "`n2. Run: .\load-schema.ps1"
Write-Host "3. Update backend\.env file with credentials"

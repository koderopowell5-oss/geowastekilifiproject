# GeoWaste Kilifi - PostgreSQL Database Setup Script
# Run this with Administrator privileges

Write-Host "=== GeoWaste Kilifi Database Setup ===" -ForegroundColor Green
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as administrator'" -ForegroundColor Yellow
    exit 1
}

$pgPath = "C:\Program Files\PostgreSQL\18"
$pgBin = "$pgPath\bin"
$pgData = "$pgPath\data"
$serviceName = "postgresql-x64-18"

Write-Host "PostgreSQL 18 Installation: $pgPath"
Write-Host "Data Directory: $pgData"
Write-Host ""

# Step 1: Stop PostgreSQL service
Write-Host "[1/5] Stopping PostgreSQL service..." -ForegroundColor Cyan
try {
    Stop-Service -Name $serviceName -Force -ErrorAction Stop
    Start-Sleep -Seconds 3
    Write-Host "✅ Service stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not stop service: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Backup/Remove old data directory
Write-Host "[2/5] Preparing data directory..." -ForegroundColor Cyan
if (Test-Path $pgData) {
    try {
        # Remove the directory completely to avoid permission issues
        Remove-Item -Path $pgData -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Old data directory removed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not remove old directory: $_" -ForegroundColor Yellow
        # Try renaming as backup
        try {
            $backupPath = "$pgData-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Rename-Item -Path $pgData -NewName $backupPath -Force
            Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "ℹ️  No existing data directory" -ForegroundColor Cyan
}

# Create fresh data directory
Write-Host "Creating new data directory..." -ForegroundColor Cyan
try {
    New-Item -ItemType Directory -Path $pgData -Force -ErrorAction Stop | Out-Null
    Write-Host "✅ Data directory created" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not create directory: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Reinitialize database
Write-Host "[3/5] Reinitializing database cluster..." -ForegroundColor Cyan
$initdbCmd = "$pgBin\initdb.exe"
if (Test-Path $initdbCmd) {
    & $initdbCmd -D $pgData -E UTF8 -U postgres
    Write-Host "✅ Database initialized" -ForegroundColor Green
} else {
    Write-Host "❌ initdb not found at: $initdbCmd" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Start PostgreSQL service
Write-Host "[4/5] Starting PostgreSQL service..." -ForegroundColor Cyan
try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    Write-Host "✅ Service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Could not start service: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Create database
Write-Host "[5/5] Creating geowaste_kilifi database..." -ForegroundColor Cyan
try {
    & "$pgBin\createdb.exe" -U postgres -h localhost geowaste_kilifi
    Write-Host "✅ Database created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host '1. Set PostgreSQL password (password currently empty):'
Write-Host '   psql -U postgres -h localhost'
Write-Host '   At prompt type: ALTER USER postgres WITH PASSWORD ''postgres123'';'
Write-Host ""
Write-Host '2. Create backend .env file from example'
Write-Host '3. Run the load-schema.ps1 script next'
Write-Host ""

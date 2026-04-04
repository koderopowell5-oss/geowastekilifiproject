# GeoWaste Kilifi - Database Schema Loader
# Loads PostGIS and the waste_sites schema

Write-Host "=== Loading GeoWaste Schema ===" -ForegroundColor Green
Write-Host ""

$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$schemaFile = ".\database\schema.sql"
$db = "geowaste_kilifi"
$user = "postgres"
$pgHost = "localhost"

# Verify schema file exists
if (-not (Test-Path $schemaFile)) {
    Write-Host "Schema file not found: $schemaFile" -ForegroundColor Red
    Write-Host "Please run this script from the GeoWaste Kilifi project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "Database: $db" -ForegroundColor Cyan
Write-Host "Schema file: $schemaFile" -ForegroundColor Cyan
Write-Host ""

# Step 1: Enable PostGIS
Write-Host "[1/2] Enabling PostGIS extension..." -ForegroundColor Cyan
try {
    $psqlCmd = "$pgBin\psql.exe"
    & $psqlCmd -U $user -h $pgHost -d $db -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>&1 | ForEach-Object {
        if ($_ -match "error") {
            Write-Host "$_" -ForegroundColor Yellow
        } else {
            Write-Host " $_" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Warning: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Load schema
Write-Host "[2/2] Loading database schema..." -ForegroundColor Cyan
try {
    & $psqlCmd -U $user -h $pgHost -d $db -f $schemaFile 2>&1 | Tee-Object -Variable schemaOutput | ForEach-Object {
        if ($_ -match "error|ERROR") {
            Write-Host "  $_ " -ForegroundColor Red
        } elseif ($_ -match "CREATE") {
            Write-Host "   $_" -ForegroundColor Green
        }
    }
    Write-Host " Schema loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "Error loading schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your database is ready! Next steps:" -ForegroundColor Yellow
Write-Host "1. Update backend/.env with your database credentials"
Write-Host "2. Run: npm run dev"
Write-Host ""

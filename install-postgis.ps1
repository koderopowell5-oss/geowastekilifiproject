# Install PostGIS Extension for PostgreSQL 18
# Run as Administrator

Write-Host "=== Installing PostGIS for PostgreSQL 18 ===" -ForegroundColor Green

$pgPath = "C:\Program Files\PostgreSQL\18"
$pgBin = "$pgPath\bin"
$psqlExe = "$pgBin\psql.exe"

# Step 1: Try creating PostGIS extension
Write-Host "`n[1] Creating PostGIS extension..." -ForegroundColor Cyan
try {
    & $psqlExe -U postgres -h localhost -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    Write-Host "PostGIS created" -ForegroundColor Green
} catch {
    Write-Host "Could not create: $_" -ForegroundColor Yellow
}

# Step 2: Create topology extension
Write-Host "`n[2] Creating PostGIS Topology..." -ForegroundColor Cyan
try {
    & $psqlExe -U postgres -h localhost -d geowaste_kilifi -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
    Write-Host "Topology created" -ForegroundColor Green
} catch {
    Write-Host "Could not create topology: $_" -ForegroundColor Yellow
}

# Step 3: Verify installation
Write-Host "`n[3] Verifying PostGIS..." -ForegroundColor Cyan
try {
    $result = & $psqlExe -U postgres -h localhost -d geowaste_kilifi -t -c "SELECT PostGIS_version();" 2>&1
    if ($result -match "PostGIS") {
        Write-Host " PostGIS installed: $result" -ForegroundColor Green
    } else {
        Write-Host "PostGIS creation command ran but verify shows: $result" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Green

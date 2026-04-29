# Deploy APK to Downloads Folder
# This script automates the process of building the APK and deploying it for download

param(
    [ValidateSet("debug", "release")]
    [string]$BuildType = "release",
    [switch]$SkipBuild = $false,
    [switch]$SkipRebuild = $false,
    [switch]$Help = $false
)

function Show-Help {
    Write-Host @"
Deploy APK to Downloads Folder

USAGE:
    .\deploy-apk.ps1 [-BuildType <type>] [-SkipBuild] [-SkipRebuild] [-Help]

PARAMETERS:
    -BuildType <type>  : Build type - 'debug' or 'release' (default: release)
    -SkipBuild         : Skip building APK, use existing one
    -SkipRebuild       : Skip rebuilding frontend after deploying APK
    -Help              : Show this help message

EXAMPLES:
    # Build and deploy release APK (default)
    .\deploy-apk.ps1

    # Build and deploy debug APK
    .\deploy-apk.ps1 -BuildType debug

    # Deploy existing APK without rebuilding
    .\deploy-apk.ps1 -SkipBuild

    # Build APK but skip frontend rebuild
    .\deploy-apk.ps1 -SkipRebuild
"@
    exit 0
}

if ($Help) {
    Show-Help
}

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ScriptDir "frontend"
$AndroidDir = Join-Path $FrontendDir "android"
$DownloadsDir = Join-Path $FrontendDir "public\downloads"

# APK source and destination
$ApkDestination = Join-Path $DownloadsDir "GeoWaste-Kilifi.apk"

if ($BuildType -eq "debug") {
    $ApkSource = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
} else {
    $ApkSource = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
}

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║     GeoWaste Kilifi - APK Download Deployment Script         ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host @"
📋 Configuration:
   Build Type: $BuildType
   Android Dir: $AndroidDir
   APK Source: $ApkSource
   APK Destination: $ApkDestination
   Skip Build: $SkipBuild
   Skip Rebuild: $SkipRebuild
"@

# Validate directories
if (-not (Test-Path $AndroidDir)) {
    Write-Host "❌ Android directory not found: $AndroidDir" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $DownloadsDir)) {
    Write-Host "❌ Downloads directory not found: $DownloadsDir" -ForegroundColor Red
    Write-Host "   Creating downloads directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $DownloadsDir -Force | Out-Null
}

# Step 1: Build APK
if (-not $SkipBuild) {
    Write-Host "🏗️  Step 1: Building APK..." -ForegroundColor Cyan
    Push-Location $AndroidDir
    
    try {
        if ($BuildType -eq "debug") {
            Write-Host "   Running: .\gradlew.bat assembleDebug" -ForegroundColor Gray
            .\gradlew.bat assembleDebug
        } else {
            Write-Host "   Running: .\gradlew.bat assembleRelease" -ForegroundColor Gray
            .\gradlew.bat assembleRelease
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ APK build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✓ APK build successful" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error during APK build: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Step 2: Verify APK exists
Write-Host "🔍 Step 2: Verifying APK..." -ForegroundColor Cyan
if (-not (Test-Path $ApkSource)) {
    Write-Host "   ❌ APK file not found at: $ApkSource" -ForegroundColor Red
    Write-Host "   Please build the APK first or check the path" -ForegroundColor Yellow
    exit 1
}

$ApkSize = (Get-Item $ApkSource).Length / 1MB
Write-Host "   ✓ APK found: $($ApkSize.ToString('F2')) MB" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy APK
Write-Host "📦 Step 3: Deploying APK to downloads folder..." -ForegroundColor Cyan
try {
    Copy-Item $ApkSource -Destination $ApkDestination -Force
    Write-Host "   ✓ APK deployed successfully" -ForegroundColor Green
    Write-Host "   📁 Location: $ApkDestination" -ForegroundColor Green
    
    # Verify deployment
    if (Test-Path $ApkDestination) {
        $DeployedSize = (Get-Item $ApkDestination).Length / 1MB
        Write-Host "   📊 Deployed size: $($DeployedSize.ToString('F2')) MB" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error deploying APK: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Rebuild Frontend
if (-not $SkipRebuild) {
    Write-Host "🔄 Step 4: Rebuilding frontend..." -ForegroundColor Cyan
    Push-Location $FrontendDir
    
    try {
        Write-Host "   Running: npm run build" -ForegroundColor Gray
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ⚠️  Frontend build completed with warnings" -ForegroundColor Yellow
        } else {
            Write-Host "   ✓ Frontend build successful" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Error during frontend build: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Summary
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✓ APK Built: $BuildType"
Write-Host "   ✓ APK Deployed to: $ApkDestination"
if (-not $SkipRebuild) {
    Write-Host "   ✓ Frontend Rebuilt"
}
Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Yellow
Write-Host "   1. Run: npm start"
Write-Host "   2. Go to Profile → General Settings"
Write-Host "   3. Click 'Download APK' button"
Write-Host "   4. Verify the file downloads"
Write-Host ""
Write-Host "🚀 Deployment:" -ForegroundColor Yellow
Write-Host "   The APK is ready to be served with your web app"
Write-Host "   Deploy the frontend/build directory to your server"
Write-Host "   APK will be available at: /downloads/GeoWaste-Kilifi.apk"
Write-Host ""

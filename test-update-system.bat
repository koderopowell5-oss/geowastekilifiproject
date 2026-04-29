@echo off
REM Test script for APK Update System (Windows)
REM Run this to verify the update system is working

setlocal enabledelayedexpansion

echo.
echo 🔍 APK Update System - Test Suite
echo =================================
echo.

REM Configuration
set BACKEND_URL=http://localhost:5000
set FRONTEND_URL=http://localhost:3001
set TEST_VERSION=1.0.0

if not "%~1"=="" set BACKEND_URL=%~1
if not "%~2"=="" set FRONTEND_URL=%~2

echo Testing against:
echo   Backend: %BACKEND_URL%
echo   Frontend: %FRONTEND_URL%
echo.

REM Test 1: Backend Health Check
echo Test 1: Backend Health Check
echo ----------------------------
for /f "delims=" %%i in ('powershell -Command "(Invoke-WebRequest -Uri '%BACKEND_URL%/api/health' -ErrorAction SilentlyContinue).Content" 2^>nul') do set RESPONSE=%%i

if not "!RESPONSE!"=="" (
    echo [OK] Backend is running
    echo   Response: !RESPONSE!
) else (
    echo [FAIL] Backend is not responding
    echo   Make sure backend is running: cd backend ^&^& npm run dev
    exit /b 1
)
echo.

REM Test 2: Get Version Info
echo Test 2: Get Version Info
echo ------------------------
for /f "delims=" %%i in ('powershell -Command "(Invoke-WebRequest -Uri '%BACKEND_URL%/api/version' -ErrorAction SilentlyContinue).Content" 2^>nul') do set RESPONSE=%%i

if not "!RESPONSE!"=="" (
    echo [OK] /api/version endpoint working
    for /f "delims=" %%a in ('powershell -Command "!RESPONSE! ^| ConvertFrom-Json | Select -ExpandProperty data | Select -ExpandProperty latestRelease"') do echo   Latest version: %%a
) else (
    echo [FAIL] /api/version endpoint failed
)
echo.

REM Test 3: Check for Updates
echo Test 3: Check for Updates (v%TEST_VERSION%)
echo -------------------------------------------
for /f "delims=" %%i in ('powershell -Command "(Invoke-WebRequest -Uri '%BACKEND_URL%/api/version/check?version=%TEST_VERSION%' -ErrorAction SilentlyContinue).Content" 2^>nul') do set RESPONSE=%%i

if not "!RESPONSE!"=="" (
    echo [OK] /api/version/check endpoint working
    for /f "delims=" %%a in ('powershell -Command "!RESPONSE! ^| ConvertFrom-Json | Select -ExpandProperty data | Select -ExpandProperty updateAvailable"') do echo   Update available: %%a
) else (
    echo [FAIL] /api/version/check endpoint failed
)
echo.

REM Test 4: Frontend Dependencies
echo Test 4: Frontend Dependencies
echo -----------------------------
if exist "frontend\src\services\updateService.ts" (
    echo [OK] updateService.ts exists
) else (
    echo [FAIL] updateService.ts not found
)

if exist "frontend\src\components\UpdateModal.tsx" (
    echo [OK] UpdateModal.tsx exists
) else (
    echo [FAIL] UpdateModal.tsx not found
)

if exist "frontend\src\hooks\useVersionCheck.ts" (
    echo [OK] useVersionCheck.ts hook exists
) else (
    echo [FAIL] useVersionCheck.ts hook not found
)
echo.

REM Test 5: Backend Routes
echo Test 5: Backend Routes
echo ----------------------
findstr /M "versionRoutes" "backend\src\index.ts" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Version routes imported in index.ts
) else (
    echo [FAIL] Version routes not imported
)

if exist "backend\src\versionRoutes.ts" (
    echo [OK] versionRoutes.ts exists
) else (
    echo [FAIL] versionRoutes.ts not found
)

if exist "backend\src\versionService.ts" (
    echo [OK] versionService.ts exists
) else (
    echo [FAIL] versionService.ts not found
)
echo.

REM Test 6: Documentation
echo Test 6: Documentation
echo ---------------------
if exist "UPDATES_GUIDE.md" echo [OK] UPDATES_GUIDE.md
if exist "UPDATES_QUICK_REFERENCE.md" echo [OK] UPDATES_QUICK_REFERENCE.md
if exist "DEPLOYMENT_CONFIG.md" echo [OK] DEPLOYMENT_CONFIG.md
if exist "RELEASE_SCENARIOS.md" echo [OK] RELEASE_SCENARIOS.md
echo.

REM Summary
echo =================================
echo Test Summary
echo =================================
echo.
echo If all tests passed:
echo   1. Backend is running
echo   2. Version endpoints responding
echo   3. Frontend components created
echo.
echo Next steps:
echo   1. Open browser to %FRONTEND_URL%
echo   2. Open DevTools (F12^)
echo   3. Check Network tab for /api/version/check requests
echo   4. Check Console for update service logs
echo   5. Should see update modal if version ^< latest
echo.
echo To test update check manually:
echo   Open DevTools Console and run:
echo   localStorage.removeItem('geowaste_update_cache');
echo   location.reload();
echo.

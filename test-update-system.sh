#!/bin/bash
# Test script for APK Update System
# Run this to verify the update system is working

echo "🔍 APK Update System - Test Suite"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${1:-http://localhost:5000}"
FRONTEND_URL="${2:-http://localhost:3001}"
TEST_VERSION="1.0.0"

echo "Testing against:"
echo "  Backend: $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "----------------------------"
RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo "  Response: $(echo $RESPONSE | jq -r '.message')"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "  Make sure backend is running: cd backend && npm run dev"
    exit 1
fi
echo ""

# Test 2: Get Version Info
echo "Test 2: Get Version Info"
echo "------------------------"
RESPONSE=$(curl -s "$BACKEND_URL/api/version")
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ /api/version endpoint working${NC}"
    echo "  Latest version: $(echo $RESPONSE | jq -r '.data.latestRelease')"
    echo "  Release date: $(echo $RESPONSE | jq -r '.data.releaseDate')"
    echo "  Critical update: $(echo $RESPONSE | jq -r '.data.criticalUpdate')"
else
    echo -e "${RED}✗ /api/version endpoint failed${NC}"
fi
echo ""

# Test 3: Check for Updates
echo "Test 3: Check for Updates (v$TEST_VERSION)"
echo "-------------------------------------------"
RESPONSE=$(curl -s "$BACKEND_URL/api/version/check?version=$TEST_VERSION")
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ /api/version/check endpoint working${NC}"
    UPDATE_AVAILABLE=$(echo $RESPONSE | jq -r '.data.updateAvailable')
    LATEST=$(echo $RESPONSE | jq -r '.data.latestVersion')
    echo "  Current: $TEST_VERSION"
    echo "  Latest: $LATEST"
    echo "  Update available: $UPDATE_AVAILABLE"
    
    if [ "$UPDATE_AVAILABLE" == "true" ]; then
        echo "  Download URL: $(echo $RESPONSE | jq -r '.data.downloadUrl')"
        echo "  Release notes: $(echo $RESPONSE | jq -r '.data.releaseNotes' | head -1)"
    fi
else
    echo -e "${RED}✗ /api/version/check endpoint failed${NC}"
fi
echo ""

# Test 4: Frontend Service Load
echo "Test 4: Frontend Dependencies"
echo "-----------------------------"
if [ -f "frontend/src/services/updateService.ts" ]; then
    echo -e "${GREEN}✓ updateService.ts exists${NC}"
else
    echo -e "${RED}✗ updateService.ts not found${NC}"
fi

if [ -f "frontend/src/components/UpdateModal.tsx" ]; then
    echo -e "${GREEN}✓ UpdateModal.tsx exists${NC}"
else
    echo -e "${RED}✗ UpdateModal.tsx not found${NC}"
fi

if [ -f "frontend/src/hooks/useVersionCheck.ts" ]; then
    echo -e "${GREEN}✓ useVersionCheck.ts hook exists${NC}"
else
    echo -e "${RED}✗ useVersionCheck.ts hook not found${NC}"
fi
echo ""

# Test 5: Backend Routes Check
echo "Test 5: Backend Routes"
echo "---------------------"
if grep -q "versionRoutes" "backend/src/index.ts"; then
    echo -e "${GREEN}✓ Version routes imported in index.ts${NC}"
else
    echo -e "${RED}✗ Version routes not imported${NC}"
fi

if [ -f "backend/src/versionRoutes.ts" ]; then
    echo -e "${GREEN}✓ versionRoutes.ts exists${NC}"
else
    echo -e "${RED}✗ versionRoutes.ts not found${NC}"
fi

if [ -f "backend/src/versionService.ts" ]; then
    echo -e "${GREEN}✓ versionService.ts exists${NC}"
else
    echo -e "${RED}✗ versionService.ts not found${NC}"
fi
echo ""

# Test 6: Documentation Check
echo "Test 6: Documentation"
echo "--------------------"
DOCS=("UPDATES_GUIDE.md" "UPDATES_QUICK_REFERENCE.md" "DEPLOYMENT_CONFIG.md" "RELEASE_SCENARIOS.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓ $doc${NC}"
    else
        echo -e "${YELLOW}⚠ $doc (missing)${NC}"
    fi
done
echo ""

# Summary
echo "================================="
echo "Test Summary"
echo "================================="
echo ""
echo "If all tests passed:"
echo "  1. ✓ Backend is running"
echo "  2. ✓ Version endpoints responding"
echo "  3. ✓ Frontend components created"
echo ""
echo "Next steps:"
echo "  1. Open browser to $FRONTEND_URL"
echo "  2. Open DevTools (F12)"
echo "  3. Check Network tab for /api/version/check requests"
echo "  4. Check Console for update service logs"
echo "  5. Should see update modal if version < latest"
echo ""
echo "To test update check manually:"
echo "  Open DevTools Console and run:"
echo "  localStorage.removeItem('geowaste_update_cache');"
echo "  location.reload();"
echo ""

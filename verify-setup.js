#!/usr/bin/env node

/**
 * GeoWaste Kilifi Setup Verification Script
 * Checks that all required dependencies, configurations, and files are in place
 * Usage: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passedCount = 0;
let failedCount = 0;

function check(name, condition, errorMsg = '') {
  checks.push({ name, condition, errorMsg });
  if (condition) {
    console.log(`✓ ${name}`);
    passedCount++;
  } else {
    console.log(`✗ ${name}`);
    if (errorMsg) console.log(`  → ${errorMsg}`);
    failedCount++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  GeoWaste Kilifi - Setup Verification');
console.log('═══════════════════════════════════════════════════════\n');

// Check backend structure
console.log('Backend Files:');
check('backend/package.json exists', fs.existsSync('backend/package.json'));
check('backend/src/index.ts exists', fs.existsSync('backend/src/index.ts'));
check('backend/src/routes.ts exists', fs.existsSync('backend/src/routes.ts'));
check('backend/src/service.ts exists', fs.existsSync('backend/src/service.ts'));
check('backend/src/db.ts exists', fs.existsSync('backend/src/db.ts'));
check('backend/src/authService.ts exists', fs.existsSync('backend/src/authService.ts'));

// Check backend dependencies
console.log('\nBackend Dependencies (in package.json):');
const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
check('multer dependency', backendPackageJson.dependencies?.multer !== undefined, 'Add multer: npm install in backend');
check('axios dependency', backendPackageJson.dependencies?.axios !== undefined, 'Add axios: npm install in backend');
check('@types/multer devDependency', backendPackageJson.devDependencies?.['@types/multer'] !== undefined, 'Add @types/multer: npm install in backend');

// Check frontend structure
console.log('\nFrontend Files:');
check('frontend/package.json exists', fs.existsSync('frontend/package.json'));
check('frontend/src/components/WasteSurveyForm.tsx exists', fs.existsSync('frontend/src/components/WasteSurveyForm.tsx'));
check('frontend/src/components/RecordsPage.tsx exists', fs.existsSync('frontend/src/components/RecordsPage.tsx'));
check('frontend/src/services/wasteApi.ts exists', fs.existsSync('frontend/src/services/wasteApi.ts'));
check('frontend/src/services/cloudinaryService.ts exists', fs.existsSync('frontend/src/services/cloudinaryService.ts'), 'Missing cloudinaryService - should handle backend uploads');

// Check database files
console.log('\nDatabase Files:');
check('database/schema.sql exists', fs.existsSync('database/schema.sql'));
check('database/migration_002_add_image_url.sql exists', fs.existsSync('database/migration_002_add_image_url.sql'));

// Check type definitions
console.log('\nType Definitions:');
check('types.ts exists', fs.existsSync('types.ts'));
check('types.d.ts exists', fs.existsSync('types.d.ts'));
check('backend/src/types.ts exists', fs.existsSync('backend/src/types.ts'));

// Check documentation
console.log('\nDocumentation:');
check('CLOUDINARY_SETUP.md exists', fs.existsSync('CLOUDINARY_SETUP.md'));
check('README.md exists', fs.existsSync('README.md'));
check('IMPLEMENTATION_SUMMARY.md exists', fs.existsSync('IMPLEMENTATION_SUMMARY.md'));

// Check environment
console.log('\nEnvironment Configuration:');
const backendEnvExists = fs.existsSync('backend/.env');
check('backend/.env file exists', backendEnvExists, 'Create backend/.env with Cloudinary credentials');

if (backendEnvExists) {
  const envContent = fs.readFileSync('backend/.env', 'utf8');
  check('CLOUDINARY_CLOUD_NAME in .env', envContent.includes('CLOUDINARY_CLOUD_NAME'), 'Add CLOUDINARY_CLOUD_NAME to backend/.env');
  check('CLOUDINARY_API_KEY in .env', envContent.includes('CLOUDINARY_API_KEY'), 'Add CLOUDINARY_API_KEY to backend/.env');
  check('CLOUDINARY_API_SECRET in .env', envContent.includes('CLOUDINARY_API_SECRET'), 'Add CLOUDINARY_API_SECRET to backend/.env');
}

// Check node_modules
console.log('\nDependencies Installed:');
check('backend/node_modules exists', fs.existsSync('backend/node_modules'), 'Run: cd backend && npm install');
check('frontend/node_modules exists', fs.existsSync('frontend/node_modules'), 'Run: cd frontend && npm install');

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  Results: ${passedCount} passed, ${failedCount} failed`);
console.log('═══════════════════════════════════════════════════════\n');

if (failedCount === 0) {
  console.log('✓ All checks passed! You\'re ready to start the application.\n');
  console.log('Next steps:');
  console.log('1. Start backend:  cd backend && npm run dev');
  console.log('2. Start frontend: cd frontend && npm start\n');
  process.exit(0);
} else {
  console.log(`✗ ${failedCount} check(s) failed. See errors above.\n`);
  console.log('Setup instructions:');
  console.log('1. Create backend/.env with Cloudinary credentials (see CLOUDINARY_SETUP.md)');
  console.log('2. Run: cd backend && npm install');
  console.log('3. Run: cd frontend && npm install');
  console.log('4. See CLOUDINARY_SETUP.md for configuration details\n');
  process.exit(1);
}

# GeoWaste Kilifi - Versioning & Release Guide

## 📌 Base Standard: Version 1.0.1

**Established**: April 29, 2026  
**Type**: Official Baseline Release  
**Status**: Stable & Tested

Version 1.0.1 is the official base standard for the GeoWaste Kilifi app. All future releases will follow a consistent naming and versioning scheme with automatic in-app update detection.

---

## 🔢 Semantic Versioning Scheme

All releases follow **Semantic Versioning** (MAJOR.MINOR.PATCH):

```
MAJOR.MINOR.PATCH
  ↓    ↓     ↓
  1    0     1
```

### Version Components

| Component | When to Increment | Examples |
|-----------|------------------|----------|
| **MAJOR** | Breaking changes, major new features, complete redesign | 1.0.0 → 2.0.0 (major UI overhaul, incompatible API) |
| **MINOR** | New features, significant improvements | 1.0.0 → 1.1.0 (new dashboard, new export format) |
| **PATCH** | Bug fixes, security patches, minor tweaks | 1.0.0 → 1.0.1 (fix crash, security update) |

---

## 📋 Release Types & Examples

### Type 1: PATCH Release (Bug Fixes & Security)
**Pattern**: `1.0.X` (increment last number)

| Release | Reason | Update Type |
|---------|--------|------------|
| 1.0.1 | Security patches, bug fixes | Optional |
| 1.0.2 | Critical security fix | **Required** |
| 1.0.3 | Performance improvements | Optional |
| 1.0.5 | Collection UI fix | Optional |

**When to use**: 
- Bug fixes
- Security patches
- Performance improvements
- No new features

**User Impact**: Low - Optional update notification  
**In-App Modal**: "Update Available" with dismiss option (unless critical)

---

### Type 2: MINOR Release (New Features)
**Pattern**: `1.X.0` (increment middle number, reset patch to 0)

| Release | Reason | Update Type |
|---------|--------|------------|
| 1.0.1 | Current baseline |  |
| 1.1.0 | New reporting features | Recommended |
| 1.2.0 | New analytics dashboard | Recommended |
| 1.3.0 | Mobile offline support | Recommended |
| 1.5.0 | Integration with new data sources | Recommended |

**When to use**:
- New features
- Significant UX improvements
- New capabilities
- Backward compatible

**User Impact**: Medium - Recommended update, but not required  
**In-App Modal**: "New Features Available" with remind-later option

---

### Type 3: MAJOR Release (Major Changes)
**Pattern**: `X.0.0` (increment first number, reset others to 0)

| Release | Reason | Update Type |
|---------|--------|------------|
| 1.0.1 | Current baseline |  |
| 2.0.0 | Complete redesign | **Required** |
| 2.0.0 | New backend API | **Required** |
| 3.0.0 | Mobile native rewrite | **Required** |

**When to use**:
- Major feature overhaul
- Breaking changes
- Complete redesign
- Migration required

**User Impact**: High - Users MUST update  
**In-App Modal**: Red header, no dismiss button, forced update

---

## 🎯 Release Decision Matrix

Quick reference to decide which version type:

```
Does your release break existing functionality or require data migration?
├─ YES → MAJOR version (1.0.0 → 2.0.0)
└─ NO → Continue...

Does your release add new features or significant improvements?
├─ YES → MINOR version (1.0.0 → 1.1.0)
└─ NO → Continue...

Is this just a bug fix, security patch, or small improvement?
├─ YES → PATCH version (1.0.0 → 1.0.1)
└─ NO → Go back, think about what you're releasing
```

---

## 🚀 How to Release a New Version

### Step 1: Update Version Numbers

Update these 4 files (use the same version for all):

**File 1: `frontend/package.json`**
```json
{
  "version": "1.0.2",
  // ... rest of file
}
```

**File 2: `frontend/android/app/build.gradle`**
```gradle
android {
    defaultConfig {
        applicationId "com.geowaste.kilifi"
        minSdkVersion 24
        targetSdkVersion 36
        versionCode 3          // ← Increment by 1
        versionName "1.0.2"    // ← Match package.json version
    }
}
```

**File 3: `backend/src/versionService.ts`**
```typescript
class VersionService {
  private currentVersion = '1.0.2';
  private latestReleaseVersion = '1.0.2';
  private minRequiredVersion = '1.0.0';  // Adjust if needed
```

**File 4: `frontend/src/services/updateService.ts`**
```typescript
class UpdateService {
  private currentVersion = '1.0.2';
}
```

### Step 2: Update Release Notes

In `backend/src/versionService.ts`, update the `getReleaseNotes()` method:

```typescript
getReleaseNotes(): string {
  const notes: { [key: string]: string } = {
    '1.0.1': `
Release Notes v1.0.1 (Base Standard)
• Initial release with automatic update system
• Collection workflow improvements
• Bug fixes and performance enhancements
`.trim(),
    '1.0.2': `
Release Notes v1.0.2
• Fixed crash on report generation
• Security: Updated dependencies
• Improved map performance
• Minor UI refinements
`.trim(),
    '1.1.0': `
Release Notes v1.1.0
• NEW: Advanced analytics dashboard
• NEW: Custom report builder
• Improved data export options
• Many bug fixes
`.trim(),
  };
  return notes[this.latestReleaseVersion] || 'Update available';
}
```

### Step 3: Build the New APK

```bash
# Navigate to frontend directory
cd frontend

# Build React
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# Copy to public downloads
copy app/build/outputs/apk/debug/app-debug.apk ../public/downloads/GeoWaste-Kilifi-v1.0.2-debug.apk
```

### Step 4: Upload & Configure

1. **Upload APK to CDN/Server**
   - Upload to your hosting location
   - Note the download URL

2. **Update Download URL in Backend**
   
   In `backend/src/versionService.ts`:
   ```typescript
   getVersionInfo(): VersionInfo {
     return {
       current: this.currentVersion,
       latestRelease: this.latestReleaseVersion,
       minRequiredVersion: this.minRequiredVersion,
       downloadUrl: 'https://yourdomain.com/downloads/GeoWaste-Kilifi-v1.0.2.apk',
       // ...
     };
   }
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   npm run build
   npm run start
   # Or deploy to your hosting platform
   ```

### Step 5: Monitor & Verify

1. **Test locally first**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

2. **Test update detection**
   ```bash
   # Test with old version
   curl "http://localhost:5000/api/version/check?version=1.0.1"
   
   # Should respond: updateAvailable: true
   ```

3. **Install on test device**
   ```bash
   adb install frontend/public/downloads/GeoWaste-Kilifi-v1.0.2-debug.apk
   ```

---

## 🔄 In-App Update Flow

### What Users See Based on Version

**Scenario 1: User on 1.0.0, New version 1.0.1 available**
```
┌─────────────────────────────────────┐
│       Update Available              │
│                                     │
│  Current: 1.0.0                    │
│  Latest: 1.0.1                     │
│                                     │
│  • Security updates                │
│  • Bug fixes                       │
│                                     │
│ [Download Update] [Remind Later]   │
└─────────────────────────────────────┘
```

**Scenario 2: User on 1.0.1, New version 1.1.0 available**
```
┌─────────────────────────────────────┐
│       New Features Available        │
│                                     │
│  Current: 1.0.1                    │
│  Latest: 1.1.0                     │
│                                     │
│  • New analytics dashboard         │
│  • Custom report builder           │
│  • Many improvements               │
│                                     │
│ [Download Update] [Remind Later]   │
└─────────────────────────────────────┘
```

**Scenario 3: User on 1.0.1, Critical update 1.0.2 required**
```
┌─────────────────────────────────────┐
│     ⚠️  CRITICAL UPDATE REQUIRED  ⚠️  │
│                                     │
│  Current: 1.0.1                    │
│  Required: 1.0.2                   │
│                                     │
│  Critical security fix required    │
│                                     │
│      [Download Update]             │
│                                     │
│  (No dismiss option)               │
└─────────────────────────────────────┘
```

---

## 📊 Version Timeline Example

```
April 2026:  1.0.1  Base Standard (current)
             ↓
May 2026:    1.0.2  Security patches
             ↓
June 2026:   1.1.0  New reporting features
             ↓
July 2026:   1.1.1  Bug fix in reports
             ↓
August 2026: 1.2.0  New dashboard
             ↓
September:   2.0.0  Major redesign (breaking change)
```

---

## 🛡️ Critical vs Optional Updates

### Mark as Critical (Force Update)

In `backend/src/versionService.ts`:

```typescript
getVersionInfo(): VersionInfo {
  return {
    // ...
    criticalUpdate: true,  // ← Users cannot dismiss
    minRequiredVersion: '1.0.2',  // ← Older versions blocked
  };
}
```

**When to use critical flag**:
- Security vulnerability
- Data corruption fix
- Breaking changes
- System incompatibility

### Mark as Optional (Allow Dismiss)

```typescript
getVersionInfo(): VersionInfo {
  return {
    // ...
    criticalUpdate: false,  // ← Users can dismiss
    minRequiredVersion: '1.0.1',  // ← Previous version still works
  };
}
```

**When to use optional flag**:
- New features
- Performance improvements
- UI refinements
- Non-critical bug fixes

---

## ✅ Release Checklist

Use this before releasing any new version:

- [ ] Updated version in all 4 files
- [ ] Updated release notes in `getReleaseNotes()`
- [ ] Built and tested new APK locally
- [ ] Tested update detection with old version
- [ ] Uploaded APK to CDN/server
- [ ] Updated `downloadUrl` in backend
- [ ] Tested on actual Android device
- [ ] Verified no crashes or errors
- [ ] Deployed backend
- [ ] Monitored for user issues
- [ ] Updated this guide if needed

---

## 🔍 Version Comparison Logic

The in-app system uses **semantic version comparison**:

```
Version A: 1.0.1  →  Split to [1, 0, 1]
Version B: 1.1.0  →  Split to [1, 1, 0]

Compare:
1.0.1 < 1.1.0?
├─ Compare major: 1 = 1 ✓ continue
├─ Compare minor: 0 < 1? YES → Update available
└─ Result: updateAvailable = true
```

This ensures:
- 1.0.0 < 1.0.1 ✓ (update available)
- 1.0.1 = 1.0.1 ✓ (no update)
- 1.0.1 < 1.1.0 ✓ (update available)
- 1.0.1 < 2.0.0 ✓ (update available)

---

## 📁 Files to Update for Each Release

Quick reference table:

| File | Version Field | Example |
|------|---------------|---------|
| `frontend/package.json` | `"version"` | `"1.0.2"` |
| `frontend/android/app/build.gradle` | `versionName` | `"1.0.2"` |
| `frontend/android/app/build.gradle` | `versionCode` | `3` |
| `backend/src/versionService.ts` | `currentVersion` | `'1.0.2'` |
| `backend/src/versionService.ts` | `latestReleaseVersion` | `'1.0.2'` |
| `frontend/src/services/updateService.ts` | `currentVersion` | `'1.0.2'` |
| `backend/src/versionService.ts` | `getReleaseNotes()` | Add notes for v1.0.2 |
| Backend config/`.env` | `APK_DOWNLOAD_URL` | New CDN URL |

---

## 🎯 Quick Version Decision Guide

**User asks: Should I build version X?**

| Question | Answer | Result |
|----------|--------|--------|
| Am I fixing bugs or security issues? | YES | PATCH (1.0.2) |
| Am I adding new features? | YES | MINOR (1.1.0) |
| Am I breaking existing functionality? | YES | MAJOR (2.0.0) |
| Am I just tweaking UI? | YES | PATCH or MINOR |
| Am I rewriting a major component? | YES | MINOR or MAJOR |
| Users will be mad if they don't update? | YES | Mark as Critical |

---

## 📞 Questions?

- **Why semantic versioning?** It's the industry standard and makes version relationships clear.
- **What if I mess up the version?** No problem - build again with correct version.
- **Can I skip versions?** Yes, e.g., go from 1.0.1 directly to 1.1.0.
- **What about beta versions?** Can use `1.0.2-beta1` format for testing (not required).
- **How often should I release?** As needed - could be weekly or monthly depending on development pace.

---

## 📝 Version 1.0.1 Summary

**GeoWaste Kilifi v1.0.1** is your official baseline. Future versions will follow this guide:

✅ **Patch releases** (1.0.X): Bug fixes, security, optional updates  
✅ **Minor releases** (1.X.0): New features, recommended updates  
✅ **Major releases** (X.0.0): Breaking changes, required updates  

All releases automatically detected and prompted in-app.

---

*Last Updated: April 29, 2026*  
*Base Standard: v1.0.1*  
*Next Planned Release: To be determined based on feature roadmap*

# Version Release Quick Reference

## 🎯 Base Standard: v1.0.1

---

## 📋 Version Naming Scheme

```
MAJOR.MINOR.PATCH
  1    0     1
```

| Type | Pattern | Example | User Impact |
|------|---------|---------|-------------|
| **PATCH** | 1.0.X | 1.0.2 | Bug fixes, security | Optional |
| **MINOR** | 1.X.0 | 1.1.0 | New features | Recommended |
| **MAJOR** | X.0.0 | 2.0.0 | Breaking changes | **Required** |

---

## 🚀 Quick Release Checklist

**Step 1: Update 4 Files** (all same version)
```
☐ frontend/package.json → "version": "1.0.2"
☐ frontend/android/app/build.gradle → versionName "1.0.2"
☐ frontend/android/app/build.gradle → versionCode 3 (increment by 1)
☐ backend/src/versionService.ts → currentVersion = '1.0.2'
☐ backend/src/versionService.ts → latestReleaseVersion = '1.0.2'
☐ frontend/src/services/updateService.ts → currentVersion = '1.0.2'
```

**Step 2: Add Release Notes**
```typescript
// In backend/src/versionService.ts getReleaseNotes()
'1.0.2': `
Release Notes v1.0.2
• Fixed crash in reports
• Security updates
• Performance improvements
`.trim(),
```

**Step 3: Build APK**
```bash
cd frontend && npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
copy app/build/outputs/apk/debug/app-debug.apk ../public/downloads/GeoWaste-Kilifi-v1.0.2-debug.apk
```

**Step 4: Deploy**
```bash
# Upload APK to CDN
# Update downloadUrl in backend versionService.ts
cd backend && npm run start
```

---

## ❓ Which Version Type?

```
Bug fix or security patch? → PATCH (1.0.X)
New features? → MINOR (1.X.0)
Breaking changes? → MAJOR (X.0.0)
```

---

## 🔐 Critical vs Optional

```typescript
// CRITICAL (users MUST update)
criticalUpdate: true
minRequiredVersion: '1.0.2'

// OPTIONAL (users can dismiss)
criticalUpdate: false
minRequiredVersion: '1.0.1'
```

---

## 📊 Version History Template

```
v1.0.1  Base Standard (April 2026)
v1.0.2  Bug fixes & security
v1.1.0  New features
v1.1.1  Bug fix
v1.2.0  More features
v2.0.0  Major redesign
```

---

## 🧪 Test New Version

```bash
# Test locally
curl "http://localhost:5000/api/version/check?version=1.0.1"
# Should show: updateAvailable: true

# Install on device
adb install "frontend/public/downloads/GeoWaste-Kilifi-v1.0.2-debug.apk"
```

---

## 📍 Download URL Location

Update in `backend/src/versionService.ts`:
```typescript
downloadUrl: 'https://yourdomain.com/downloads/GeoWaste-Kilifi-v1.0.2.apk'
```

---

## ⚡ TL;DR - Release in 60 Seconds

1. Update version in 4 files
2. Update release notes
3. `npm run build` in frontend
4. `npx cap sync android` 
5. `./gradlew assembleDebug` in android/
6. Upload APK
7. Update downloadUrl in backend
8. Deploy backend

Done! Users will see update notification.

---

*Remember: v1.0.1 is your official baseline. Everything else builds from here.*

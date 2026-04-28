# FINAL_SETUP_GUIDE.md

# GeoWaste Kilifi - Final Setup & Deployment Guide

This guide will get you from where we are now to a fully working application with all four features.

## Current Status ✅

**What's Ready:**
- ✅ All source code files created/updated
- ✅ Database schema migrations prepared
- ✅ All dependencies added to package.json
- ✅ All documentation written
- ✅ Setup verification script created

**What You Need To Do:**
1. Add Cloudinary credentials to backend `.env`
2. Run `npm install` in backend folder
3. Run database migration (for existing databases)
4. Restart backend server
5. Test the features

---

## Step 1: Get Cloudinary Credentials (5 minutes)

### Create Free Cloudinary Account
1. Go to https://cloudinary.com
2. Click "Sign up for free"
3. Fill in email, password, name
4. Verify your email
5. Accept terms and login

### Get Your API Credentials
1. In Cloudinary Dashboard, click the **Settings** icon (gear) in top right
2. Go to **API Keys** tab
3. Copy these three values:
   - **Cloud Name** (labeled as "Cloud Name" at top)
   - **API Key** (12-15 digits)
   - **API Secret** (long random string - keep this private!)

Example values (DO NOT USE THESE):
```
Cloud Name: d1abc2def
API Key: 123456789012345
API Secret: abcd1234efgh5678ijkl9012
```

---

## Step 2: Configure Backend (2 minutes)

### Edit backend/.env

The file `backend/.env` should already exist. Open it and add/update these three lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_step_1
CLOUDINARY_API_KEY=your_api_key_from_step_1
CLOUDINARY_API_SECRET=your_api_secret_from_step_1
```

**Example (with placeholder values):**
```env
CLOUDINARY_CLOUD_NAME=d1abc2def
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcd1234efgh5678ijkl9012
```

**IMPORTANT**: Never commit this file to git. It's already in `.gitignore`.

---

## Step 3: Install Backend Dependencies (2 minutes)

Open terminal and run:

```bash
cd backend
npm install
```

This installs `multer` (file upload), `axios` (HTTP client), and their TypeScript types.

Expected output:
```
added 150 packages
```

---

## Step 4: Database Migration (Optional - For Existing Databases)

If you're upgrading an existing system with records already in the database:

```bash
# Connect to your database and run the migration
psql -U your_username -d geowaste_kilifi -f database/migration_002_add_image_url.sql
```

**For Production Render Database:**
```bash
psql postgresql://username:password@host:port/database_name -f database/migration_002_add_image_url.sql
```

This adds the `image_url` and `enumerator_email` columns to the `waste_sites` table.

---

## Step 5: Start the Application

### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
✓ Server running at http://localhost:5000
✓ Connected to database
✓ Routes loaded
✓ Upload: POST /api/upload/image
```

### Terminal 2 - Frontend Dev Server

```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
Local:  http://localhost:3000
```

The app will open in your browser automatically.

---

## Step 6: Verify Everything Works

### Test 1: Check Backend is Running
```bash
curl http://localhost:5000/api/health
```

You should see:
```json
{"status":"ok"}
```

### Test 2: Check Setup Verification
```bash
cd to root directory
node verify-setup.js
```

Expected output:
```
✓ All checks passed! You're ready to start the application.
```

---

## Feature Testing Checklist

### Feature 1: Enumerator Deletion ✓
- [ ] Go to Admin Dashboard
- [ ] Click on "Enumerators" tab
- [ ] Click delete (trash) icon next to any enumerator
- [ ] Confirm deletion in dialog
- [ ] Enumerator disappears from list

### Feature 2: CSV Export ✓
- [ ] Go to Records tab
- [ ] Click "Export CSV" button
- [ ] File downloads: `waste_records_[timestamp].csv`
- [ ] Open in Excel/Sheets
- [ ] Verify all columns present including `image_url` and `enumerator_email`

### Feature 3: Image Upload ✓
- [ ] Go to Dashboard
- [ ] Click "Collect Data"
- [ ] Fill out survey form (steps 1-9)
- [ ] Reach Photo section (step 10)
- [ ] Select or drag an image file
- [ ] See upload progress bar
- [ ] See thumbnail preview
- [ ] Submit form
- [ ] Image should appear in Records table

### Feature 4: Image Display ✓
- [ ] Go to Records tab
- [ ] Look for first column - "Image"
- [ ] Click any image thumbnail to view full-size
- [ ] Modal opens with full image
- [ ] Click X or outside to close

---

## Common Issues & Solutions

### "Image upload failed" or "network error"
**Check:**
1. Backend is running: `npm run dev` in terminal
2. Check browser console (F12) for detailed error
3. Verify API URL is correct: Should be `http://localhost:5000` for local

### "Cloudinary is not configured"
**Solution:**
1. Check backend/.env file exists
2. Verify three CLOUDINARY_* variables are set
3. Restart backend server (Ctrl+C and `npm run dev`)
4. Check no extra spaces or quotes in values

### "Cannot find module 'multer'"
**Solution:**
```bash
cd backend
npm install multer axios @types/multer --save
```

### Images not uploading
**Check:**
1. File is under 5MB
2. File format is JPG, PNG, WebP, or GIF
3. Cloudinary credentials are correct
4. Backend logs for detailed error message

### CSV Export shows no records
**Solution:**
1. Create at least one survey with waste data
2. Wait a moment for data to sync
3. Refresh the page
4. Try export again

---

## Production Deployment

### For Render or Similar Platform:

1. **Backend Deployment:**
   - Add environment variables to platform:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - Redeploy backend service
   - Run database migration

2. **Frontend Deployment:**
   - Build: `npm run build`
   - Deploy `frontend/build/` folder
   - Set API URL to production backend

3. **Database Migration:**
   - Connect to production database
   - Run migration script

---

## Documentation Available

- **CLOUDINARY_SETUP.md** - Detailed Cloudinary setup
- **IMPLEMENTATION_SUMMARY.md** - Technical details of each feature
- **README.md** - General project overview
- **FILE-MANIFEST.md** - File inventory
- **verify-setup.js** - Automated setup verification

---

## Quick Commands Reference

```bash
# Setup
cd backend && npm install
cd ../frontend && npm install

# Run locally
cd backend && npm run dev          # Terminal 1
cd frontend && npm start           # Terminal 2

# Build for production
cd backend && npm run build
cd ../frontend && npm run build

# Verify setup
node verify-setup.js

# Run database migration
psql -U postgres -d geowaste_kilifi -f database/migration_002_add_image_url.sql

# Check backend health
curl http://localhost:5000/api/health
```

---

## Troubleshooting Checklist

If something doesn't work:

1. **Check Backend Logs**
   - Look at Terminal 1 where backend runs
   - Copy any error messages

2. **Check Frontend Console**
   - Press F12 in browser
   - Go to Console tab
   - Look for red errors

3. **Check Network Tab**
   - Press F12 in browser
   - Go to Network tab
   - Try to upload image
   - Look at POST /api/upload/image request
   - Check response for errors

4. **Restart Everything**
   - Stop backend (Ctrl+C in Terminal 1)
   - Stop frontend (Ctrl+C in Terminal 2)
   - Verify .env is correct
   - Restart both

5. **Check Cloudinary Account**
   - Log into https://cloudinary.com
   - Verify API credentials haven't changed
   - Check account hasn't exceeded free tier limits

---

## Support

For detailed help:
- **Setup issues**: See CLOUDINARY_SETUP.md
- **Code questions**: See IMPLEMENTATION_SUMMARY.md
- **General questions**: See README.md

---

## Success Indicators

You'll know everything is working when:

✓ Backend starts without errors  
✓ Frontend loads in browser  
✓ Can upload image through survey form  
✓ Image appears in Records table  
✓ CSV export downloads with 40+ columns  
✓ Can delete enumerators  

When you see all these, all four features are working! 🎉

---

## Next Steps After Setup

1. **Test thoroughly** in local development
2. **Configure production environment** variables
3. **Run database migration** on production database
4. **Deploy to production** (backend and frontend)
5. **Verify all features** work in production
6. **Monitor** Cloudinary usage and database
7. **Train enumerators** on photo upload feature

---

## Questions?

Each feature has complete documentation:

1. **Enumerator Removal**: EnumeratorsPage.tsx, authService.ts, routes.ts
2. **CSV Export**: RecordsPage.tsx exportToCSV() function
3. **Image Upload**: cloudinaryService.ts, WasteSurveyForm.tsx step 10
4. **Image Display**: RecordsPage.tsx image column

See IMPLEMENTATION_SUMMARY.md for full technical details.

**Good luck! 🚀**

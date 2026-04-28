# Cloudinary Integration Guide

## Overview
This guide explains how to set up Cloudinary image storage for the GeoWaste Kilifi application. Cloudinary credentials are stored securely in the backend `.env` file for maximum security.

## Architecture
- **Frontend**: Sends images to backend via multipart/form-data POST request
- **Backend**: Uploads images to Cloudinary using secure API credentials from `.env`
- **Cloudinary**: Stores images and returns CDN URLs
- **Database**: Stores image URLs for retrieval in records table

This backend-driven approach is more secure than exposing credentials to the client.

## Setup Steps

### 1. Create a Cloudinary Account
- Visit [https://cloudinary.com](https://cloudinary.com)
- Sign up for a free account
- Verify your email

### 2. Get Your Credentials
1. Log in to your Cloudinary Dashboard
2. Navigate to **Settings** (gear icon in top right)
3. Go to the **API Keys** tab
4. You'll find:
   - **Cloud Name** (e.g., `dxxxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (keep this private - don't share!)

⚠️ **CRITICAL: Keep API Secret private. Never commit to version control!**

### 3. Configure Backend Environment Variables

Add the following to your backend `.env` file (in the `backend/` directory):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual Cloudinary credentials from step 2.

### 4. Install Dependencies

The backend requires `multer` for file handling. Run this in the backend directory:

```bash
cd backend
npm install
```

This installs:
- `multer`: Middleware for handling file uploads
- `axios`: HTTP client for Cloudinary API calls
- `@types/multer`: TypeScript types for multer

### 5. Restart the Backend

After setting environment variables and installing dependencies, restart your backend server:

```bash
npm run dev
```

You should see output confirming the server started and the upload endpoint is available:
```
✓ Server running at http://localhost:5000
✓ Upload: POST /api/upload/image
```

### 6. Frontend Configuration (Already Set Up)

The frontend is pre-configured to upload to the backend. No additional setup needed for the client-side environment variables.

## Usage

### For Enumerators (Survey Creation)
1. When filling out a waste survey, navigate to the **Photo** section (step 10)
2. Click the upload zone to select or drag-and-drop a photo
3. Supported formats: JPG, PNG, WebP, GIF (max 5MB)
4. A progress bar shows upload percentage in real-time
5. Once uploaded, a thumbnail preview appears
6. You can remove the photo by clicking the X button
7. Submit the survey - the image URL is included

### In Admin Dashboard (Records View)
- All submitted surveys with photos display thumbnails in the Records table
- Click any thumbnail to view the full-size image
- Use the **Export CSV** button to download all records with image URLs
- Image URLs are permanent CDN links and work in any context

## API Endpoint

### POST /api/upload/image
Backend endpoint for uploading images to Cloudinary

**Request:**
```
Content-Type: multipart/form-data
Field: image (binary file)
Max size: 5MB
```

**Success Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image_url": "https://res.cloudinary.com/.../..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid image file",
  "error": "File too large. Maximum size is 5MB"
}
```

## Image URL Storage

- Image URLs stored in: `waste_sites.image_url` column (VARCHAR 500)
- URL format: `https://res.cloudinary.com/[cloud_name]/image/upload/...`
- URLs are permanent and work after data export
- Images organized in Cloudinary folder: `geowaste/surveys/`
- Each image has public access for display in admin dashboard

## Database Schema

The database automatically includes the `image_url` field in the `waste_sites` table:

```sql
ALTER TABLE waste_sites ADD COLUMN image_url VARCHAR(500);
```

If you're upgrading existing systems, run:
```bash
cd database
psql -U postgres -d geowaste_kilifi -f migration_002_add_image_url.sql
```

## Troubleshooting

### "Image upload failed" or "network error"
- Check internet connection
- Verify backend is running: `npm run dev` in backend folder
- Confirm backend and frontend can communicate
- Check browser DevTools Console for detailed errors
- Verify API URL is correct (should match your backend host/port)

### Backend reports "Cloudinary is not configured"
- Ensure `.env` file exists in backend root directory (same level as `package.json`)
- Verify all three variables are set:
  ```
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```
- Restart backend server after adding `.env` variables
- Check for typos in variable names (case-sensitive)
- Ensure values are actual credentials, not placeholders

### "Invalid Signature" or Cloudinary authentication errors
- Verify CLOUDINARY_API_SECRET is correct
- Check for extra whitespace in .env values
- Confirm API Key and Cloud Name are correct
- Ensure Cloudinary account is active and not restricted

### Images not appearing in Records table
- Confirm upload showed 100% progress
- Check backend logs for upload errors
- Verify image URL was stored in database
- Try uploading a new image to test the complete flow
- Check that browser can reach the image URL directly

### "File too large" error
- Maximum size is 5MB per image
- Compress images before uploading
- Try a different image file

### Multer not found / module errors
- Run `npm install` in backend folder
- Check that `node_modules` directory was created
- Verify `package.json` includes multer dependency
- Restart VS Code if node_modules were just installed

## Security Best Practices

1. **Never commit .env**: Ensure `.env` is in `.gitignore`
2. **Restrict API permissions**: Use Cloudinary settings to limit API Key capabilities
3. **Enable authentication**: Backend validates and authenticates all uploads
4. **Monitor usage**: Check Cloudinary dashboard for unexpected activity
5. **Rotate credentials**: Periodically update API credentials
6. **Use HTTPS**: Ensure backend uses HTTPS in production
7. **Rate limit uploads**: Consider adding rate limiting to `/api/upload/image` endpoint

## Environment Setup Checklist

Complete this before going live:

- [ ] Created Cloudinary account (free tier acceptable)
- [ ] Obtained Cloud Name, API Key, and API Secret
- [ ] Created/updated backend `.env` with credentials
- [ ] Ran `npm install` in backend folder
- [ ] Confirmed multer and axios in node_modules
- [ ] Restarted backend server
- [ ] Tested file upload through WasteSurveyForm
- [ ] Confirmed image appears in Records table
- [ ] Exported CSV and verified image URLs included
- [ ] Verified image URLs are accessible externally

## Local Development Example

1. Create backend/.env:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/geowaste_kilifi
CLOUDINARY_CLOUD_NAME=d1234abcd
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secret_key_here
```

2. Start backend:
```bash
cd backend
npm install  # if not already done
npm run dev
```

3. Backend logs should show:
```
✓ Server running at http://localhost:5000
✓ Upload: POST /api/upload/image
```

4. In another terminal, start frontend:
```bash
cd frontend
npm install  # if not already done
npm start
```

5. Test upload:
- Go to Dashboard → Collect Data
- Fill survey steps 1-9
- Step 10: Click Photo upload zone
- Select an image file
- Watch progress bar complete
- See thumbnail preview
- Submit survey

6. Check Records tab to see image in table

## Production Deployment

For deployment on Render or similar:

1. Add these to your backend environment variables in the platform:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

2. Do NOT add `.env` file to git - use platform's config management

3. Redeploy backend to pick up environment variables

4. Test image upload in production instance

## Useful Commands

```bash
# Install backend dependencies
cd backend && npm install

# Start backend development server
npm run dev

# Build backend for production
npm run build

# Check if backend is running
curl http://localhost:5000/api/health

# View Cloudinary credentials (backend/.env only)
cat backend/.env | grep CLOUDINARY
```

## References

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary API Reference](https://cloudinary.com/documentation/admin_api)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express File Upload](https://expressjs.com/en/resources/middleware/multer.html)
- [Axios Documentation](https://axios-http.com/)

## Support

For issues with:
- **GeoWaste**: Check the project README
- **Cloudinary**: Visit [Cloudinary Support](https://support.cloudinary.com/)

# Cloudinary Integration Guide

## Overview
This guide explains how to set up Cloudinary image storage for the GeoWaste Kilifi application. Cloudinary is used to store survey site photos.

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
   - **API Key** (you can skip this for basic uploads)
   - **API Secret** (keep this private - don't share!)

### 3. Create an Upload Preset
Upload presets allow unsigned uploads (no authentication needed on the client side):

1. In your Cloudinary Dashboard, go to **Upload** → **Upload Presets**
2. Click **Create unsigned preset**
3. Name it something like `geowaste_survey` (remember this name)
4. Set **Signing Mode** to **Unsigned**
5. Optionally, under **Upload Folder**, set it to `geowaste/surveys` to organize your images
6. Click **Create Preset**

### 4. Configure Frontend Environment Variables

Create or update `.env.local` in the frontend directory:

```env
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
REACT_APP_CLOUDINARY_UPLOAD_PRESET=geowaste_survey
```

Replace:
- `your_cloud_name_here` with your Cloudinary Cloud Name
- `geowaste_survey` with your upload preset name if different

### 5. Configure Backend Environment Variables (Optional)

If you want to handle image uploads on the backend, add to your `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

⚠️ **Never commit these credentials to version control!**

### 6. Restart the Application

After setting environment variables, restart your development server:

```bash
# Frontend
npm start

# Backend
npm run dev
```

## Usage

### For Enumerators
1. When filling out a waste survey, you'll see a new **Photo** section
2. Click the upload zone to select or take a photo
3. Supported formats: JPG, PNG, WebP, GIF (max 5MB)
4. The photo will be uploaded to Cloudinary and linked to the survey
5. You can remove the photo by clicking the X button

### In Admin Dashboard
- All submitted surveys with photos will display them in the Records table
- Click the thumbnail image to view the full-sized photo
- Use the **Export CSV** button to download all records including image URLs

## Image URL Storage

- Image URLs are stored in the `image_url` field of the `waste_sites` table
- URLs follow Cloudinary's CDN format: `https://res.cloudinary.com/[cloud_name]/image/upload/...`
- These URLs are permanent and will work even after exporting data

## Troubleshooting

### "Image upload failed"
- Check internet connection
- Verify image file is under 5MB
- Confirm upload preset name is correct
- Check browser console for detailed error messages

### Missing REACT_APP_CLOUDINARY_* variables
- Ensure `.env.local` is in the frontend directory (not root)
- Make sure you restart the dev server after adding variables
- Verify no typos in variable names

### Images not appearing in records table
- Ensure the upload completed successfully (progress bar showed 100%)
- Check that image URL is stored in the database
- Try uploading a new image to confirm the flow works

### Cloudinary Account Issues
- If uploads fail with "Preset not found", verify preset name is correct
- Ensure the preset is set to **Unsigned** mode
- Check that your Cloudinary account hasn't exceeded free tier limits

## Free Tier Limitations

Cloudinary's free tier includes:
- 25 GB of storage
- 25 GB of monthly transformations
- Unlimited uploads
- No credit card required to get started

For production deployment, consider upgrading to a paid plan.

## Security Best Practices

1. **Never commit credentials**: Use `.env.local` (ignored by git)
2. **Use unsigned presets**: Safer than exposing API keys on the client
3. **Set upload restrictions**: Limit file types/sizes in the preset settings
4. **Regular backups**: Download your Cloudinary media regularly as backup
5. **Monitor usage**: Check your Cloudinary dashboard for unexpected activity

## References

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Unsigned Upload Guide](https://cloudinary.com/documentation/upload_widget#unsigned_uploads)
- [React Integration](https://cloudinary.com/documentation/react_integration)

## Support

For issues with:
- **GeoWaste**: Check the project README
- **Cloudinary**: Visit [Cloudinary Support](https://support.cloudinary.com/)

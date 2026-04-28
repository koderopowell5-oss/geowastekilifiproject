/**
 * Cloudinary Image Upload Service (Backend)
 * Handles server-side image uploads to Cloudinary using backend API credentials
 */

import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export class CloudinaryUploadService {
  private cloudName: string = process.env.CLOUDINARY_CLOUD_NAME || '';
  private apiKey: string = process.env.CLOUDINARY_API_KEY || '';
  private apiSecret: string = process.env.CLOUDINARY_API_SECRET || '';

  constructor() {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.warn('⚠️ Cloudinary is not fully configured in backend. Image uploads will not work.');
      console.warn('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
    }
  }

  /**
   * Upload image buffer to Cloudinary
   * @param fileBuffer - Image file buffer
   * @param filename - Original filename
   * @returns URL of uploaded image
   */
  async uploadImage(fileBuffer: Buffer, filename: string): Promise<string> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary is not configured. Set environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    }

    try {
      const form = new FormData();
      
      // Add file to form
      form.append('file', fileBuffer, filename);
      form.append('api_key', this.apiKey);
      form.append('timestamp', Math.floor(Date.now() / 1000).toString());
      
      // Optional: set upload folder for organization
      form.append('folder', 'geowaste/surveys');
      
      // Generate signature for secure upload
      const signature = this.generateSignature(form);
      form.append('signature', signature);

      // Upload to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data.secure_url) {
        throw new Error('No URL returned from Cloudinary');
      }

      console.log(`✓ Image uploaded to Cloudinary: ${filename}`);
      return response.data.secure_url;
    } catch (error: any) {
      console.error('Cloudinary upload error:', error.message);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Generate SHA-1 signature for Cloudinary upload
   * @param form - FormData object
   * @returns Signature string
   */
  private generateSignature(form: FormData): string {
    const crypto = require('crypto');
    
    // Get timestamp from form data
    const fields = form.getBuffer().toString();
    const timestampMatch = fields.match(/timestamp=(\d+)/);
    const timestamp = timestampMatch ? timestampMatch[1] : Math.floor(Date.now() / 1000).toString();
    
    // Create signature string
    const signatureString = `folder=geowaste/surveys&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
    
    return signature;
  }

  /**
   * Validate image file before upload
   */
  validateImageFile(buffer: Buffer, filename: string): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Check file size
    if (buffer.length > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is 5MB (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`,
      };
    }

    // Basic magic number check for file type
    const magic = buffer.slice(0, 4);
    const isJpeg = magic[0] === 0xff && magic[1] === 0xd8;
    const isPng = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47;
    const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46;

    if (!isJpeg && !isPng && !isWebp) {
      // Allow other formats based on extension
      if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        return {
          valid: false,
          error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.',
        };
      }
    }

    return { valid: true };
  }
}

export const cloudinaryUploadService = new CloudinaryUploadService();

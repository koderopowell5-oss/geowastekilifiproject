/**
 * Cloudinary Image Upload Service
 * Handles image uploads to Cloudinary for survey records
 */

export class CloudinaryService {
  private cloudName: string = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
  private uploadPreset: string = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';

  constructor() {
    if (!this.cloudName || !this.uploadPreset) {
      console.warn('Cloudinary configuration missing. Image uploads will not work.');
    }
  }

  /**
   * Upload image to Cloudinary
   * @param file - Image file to upload
   * @param onProgress - Callback for upload progress
   * @returns Promise with uploaded image URL
   */
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary is not configured. Please set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('cloud_name', this.cloudName);

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url);
            } catch (e) {
              reject(new Error('Invalid response from Cloudinary'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed: network error'));
        };

        xhr.onabort = () => {
          reject(new Error('Upload aborted'));
        };

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);
        xhr.send(formData);
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 5MB.',
      };
    }

    return { valid: true };
  }
}

export const cloudinaryService = new CloudinaryService();

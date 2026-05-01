/**
 * Cloudinary Image Upload Service (Frontend)
 * Handles image uploads to backend for secure Cloudinary storage
 */

import { API_BASE_URL } from '../config/api';

export class CloudinaryService {
  /**
   * Upload image via backend to Cloudinary
   * @param file - Image file to upload
   * @param onProgress - Callback for upload progress
   * @returns Promise with uploaded image URL
   */
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Track progress using XMLHttpRequest for better control
      return await new Promise((resolve, reject) => {
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

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data?.image_url) {
                resolve(response.data.image_url);
              } else {
                reject(new Error(response.message || 'Invalid response from server'));
              }
            } catch (e) {
              reject(new Error('Failed to parse server response'));
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

        const formData = new FormData();
        formData.append('image', file);

        xhr.open('POST', `${API_BASE_URL}/api/upload/image`);
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

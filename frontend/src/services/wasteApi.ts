import axios, { AxiosInstance } from 'axios';
import { WasteSiteRecord, ApiResponse } from '../../../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://geowastekilifiproject.onrender.com/api';

class WasteApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status code
          const errorMsg = error.response.data?.message || error.response.statusText || 'Request failed';
          const errorCode = error.response.status;
          
          // Don't log 404 errors from drafts endpoint - they're expected when no draft exists
          const isExpectedDraftsNotFound = errorCode === 404 && error.config?.url?.includes('/drafts/');
          if (!isExpectedDraftsNotFound) {
            console.error('API Error:', error);
            console.error(`HTTP ${errorCode}: ${errorMsg}`);
          }
          
          if (errorCode === 401) {
            throw new Error('Invalid email or password. Please check your credentials.');
          } else if (errorCode === 400) {
            throw new Error(errorMsg);
          } else if (errorCode === 409) {
            throw new Error('Email already registered. Please login instead.');
          } else if (errorCode >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(errorMsg);
          }
        } else if (error.request) {
          // Request made but no response
          console.error('No server response:', error.request);
          throw new Error('No response from server. Please check your connection.');
        } else {
          // Error in request setup
          console.error('Request setup error:', error.message);
          throw new Error(error.message || 'An error occurred');
        }
      }
    );
  }

  /**
   * Submit a new waste site record
   */
  async submitWasteSite(data: Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'> & { enumerator_email?: string }): Promise<WasteSiteRecord> {
    const response = await this.api.post<ApiResponse<WasteSiteRecord>>('/waste', data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to submit waste site');
    }
    return response.data.data!;
  }

  /**
   * Get all waste site records
   */
  async getAllWasteSites(
    limit: number = 1000,
    offset: number = 0
  ): Promise<{ records: WasteSiteRecord[]; total: number; pages: number }> {
    const response = await this.api.get<ApiResponse<any>>('/waste', {
      params: { limit, offset },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch waste sites');
    }
    return response.data.data;
  }

  /**
   * Get a single waste site record by ID
   */
  async getWasteSiteById(id: string | number): Promise<WasteSiteRecord> {
    const response = await this.api.get<ApiResponse<WasteSiteRecord>>(`/waste/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch waste site');
    }
    return response.data.data!;
  }

  /**
   * Get statistics summary
   */
  async getStatistics(): Promise<{ total_records: number; total_wards: number; distinct_settlement_types: number }> {
    const response = await this.api.get<ApiResponse<any>>('/waste/stats/summary');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch statistics');
    }
    return response.data.data;
  }

  /**
   * Get waste sites within geographic bounds
   */
  async getWasteSitesByBounds(minLat: number, maxLat: number, minLng: number, maxLng: number): Promise<WasteSiteRecord[]> {
    const response = await this.api.get<ApiResponse<WasteSiteRecord[]>>(
      `/waste/bounds/${minLat}/${maxLat}/${minLng}/${maxLng}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch waste sites by bounds');
    }
    return response.data.data || [];
  }

  /**
   * Get waste sites by enumerator email
   */
  async getWasteSitesByEnumerator(
    enumeratorEmail: string,
    limit: number = 1000,
    offset: number = 0
  ): Promise<{ records: WasteSiteRecord[]; total: number; pages: number }> {
    const response = await this.api.get<ApiResponse<any>>('/waste', {
      params: { limit, offset, enumerator_email: enumeratorEmail },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch enumerator waste sites');
    }
    return response.data.data;
  }

  /**
   * Register a new enumerator
   */
  async signupEnumerator(
    email: string,
    password: string,
    name: string,
    ward: string,
    phone: string
  ): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/auth/signup', {
      email,
      password,
      name,
      ward,
      phone,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  }

  /**
   * Login an enumerator
   */
  async loginEnumerator(email: string, password: string): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/auth/login', {
      email,
      password,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  }

  /**
   * Get all enumerators
   */
  async getAllEnumerators(): Promise<any[]> {
    const response = await this.api.get<ApiResponse<any>>('/auth/enumerators');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch enumerators');
    }
    return response.data.data || [];
  }

  /**
   * Delete an enumerator by ID
   */
  async deleteEnumerator(id: number): Promise<void> {
    const response = await this.api.delete<ApiResponse<any>>(`/auth/enumerators/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete enumerator');
    }
  }

  /**
   * Delete a waste site record by ID (admin only)
   */
  async deleteWasteSite(id: number): Promise<void> {
    const response = await this.api.delete<ApiResponse<any>>(`/waste/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete waste site record');
    }
  }

  /**
   * Upload image to backend for Cloudinary storage
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post<ApiResponse<{ image_url: string }>>(
        `${API_BASE_URL}/upload/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload image');
      }

      return response.data.data?.image_url || '';
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/health`);
      return response.data.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Save a draft waste site form to database
   */
  async saveDraft(enumeratorEmail: string, draftData: any): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/drafts', {
      enumerator_email: enumeratorEmail,
      draft_data: draftData,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save draft');
    }
    return response.data.data;
  }

  /**
   * Get draft waste site form from database
   */
  async getDraft(enumeratorEmail: string): Promise<any | null> {
    try {
      const response = await this.api.get<ApiResponse<any>>(`/drafts/${enumeratorEmail}`);
      if (!response.data.success) {
        return null; // No draft found
      }
      return response.data.data;
    } catch (error) {
      // Return null if no draft found (404)
      return null;
    }
  }

  /**
   * Delete a draft waste site form from database
   */
  async deleteDraft(enumeratorEmail: string): Promise<boolean> {
    try {
      const response = await this.api.delete<ApiResponse<any>>(`/drafts/${enumeratorEmail}`);
      return response.data.success;
    } catch {
      return false;
    }
  }
}

export const wasteApiService = new WasteApiService();

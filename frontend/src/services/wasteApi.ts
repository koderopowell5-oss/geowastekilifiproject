import axios, { AxiosInstance } from 'axios';
import { WasteSiteRecord, ApiResponse } from '../../../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class WasteApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Submit a new waste site record
   */
  async submitWasteSite(data: Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'>): Promise<WasteSiteRecord> {
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
}

export const wasteApiService = new WasteApiService();

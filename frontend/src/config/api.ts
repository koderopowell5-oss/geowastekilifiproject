/**
 * API Configuration
 * Handles environment-aware API URL routing
 */

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  const envApiUrl = process.env.REACT_APP_API_URL ||
                     process.env.REACT_APP_API_BASE_URL ||
                     process.env.REACT_APP_BACKEND_URL;

  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback to a relative API root when no explicit backend URL is configured.
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to build full API endpoint URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Don't add /api if the baseUrl already ends with /api
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}${path}`;
  }
  
  return `${baseUrl}/api${path}`;
};

/**
 * Standard fetch options with auth
 */
export const getFetchOptions = (options?: RequestInit): RequestInit => {
  const token = localStorage.getItem('token');
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  };
};

const apiConfig = {
  API_BASE_URL,
  buildApiUrl,
  getFetchOptions,
};

export default apiConfig;

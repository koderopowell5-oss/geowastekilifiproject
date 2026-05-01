/**
 * API Configuration
 * Handles environment-aware API URL routing
 */

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // In production (Render deployment), use the full backend URL
  if (process.env.NODE_ENV === 'production') {
    // Get the current host and replace frontend port with backend port
    // For Render: frontend is on one service, backend on another
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
      return backendUrl;
    }
    
    // Fallback for production if no explicit backend URL
    return 'https://geowastekilifi-backend.onrender.com';
  }

  // Development: use relative path (proxied by nginx or dev server)
  return 'http://localhost:5000';
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

export default {
  API_BASE_URL,
  buildApiUrl,
  getFetchOptions,
};

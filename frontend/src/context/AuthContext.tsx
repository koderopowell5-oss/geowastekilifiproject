import React, { createContext, useState, useContext, useEffect } from 'react';
import { wasteApiService } from '../services/wasteApi';

export interface Enumerator {
  id: string | number;
  name: string;
  email: string;
  ward: string;
  phone: string;
  account_type: 'admin' | 'enumerator';
  role?: string;
  status?: string;
}

export type AuthUser = Enumerator;

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, ward: string, phone: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session configuration
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_STORAGE_KEY = 'auth_user';
const SESSION_TIMESTAMP_KEY = 'auth_session_timestamp';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionTimestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    
    if (storedUser && sessionTimestamp) {
      try {
        const loginTime = parseInt(sessionTimestamp, 10);
        const now = Date.now();
        const isSessionValid = now - loginTime < SESSION_DURATION_MS;
        
        if (isSessionValid) {
          setUser(JSON.parse(storedUser));
          // Renew session timestamp on app load
          localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
        } else {
          // Session expired, clear localStorage
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(SESSION_TIMESTAMP_KEY);
        }
      } catch (err) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API for login
      const response = await wasteApiService.loginEnumerator(email, password);
      
      const enumerator: Enumerator = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        ward: response.user.ward,
        phone: response.user.phone,
        account_type: response.user.account_type || 'enumerator',
        role: response.user.role,
        status: response.user.status,
      };

      setUser(enumerator);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(enumerator));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, ward: string, phone: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API to register user
      const enumerator = await wasteApiService.signupEnumerator(email, password, name, ward, phone);

      // Set current user (don't store password)
      const user: Enumerator = {
        id: enumerator.id,
        name: enumerator.name,
        email: enumerator.email,
        ward: enumerator.ward,
        phone: enumerator.phone,
      };
      
      setUser(user);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Use unified login endpoint - backend will verify account_type
      const response = await wasteApiService.loginEnumerator(email, password);
      
      // Verify this is an admin account
      if (response.user.account_type !== 'admin') {
        throw new Error('Only admin accounts can use admin login');
      }
      
      const admin: Enumerator = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        ward: response.user.ward,
        phone: response.user.phone,
        account_type: 'admin',
        role: response.user.role,
        status: response.user.status,
      };

      setUser(admin);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(admin));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } catch (error: any) {
      throw new Error(error.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  };

  const isAdmin = user ? user.account_type === 'admin' : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        login,
        signup,
        adminLogin,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import { wasteApiService } from '../services/wasteApi';

export interface Enumerator {
  id: string | number;
  name: string;
  email: string;
  ward: string;
  phone: string;
}

export interface Admin {
  id: string;
  username: string;
  isAdmin: true;
}

export type AuthUser = Enumerator | Admin;

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
        id: response.id,
        name: response.name,
        email: response.email,
        ward: response.ward,
        phone: response.phone,
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

  const adminLogin = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Hardcoded admin credentials
      const ADMIN_USERNAME = 'kodero_admin';
      const ADMIN_PASSWORD = '*Powell123!';

      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        throw new Error('Invalid admin username or password');
      }

      const adminUser: Admin = {
        id: 'admin-1',
        username: ADMIN_USERNAME,
        isAdmin: true,
      };

      setUser(adminUser);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminUser));
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  };

  const isAdmin = user ? 'isAdmin' in user && user.isAdmin : false;

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

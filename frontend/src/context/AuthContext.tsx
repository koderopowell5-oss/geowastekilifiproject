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



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API for login
      console.log('Attempting login for:', email);
      const response = await wasteApiService.loginEnumerator(email, password);
      console.log('Login successful:', response);
      
      const enumerator: Enumerator = {
        id: response.id,
        name: response.name,
        email: response.email,
        ward: response.ward,
        phone: response.phone,
      };

      setUser(enumerator);
      localStorage.setItem('auth_user', JSON.stringify(enumerator));
    } catch (error: any) {
      console.error('Login error caught:', error.message);
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
      localStorage.setItem('auth_user', JSON.stringify(user));
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
      localStorage.setItem('auth_user', JSON.stringify(adminUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
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

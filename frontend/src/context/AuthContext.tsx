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

// Demo enumerators (kept for testing)
const DEMO_ENUMERATORS: Record<string, { password: string; enumerator: Enumerator }> = {
  'enumerator1@geowaste.com': {
    password: 'password123',
    enumerator: {
      id: '1',
      name: 'John Kamau',
      email: 'enumerator1@geowaste.com',
      ward: 'Mombasa',
      phone: '+254712345678',
    },
  },
  'enumerator2@geowaste.com': {
    password: 'password123',
    enumerator: {
      id: '2',
      name: 'Mary Kipchoge',
      email: 'enumerator2@geowaste.com',
      ward: 'Kilifi',
      phone: '+254723456789',
    },
  },
  'enumerator3@geowaste.com': {
    password: 'password123',
    enumerator: {
      id: '3',
      name: 'David Omondi',
      email: 'enumerator3@geowaste.com',
      ward: 'Malindi',
      phone: '+254734567890',
    },
  },
};

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'AdminGeoWaste2024!',
  id: 'admin-001'
};

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
      // Check demo enumerators first
      let userCreds = DEMO_ENUMERATORS[email];
      
      // If not found in demo, check registered users in localStorage
      if (!userCreds) {
        const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}');
        const registeredUser = registeredUsers[email];
        if (registeredUser && registeredUser.password === password) {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 500));
          setUser(registeredUser.enumerator);
          localStorage.setItem('auth_user', JSON.stringify(registeredUser.enumerator));
          return;
        }
      }

      if (!userCreds || userCreds.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setUser(userCreds.enumerator);
      localStorage.setItem('auth_user', JSON.stringify(userCreds.enumerator));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, ward: string, phone: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API to register user
      const enumerator = await wasteApiService.signupEnumerator(email, password, name, ward, phone);

      // Store in localStorage as backup
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '{}');
      registeredUsers[email] = {
        password,
        enumerator: {
          id: enumerator.id,
          name: enumerator.name,
          email: enumerator.email,
          ward: enumerator.ward,
          phone: enumerator.phone,
        } as Enumerator,
      };
      localStorage.setItem('registered_users', JSON.stringify(registeredUsers));

      // Set current user
      const user: Enumerator = {
        id: enumerator.id,
        name: enumerator.name,
        email: enumerator.email,
        ward: enumerator.ward,
        phone: enumerator.phone,
      };
      localStorage.setItem('auth_user', JSON.stringify(user));
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
        throw new Error('Invalid admin credentials');
      }

      const adminUser: Admin = {
        id: ADMIN_CREDENTIALS.id,
        username: ADMIN_CREDENTIALS.username,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

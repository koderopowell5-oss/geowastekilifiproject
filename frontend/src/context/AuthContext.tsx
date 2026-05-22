import React, { createContext, useState, useContext, useEffect } from 'react';
import { wasteApiService } from '../services/wasteApi';

export interface EnumeratorProject {
  project: {
    id: string;
    name: string;
    description?: string;
    admin_id: string;
    admin?: {
      id: string;
      name: string;
      email: string;
      ward?: string;
      phone?: string;
    };
    created_at: string;
    updated_at: string;
  };
  role: {
    id: number;
    name: string;
    permissions: string[];
  };
  permissions: string[];
}

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
  projects: EnumeratorProject[];
  currentProjectId: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, ward: string, phone: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  switchProject: (projectId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session configuration
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_STORAGE_KEY = 'auth_user';
const SESSION_TIMESTAMP_KEY = 'auth_session_timestamp';
const TOKEN_STORAGE_KEY = 'token';
const PROJECTS_STORAGE_KEY = 'auth_user_projects';
const CURRENT_PROJECT_STORAGE_KEY = 'auth_current_project_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<EnumeratorProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(SESSION_STORAGE_KEY);
    const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    const storedProjectId = localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);
    const sessionTimestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (storedUser && sessionTimestamp && storedToken) {
      try {
        const loginTime = parseInt(sessionTimestamp, 10);
        const now = Date.now();
        const isSessionValid = now - loginTime < SESSION_DURATION_MS;

        if (isSessionValid) {
          const user = JSON.parse(storedUser);
          setUser(user);
          setProjects(storedProjects ? JSON.parse(storedProjects) : []);
          setCurrentProjectId(storedProjectId || null);
          // Renew session timestamp on app load
          localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
        } else {
          // Session expired, clear localStorage
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(SESSION_TIMESTAMP_KEY);
          localStorage.removeItem(PROJECTS_STORAGE_KEY);
          localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (err) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_TIMESTAMP_KEY);
        localStorage.removeItem(PROJECTS_STORAGE_KEY);
        localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend API for login
      const response = await wasteApiService.loginEnumerator(email, password);
      
      // Enumerator login should reject admin accounts
      if (response.user.account_type === 'admin') {
        throw new Error('Admin accounts must use admin login. Please use the admin portal.');
      }
      
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

      const projects = Array.isArray(response.projects) ? response.projects : [];
      const currentProjectId = response.current_project_id || (projects[0]?.project?.id ?? null);

      setUser(enumerator);
      setProjects(projects);
      setCurrentProjectId(currentProjectId);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(enumerator));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, currentProjectId || '');
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      
      // Store auth token for API requests
      if (response.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }
      
      // Preserve role/account_type for enumerator state
      if (!enumerator.account_type) {
        enumerator.account_type = enumerator.role === 'admin' ? 'admin' : 'enumerator';
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(enumerator));
      }
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
        account_type: enumerator.account_type || 'enumerator',
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

      const projects = Array.isArray(response.projects) ? response.projects : [];
      const currentProjectId = response.current_project_id || (projects[0]?.project?.id ?? null);

      setUser(admin);
      setProjects(projects);
      setCurrentProjectId(currentProjectId);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(admin));
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, currentProjectId || '');
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      
      // Store auth token for API requests
      if (response.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }
      
      // Ensure account_type is preserved for admin state
      if (admin.account_type !== 'admin') {
        admin.account_type = 'admin';
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(admin));
      }
    } catch (error: any) {
      throw new Error(error.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setProjects([]);
    setCurrentProjectId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const isAdmin = user ? user.account_type === 'admin' : false;

  const switchProject = async (projectId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await wasteApiService.switchProject(projectId);
    const nextProjectId = response.current_project_id || projectId;
    setCurrentProjectId(nextProjectId);
    setProjects(Array.isArray(response.projects) ? response.projects : projects);
    localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, nextProjectId || '');
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(response.projects || projects));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        projects,
        currentProjectId,
        isAuthenticated: !!user,
        isAdmin,
        login,
        signup,
        adminLogin,
        switchProject,
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

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db';
import { ApiResponse } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export interface AuthRequest extends Request {
  params: any;
  body: any;
  headers: any;
  file?: any; // Multer file object
  query: Record<string, string | string[] | undefined>;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    account_type?: 'admin' | 'enumerator';
    permissions?: Record<string, boolean>;
    primary_project_id?: string | null;
  };
}
export function isAdminUser(user?: { role?: string; account_type?: string } | null): boolean {
  return !!user && (user.role === 'admin' || user.account_type === 'admin');
}
/**
 * Verify JWT token and attach user to request
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization token',
      } as ApiResponse);
    }

    const token = authHeader.substring(7);

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      } as ApiResponse);
    }

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token payload',
      } as ApiResponse);
    }

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'kodero_admin';
    if (payload.sub === ADMIN_USERNAME || payload.email === ADMIN_USERNAME) {
      req.user = {
        id: 0,
        email: 'admin@geowaste.local',
        name: 'Administrator',
        role: 'admin',
        account_type: 'admin',
        permissions: {},
        primary_project_id: null,
      };
      return next();
    }

    // Fetch user with permissions from database
    const result = await pool.query(
      'SELECT id, email, name, role, account_type, permissions, primary_project_id FROM enumerators WHERE email = $1',
      [payload.email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
    }

    const user = result.rows[0];
    const accountType = user.account_type || (user.role === 'admin' ? 'admin' : 'enumerator');

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || accountType,
      account_type: accountType,
      permissions: user.permissions || {},
      primary_project_id: user.primary_project_id || null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    } as ApiResponse);
  }
}

/**
 * Check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      } as ApiResponse);
    }

    const permissions = req.user.permissions || {};
    if (!permissions[permission] && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Missing permission: ${permission}`,
      } as ApiResponse);
    }

    next();
  };
}

/**
 * Check if user is admin
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
  }

  if (!isAdminUser(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Admin role required',
    } as ApiResponse);
  }

  next();
}

/**
 * Check if user is supervisor or admin
 */
export function requireSupervisor(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    } as ApiResponse);
  }

  if (!isAdminUser(req.user) && req.user.role !== 'supervisor') {
    return res.status(403).json({
      success: false,
      message: 'Supervisor or Admin role required',
    } as ApiResponse);
  }

  next();
}

import { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import { ApiResponse } from './types';

export interface AuthRequest extends Request {
  params: any;
  body: any;
  headers: any;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions?: Record<string, boolean>;
  };
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

    // For now, use simple email/username-based token (in production, use JWT)
    // Token format: email:timestamp or username:timestamp (decoded in frontend)
    const [identifier] = token.split(':');

    if (!identifier) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
      } as ApiResponse);
    }

    // Check if this is admin
    const ADMIN_USERNAME = 'kodero_admin';
    if (identifier === ADMIN_USERNAME) {
      req.user = {
        id: 0,
        email: 'admin@geowaste.local',
        name: 'Administrator',
        role: 'admin',
        permissions: {},
      };
      return next();
    }

    // Fetch user with permissions from database
    const result = await pool.query(
      'SELECT id, email, name, role, permissions FROM enumerators WHERE email = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || {},
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

  if (req.user.role !== 'admin') {
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

  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
    return res.status(403).json({
      success: false,
      message: 'Supervisor or Admin role required',
    } as ApiResponse);
  }

  next();
}

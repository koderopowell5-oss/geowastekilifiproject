import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  id?: number;
  email: string;
  role: string;
  name: string;
  account_type?: 'admin' | 'enumerator';
  permissions?: Record<string, boolean>;
}

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!process.env.JWT_SECRET) {
  console.warn('[JWT] Warning: JWT_SECRET is not set. Using default insecure secret. Set JWT_SECRET in production.');
}

export function signJwt(payload: TokenPayload) {
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyJwt(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET as jwt.Secret) as TokenPayload;
}

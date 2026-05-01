import pool from './db';
import bcrypt from 'bcrypt';

export interface EnumeratorData {
  email: string;
  password: string;
  name: string;
  ward: string;
  phone: string;
}

export interface Enumerator {
  id: number;
  email: string;
  name: string;
  ward: string;
  phone: string;
  role: string;
  status: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export class AuthService {
  // Hash password with bcrypt
  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Compare password with hash
  private static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new enumerator
   */
  static async registerEnumerator(data: EnumeratorData): Promise<Enumerator> {
    const { email, password, name, ward, phone } = data;

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM enumerators WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Insert new enumerator
    const result = await pool.query(
      `INSERT INTO enumerators (email, password, name, ward, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, ward, phone, role, status, created_at, updated_at`,
      [email, hashedPassword, name, ward, phone, 'enumerator', 'active']
    );

    return result.rows[0] as Enumerator;
  }

  /**
   * Get enumerator by email and password (login)
   */
  static async authenticateEnumerator(email: string, password: string): Promise<Enumerator> {
    const result = await pool.query(
      'SELECT id, email, password, name, ward, phone, role, status, created_at, updated_at FROM enumerators WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];
    const passwordMatch = await this.comparePassword(password, user.password);

    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as Enumerator;
  }

  /**
   * Get enumerator by email
   */
  static async getEnumeratorByEmail(email: string): Promise<Enumerator | null> {
    const result = await pool.query(
      'SELECT id, email, name, ward, phone, role, status, created_at, updated_at FROM enumerators WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all enumerators
   */
  static async getAllEnumerators(): Promise<Enumerator[]> {
    const result = await pool.query(
      'SELECT id, email, name, ward, phone, role, status, created_at, updated_at FROM enumerators ORDER BY created_at DESC'
    );

    return result.rows as Enumerator[];
  }

  /**
   * Update profile picture URL
   */
  static async updateProfilePicture(email: string, pictureUrl: string): Promise<Enumerator> {
    // First, ensure the column exists by checking if an update would work
    try {
      const result = await pool.query(
        `UPDATE enumerators SET profile_picture_url = $1, updated_at = NOW()
         WHERE email = $2
         RETURNING id, email, name, ward, phone, role, status, created_at, updated_at`,
        [pictureUrl, email]
      );
      if (result.rows.length > 0) {
        return result.rows[0] as Enumerator;
      }
      throw new Error('Enumerator not found');
    } catch (err: any) {
      // If column doesn't exist, just update without it
      if (err.message?.includes('profile_picture_url') || err.message?.includes('does not exist')) {
        const result = await pool.query(
          `UPDATE enumerators SET updated_at = NOW()
           WHERE email = $1
           RETURNING id, email, name, ward, phone, role, status, created_at, updated_at`,
          [email]
        );
        if (result.rows.length > 0) {
          return result.rows[0] as Enumerator;
        }
        throw new Error('Enumerator not found');
      } else {
        throw err;
      }
    }
  }

  /**
   * Complete OTP-verified registration
   */
  static async completeOTPRegistration(data: EnumeratorData): Promise<Enumerator> {
    const { email, password, name, ward, phone } = data;

    // Check if email already exists (shouldn't happen if OTP worked correctly)
    const existingUser = await pool.query(
      'SELECT id FROM enumerators WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Insert new enumerator
    const result = await pool.query(
      `INSERT INTO enumerators (email, password, name, ward, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, ward, phone, role, status, created_at, updated_at`,
      [email, hashedPassword, name, ward, phone, 'enumerator', 'active']
    );

    return result.rows[0] as Enumerator;
  }

  /**
   * Delete an enumerator by ID
   */
  static async deleteEnumerator(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM enumerators WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Delete an enumerator by email
   */
  static async deleteEnumeratorByEmail(email: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM enumerators WHERE email = $1 RETURNING id',
      [email]
    );

    return result.rows.length > 0;
  }
}

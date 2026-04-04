import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geowaste_kilifi',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

// Initialize database with schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Check if enumerators table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enumerators'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      console.warn('⚠ enumerators table not found. Please run: npm run db:init');
      console.log('Database schema needs initialization.');
    } else {
      console.log('✓ enumerators table found');
    }

    // Check if waste_sites table exists
    const wasteTableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'waste_sites'
      )`
    );

    if (!wasteTableCheck.rows[0].exists) {
      console.warn('⚠ waste_sites table not found. Please run: npm run db:init');
    } else {
      console.log('✓ waste_sites table found');
    }
  } catch (err: any) {
    console.error('✗ Database initialization failed:', err.message);
    console.error('Make sure PostgreSQL is running and credentials are correct in .env');
    throw err;
  }
};

export default pool;

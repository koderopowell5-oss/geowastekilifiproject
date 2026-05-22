import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import wasteRoutes from './routes';
import versionRoutes from './versionRoutes';
import { ApiResponse } from './types';
import { initializeDatabase } from './db';
import { runMigrations } from './migrations';

require('dotenv').config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3001';
console.log(`CORS Origin configured for: ${corsOrigin}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(' No origin header (mobile/API request) - allowing');
      return callback(null, true);
    }
    
    // Always allow localhost origins for local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log(` Local development: allowing ${origin}`);
      return callback(null, true);
    }
    
    // In production, check against configured CORS_ORIGIN
    if (origin === corsOrigin) {
      console.log(` Production: allowing ${origin}`);
      return callback(null, true);
    }
    
    // Log denied requests for debugging
    console.warn(`❌ CORS blocked: ${origin} (allowed: ${corsOrigin}, localhost)`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

// API Routes
app.use('/api', versionRoutes);
app.use('/api', wasteRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: `${req.method} ${req.path} does not exist`,
  } as ApiResponse);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  } as ApiResponse);
});

// Global process error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start server
app.listen(PORT, async () => {
  console.log(`\nBackend server running on http://localhost:${PORT}\n`);
  
  try {
    await initializeDatabase();
    console.log('\nDatabase initialized and ready\n');

    // Run database migrations automatically on startup
    await runMigrations();
  } catch (err: any) {
    console.error('\n❌ Database migration failed:', err.message);
    console.error('\nYou can manually create tables and run migrations using psql:');
    console.error('  psql -U postgres -d geowaste_kilifi -f database/schema.sql');
    console.error('  psql -U postgres -d geowaste_kilifi -f database/migration_010_multi_tenancy_fixed.sql');
    console.error('\nThe server is continuing despite the migration error.\n');
  }

  console.log('API Endpoints:');
  console.log(`  Version: http://localhost:${PORT}/api/version (GET), /version/check (GET)`);
  console.log(`  Auth:  http://localhost:${PORT}/api/auth/signup (POST), /login (POST), /enumerators (GET)`);
  console.log(`  Waste: http://localhost:${PORT}/api/waste (POST to create, GET to retrieve)`);
  console.log(`  Health: http://localhost:${PORT}/api/health (GET)\n`);
});

export default app;

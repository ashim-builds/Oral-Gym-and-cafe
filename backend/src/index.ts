process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';
// Server initialization

import path from 'path';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env';
import { connectDB, closePool } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { createUploadsStaticRouter } from './middleware/webpAutoNegotiate';

const app = express();

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Smart WebP Auto-Negotiation Static File Serving for Uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', createUploadsStaticRouter(uploadsDir));
app.use('/api/uploads', createUploadsStaticRouter(uploadsDir));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Orla Gym and Cafe API',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Orla Gym and Cafe REST API',
    documentation: '/api',
    status: 'online',
  });
});

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Resolve Listen Target (cPanel Phusion Passenger or Port)
function getListenTarget(): number | string {
  if (typeof (global as any).PhusionPassenger !== 'undefined') {
    return 'passenger';
  }
  const port = process.env.PORT || ENV.PORT;
  if (!isNaN(Number(port))) {
    return Number(port);
  }
  return port;
}

const target = getListenTarget();
const httpServer = http.createServer(app);

// Shorten keep-alive timeouts so reverse proxy connections release workers immediately
httpServer.keepAliveTimeout = 2000;
httpServer.headersTimeout = 3000;

let server: http.Server;

if (target === 'passenger') {
  server = httpServer.listen('passenger', () => {
    console.log(`\n🏋️‍♂️ ========================================================`);
    console.log(`⚡ Orla Gym and Cafe API is running on Phusion Passenger`);
    console.log(`🔥 Environment: ${ENV.NODE_ENV}`);
    console.log(`📦 Database: MySQL (Prisma)`);
    console.log(`========================================================\n`);
  });
} else {
  server = httpServer.listen(Number(target), '0.0.0.0', () => {
    console.log(`\n🏋️‍♂️ ========================================================`);
    console.log(`⚡ Orla Gym and Cafe API is running on http://localhost:${target}`);
    console.log(`🔥 Environment: ${ENV.NODE_ENV}`);
    console.log(`📦 Database: MySQL (Prisma)`);
    console.log(`📱 OTP Provider: ${ENV.OTP_PROVIDER.toUpperCase()}`);
    console.log(`========================================================\n`);
  });
}

// Background connection test
connectDB().catch((err: any) => {
  console.error('⚠️ [DB] Connection warning on startup:', err?.message || err);
});

// Graceful Shutdown to eliminate orphaned/zombie process accumulation on CloudLinux
const handleGracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    if (typeof (server as any).closeIdleConnections === 'function') {
      (server as any).closeIdleConnections();
    }
    server.close(async () => {
      console.log('🔒 Closed HTTP server connections.');
      try {
        await closePool();
      } catch (err) {
        console.error('Error disconnecting database pool:', err);
      }
      process.exit(0);
    });

    // Forced exit fallback after 4 seconds
    setTimeout(() => {
      console.warn('⚠️ Forcing process exit after shutdown timeout');
      process.exit(0);
    }, 4000).unref();
  } else {
    try {
      await closePool();
    } catch {}
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => handleGracefulShutdown('SIGUSR2'));

export default app;

process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';

import { PrismaClient } from '@prisma/client';

// CloudLinux low-resource pool limits
export const POOL_CONFIG = {
  connectionLimit: 3,
  maxIdle: 2,
  idleTimeout: 30000, // 30 seconds
  pool_timeout: 10,
  queueLimit: 20,
};

// Normalize and enforce connection parameters on DATABASE_URL
let rawUrl = (
  process.env.DATABASE_URL ||
  'mysql://root:root@localhost:3306/oral_gym_db'
).trim();

// Strip accidental surrounding single or double quotes
if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
  rawUrl = rawUrl.slice(1, -1).trim();
}

let finalDbUrl = rawUrl;
if (finalDbUrl.startsWith('mysql://')) {
  try {
    const parsed = new URL(finalDbUrl);
    parsed.searchParams.set('connection_limit', String(POOL_CONFIG.connectionLimit));
    parsed.searchParams.set('pool_timeout', String(POOL_CONFIG.pool_timeout));
    finalDbUrl = parsed.toString();
  } catch {
    if (!finalDbUrl.includes('connection_limit=')) {
      finalDbUrl += (finalDbUrl.includes('?') ? '&' : '?') + `connection_limit=${POOL_CONFIG.connectionLimit}`;
    }
    if (!finalDbUrl.includes('pool_timeout=')) {
      finalDbUrl += `&pool_timeout=${POOL_CONFIG.pool_timeout}`;
    }
  }
  process.env.DATABASE_URL = finalDbUrl;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: finalDbUrl
      ? {
          db: {
            url: finalDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to MySQL database in background
 */
export async function connectDB(): Promise<boolean> {
  if (!finalDbUrl || !finalDbUrl.startsWith('mysql://')) {
    console.error('❌ [DB] Cannot connect to MySQL: DATABASE_URL is not configured or invalid.');
    return false;
  }
  try {
    await prisma.$connect();
    console.log('⚡ Successfully connected to MySQL database via Prisma');
    return true;
  } catch (error: any) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
}

/**
 * Cleanly close all connections in the database pool.
 * Prevents orphaned/zombie connection accumulation on CloudLinux / cPanel.
 */
export async function closePool(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('📦 Successfully closed database connection pool.');
  } catch (err: any) {
    console.error('❌ Error closing database connection pool:', err?.message || err);
  }
}

export default prisma;

// cPanel Phusion Passenger Root Entrypoint
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';

require('./dist/index.js');

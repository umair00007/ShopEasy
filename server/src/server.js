import { env } from './config/env.js'; // first import: loads and validates .env
import { connectDB } from './config/db.js';
import app from './app.js';
import mongoose from 'mongoose';

async function start() {
  try {
    await connectDB(); // don't accept traffic until the DB is ready
    const server = app.listen(env.PORT, () =>
      console.log(`🚀 API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
    );

    // Graceful shutdown: PM2 sends SIGINT/SIGTERM on restart/deploy.
    // We stop accepting new requests, finish in-flight ones, then close the DB.
    const shutdown = (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

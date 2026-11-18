import mongoose from 'mongoose';
import { env } from './env.js';

// Connects to MongoDB Atlas once at startup. Mongoose keeps a connection *pool*
// open and reuses it for every request (opening a new connection per request is slow).
export async function connectDB() {
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('🔁 MongoDB reconnected'));

  const conn = await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000, // fail fast (10s) instead of hanging if Atlas is unreachable
  });
  console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

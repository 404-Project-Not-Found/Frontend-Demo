/**
 * File path: /lib/mongodb.ts
 * Author: Denise Alexander
 * Date Created: 16/09/2025
 */

import mongoose from 'mongoose';

// In mock mode, skip DB connection entirely
const isMock = process.env.NEXT_PUBLIC_ENABLE_MOCK === '1';

// Load the MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI as string;

/**
 * To prevent multiple DB connections, we use a global cache object that persists
 * across hot reloads and API calls.
 */
type Cache = {
  conn: typeof mongoose | null; // active connection instance (if ready)
  promise: Promise<typeof mongoose> | null; // pending connection promise (if still connecting)
};

// Initialises global cache
const g = global as unknown as { _mongooseConnection?: Cache };
const cached: Cache = g._mongooseConnection || { conn: null, promise: null };
g._mongooseConnection = cached;

/**
 * Connects to MongoDB using Mongoose
 * @returns existing connection if already established
 * else, starts a new connection and caches it globally
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  // Reuses cached connection (if it exists)
  if (cached.conn) {
    return cached.conn;
  }

  // In mock mode, skip DB connection entirely
  if (isMock) {
    console.log('[Mock mode] Skipping MongoDB connection');
    return null;
  }

  // Ensure uri exists before attempting connection
  if (!MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  // If no active promise start a new connection
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false, // disable mongoose buffering
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected');
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  // Ensures multiple calls share the same connection
  cached.conn = await cached.promise;
  return cached.conn;
}

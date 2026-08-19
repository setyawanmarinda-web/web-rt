// lib/dbConnect.ts
// Singleton Mongoose connection — re-use connection antar API calls di Next.js

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI ?? '';

if (!MONGO_URI) {
  throw new Error(
    '❌ MONGO_URI tidak ditemukan di environment variables. Pastikan file .env sudah benar.'
  );
}

// Cache connection untuk hot-reload Next.js dev mode
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
if (!global._mongoose) global._mongoose = cached;

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        dbName: 'webrt',
      })
      .then((mg) => {
        console.log('✅ MongoDB Connected');
        return mg;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

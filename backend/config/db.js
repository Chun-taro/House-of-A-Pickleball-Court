import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix DNS resolution for MongoDB Atlas SRV connection strings on Windows networks
if (process.platform === 'win32') {
  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if custom dns servers cannot be set
  }
}

// Global cached connection for Vercel Serverless Function re-use
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://houseofaspickleballcourt_db_user:oGCcoxN7lrp6PfFS@cluster0.pgvk5si.mongodb.net/house_of_as_pickleball?retryWrites=true&w=majority&appName=Cluster0';

  if (cached.conn && mongoose.connection.readyState >= 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((m) => {
      console.log(`MongoDB Atlas Connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

export default connectDB;

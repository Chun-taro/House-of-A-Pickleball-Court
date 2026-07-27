import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix DNS resolution for MongoDB Atlas SRV connection strings on Windows networks only
if (process.platform === 'win32') {
  try {
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if custom dns servers cannot be set
  }
}

let cachedDb = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://houseofaspickleballcourt_db_user:oGCcoxN7lrp6PfFS@cluster0.pgvk5si.mongodb.net/house_of_as_pickleball?retryWrites=true&w=majority&appName=Cluster0';

  if (cachedDb && mongoose.connection.readyState >= 1) {
    return cachedDb;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    cachedDb = conn;
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;

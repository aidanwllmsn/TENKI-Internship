import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to the .env file');
}

let cachedClient = null;

async function dbConnect() {
  if (cachedClient) return cachedClient;

  // Check if the connection is already established
  if (mongoose.connection.readyState >= 1) return mongoose.connection;

  // Connect to the MongoDB server
  cachedClient = await mongoose.connect(MONGODB_URI);

  return cachedClient;
}

export default dbConnect;

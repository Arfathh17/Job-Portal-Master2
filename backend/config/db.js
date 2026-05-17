/**
 * Database configuration with graceful fallback
 * If MongoDB is unavailable, the app runs in "demo mode" using in-memory storage
 */
const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-job-portal';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    isConnected = false;
    console.warn('⚠️  MongoDB not available — running in DEMO MODE (in-memory storage)');
    console.warn(`   Reason: ${err.message}`);
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };

'use strict';

const mongoose = require('mongoose');
const env = require('./env');

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function getMongoCandidates(primaryUri = env.mongoUri) {
  const candidates = [primaryUri, env.localMongoUri];

  return [...new Set(candidates.filter(Boolean))];
}

/**
 * Connect to MongoDB. Returns the live mongoose connection.
 */
async function connectDatabase(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  let lastError;

  for (const candidateUri of getMongoCandidates(uri)) {
    try {
      await mongoose.connect(candidateUri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      });

      const connection = mongoose.connection;

      connection.on('error', (error) => {
        console.error('[db] connection error:', error.message);
      });

      connection.on('disconnected', () => {
        console.warn('[db] disconnected from MongoDB');
      });

      return connection;
    } catch (error) {
      lastError = error;
      console.warn(`[db] connection failed for ${candidateUri}: ${error.message}`);
    }
  }

  throw lastError || new Error('MongoDB connection failed');
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

const getConnectionState = () => READY_STATES[mongoose.connection.readyState] || 'unknown';

module.exports = { connectDatabase, disconnectDatabase, getConnectionState };

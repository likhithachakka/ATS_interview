'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');

async function start() {
  console.log(`[boot] starting API in ${env.nodeEnv} mode...`);

  try {
    await connectDatabase();
    console.log('🚀 MongoDB Connected Successfully');
  } catch (error) {
    // The HTTP server still boots so /api/health can report the problem,
    // but every database backed endpoint will answer 503 until this is fixed.
    console.error(`[db] could not connect to MongoDB: ${error.message}`);
    console.error('[db] start mongod or update MONGODB_URI in backend/.env');
  }

  if (!env.geminiApiKey) {
    console.warn('[gemini] GEMINI_API_KEY is empty - analysis requests will return 503.');
  }

  const server = app.listen(env.port, () => {
    console.log(`[boot] API ready on http://localhost:${env.port}/api/health`);
    console.log(`[boot] allowed CORS origins: ${env.clientOrigins.join(', ')}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[shutdown] received ${signal}, closing gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('[shutdown] bye.');
      process.exit(0);
    });
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
}

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandled promise rejection:', reason);
});

start();

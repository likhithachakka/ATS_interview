'use strict';

require('dotenv').config();

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/interviewiq';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: toInt(process.env.PORT, 5000),

  localMongoUri: process.env.LOCAL_MONGODB_URI || LOCAL_MONGODB_URI,
  mongoUri: process.env.MONGODB_URI || LOCAL_MONGODB_URI,

  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiModelFallbacks: (process.env.GEMINI_MODEL_FALLBACKS || 'gemini-3.5-flash,gemini-2.5-flash,gemini-2.0-flash')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean),

  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 10),
};

module.exports = env;

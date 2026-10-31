'use strict';

const { Router } = require('express');
const env = require('../config/env');
const { getConnectionState } = require('../config/db');
const analysisRoutes = require('./analysis.routes');

const mongoose = require('mongoose');
const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      environment: env.nodeEnv,
      database: getConnectionState(),
      readyState: mongoose.connection.readyState,
      gemini: {
        model: env.geminiModel,
        configured: Boolean(env.geminiApiKey),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/analysis', analysisRoutes);

module.exports = router;

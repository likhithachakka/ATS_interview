'use strict';

const Analysis = require('../models/Analysis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getConnectionState } = require('../config/db');
const { extractResumeText } = require('../services/resumeParser.service');
const geminiService = require('../services/gemini.service');
const { validateAnalysisInput } = require('../utils/validateAnalysisInput');

const PREVIEW_LENGTH = 140;

const assertDatabaseReady = () => {
  if (getConnectionState() !== 'connected') {
    throw new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'MongoDB is not connected. Start mongod or fix MONGODB_URI, then retry.'
    );
  }
};

const toPreview = (text) => {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > PREVIEW_LENGTH ? `${clean.slice(0, PREVIEW_LENGTH)}...` : clean;
};

/**
 * POST /api/analysis
 * Accepts multipart/form-data (resume file + jobDescription) or JSON
 * ({ resumeText, jobDescription }). Returns the Gemini analysis and stores it.
 */
const createAnalysis = asyncHandler(async (req, res) => {
  const uploadedFile = req.file;
  let resumeText = req.body?.resumeText;

  if (uploadedFile) {
    resumeText = await extractResumeText(uploadedFile);
  }

  const payload = validateAnalysisInput({
    resumeText,
    jobDescription: req.body?.jobDescription,
    fileName: uploadedFile?.originalname,
  });

  // Validate first (cheap), then make sure we can persist before spending a Gemini call.
  assertDatabaseReady();

  const { analysis, model, latencyMs } = await geminiService.analyzeResumeAgainstJob({
    resumeText: payload.resumeText,
    jobDescription: payload.jobDescription,
  });

  const document = await Analysis.create({
    ...payload,
    ...analysis,
    model,
    latencyMs,
  });

  res.status(201).json({
    success: true,
    data: document.toJSON(),
    meta: { model, latencyMs },
  });
});

/**
 * GET /api/analysis?limit=20
 * Lightweight history feed (resume / JD bodies are omitted).
 */
const listAnalyses = asyncHandler(async (req, res) => {
  assertDatabaseReady();

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);

  const documents = await Analysis.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('fileName jobDescription atsScore matchLevel summary missingKeywords interviewQuestions createdAt')
    .lean();

  const data = documents.map((doc) => ({
    id: doc._id.toString(),
    fileName: doc.fileName,
    atsScore: doc.atsScore,
    matchLevel: doc.matchLevel,
    summary: doc.summary,
    missingKeywordCount: (doc.missingKeywords || []).length,
    interviewQuestionCount: (doc.interviewQuestions || []).length,
    jobPreview: toPreview(doc.jobDescription),
    createdAt: doc.createdAt,
  }));

  res.json({ success: true, data, meta: { count: data.length } });
});

/**
 * GET /api/analysis/:id
 */
const getAnalysis = asyncHandler(async (req, res) => {
  assertDatabaseReady();

  const document = await Analysis.findById(req.params.id);
  if (!document) throw ApiError.notFound(`No analysis found with id ${req.params.id}.`);

  res.json({ success: true, data: document.toJSON() });
});

/**
 * DELETE /api/analysis/:id
 */
const deleteAnalysis = asyncHandler(async (req, res) => {
  assertDatabaseReady();

  const document = await Analysis.findByIdAndDelete(req.params.id);
  if (!document) throw ApiError.notFound(`No analysis found with id ${req.params.id}.`);

  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = { createAnalysis, listAnalyses, getAnalysis, deleteAnalysis };

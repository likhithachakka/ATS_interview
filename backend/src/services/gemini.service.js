'use strict';

const { GoogleGenAI, Type } = require('@google/genai');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { SYSTEM_INSTRUCTION, buildAnalysisPrompt } = require('../utils/promptBuilder');

/**
 * Structured output contract. Gemini is forced to answer with this exact shape,
 * so the response can be persisted and returned to the client without guessing.
 */
const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    atsScore: {
      type: Type.INTEGER,
      description: 'ATS match score from 0 (no match) to 100 (perfect match).',
    },
    matchLevel: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'Qualitative bucket derived from atsScore.',
    },
    summary: {
      type: Type.STRING,
      description: 'Two to three sentences addressed to the candidate explaining the score.',
    },
    missingKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Important keywords from the job description that are absent from the resume.',
    },
    matchedKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Keywords present in both the resume and the job description.',
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Concrete edits that would improve the ATS score.',
    },
    interviewQuestions: {
      type: Type.ARRAY,
      description: 'Exactly 3 interview questions tailored to this resume and job description.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          category: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
        },
        required: ['question', 'category', 'whyItMatters'],
      },
    },
  },
  required: [
    'atsScore',
    'matchLevel',
    'summary',
    'missingKeywords',
    'matchedKeywords',
    'suggestions',
    'interviewQuestions',
  ],
};

const REQUIRED_QUESTION_COUNT = 3;
const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);

let client = null;

function getClient() {
  if (!env.geminiApiKey) {
    throw new ApiError(
      503,
      'GEMINI_NOT_CONFIGURED',
      'GEMINI_API_KEY is missing on the server. Add it to backend/.env and restart the API.'
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
};

const toStringArray = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];

const scoreToLevel = (score) => (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');

/**
 * Force the model output into the exact contract the app (and the DB schema) expects.
 */
function normaliseAnalysis(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(502, 'GEMINI_BAD_RESPONSE', 'Gemini returned an unreadable response.');
  }

  const atsScore = clampScore(raw.atsScore);
  const allowedLevels = ['Low', 'Medium', 'High'];

  const interviewQuestions = (Array.isArray(raw.interviewQuestions) ? raw.interviewQuestions : [])
    .slice(0, REQUIRED_QUESTION_COUNT)
    .map((item) => ({
      question: typeof item?.question === 'string' ? item.question.trim() : '',
      category: typeof item?.category === 'string' && item.category.trim() ? item.category.trim() : 'General',
      whyItMatters: typeof item?.whyItMatters === 'string' ? item.whyItMatters.trim() : '',
    }))
    .filter((item) => item.question);

  if (interviewQuestions.length !== REQUIRED_QUESTION_COUNT) {
    throw new ApiError(
      502,
      'GEMINI_INCOMPLETE_RESPONSE',
      `Gemini returned ${interviewQuestions.length} interview question(s) instead of ${REQUIRED_QUESTION_COUNT}. Please retry.`
    );
  }

  return {
    atsScore,
    matchLevel: allowedLevels.includes(raw.matchLevel) ? raw.matchLevel : scoreToLevel(atsScore),
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    missingKeywords: toStringArray(raw.missingKeywords),
    matchedKeywords: toStringArray(raw.matchedKeywords),
    suggestions: toStringArray(raw.suggestions),
    interviewQuestions,
  };
}

/**
 * Maps an SDK / network failure onto a friendly ApiError.
 */
function toApiError(error) {
  if (error instanceof ApiError) return error;

  const status = error?.status ?? error?.code;
  const message = error?.message || 'Unknown Gemini error';

  if (RETRYABLE_STATUS.has(Number(status))) {
    return new ApiError(503, 'GEMINI_UNAVAILABLE', `Gemini is temporarily unavailable. ${message}`);
  }
  if (Number(status) === 400 && /api key/i.test(message)) {
    return new ApiError(401, 'GEMINI_INVALID_KEY', 'The configured GEMINI_API_KEY was rejected.');
  }
  if (Number(status) === 403) {
    return new ApiError(403, 'GEMINI_FORBIDDEN', `Gemini denied the request. ${message}`);
  }
  if (Number(status) === 404) {
    return new ApiError(400, 'GEMINI_MODEL_NOT_FOUND', `Model "${env.geminiModel}" is not available. ${message}`);
  }
  return new ApiError(502, 'GEMINI_ERROR', `Gemini request failed. ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ask Gemini for one analysis attempt.
 */
async function requestAnalysis({ resumeText, jobDescription }) {
  const ai = getClient();
  const modelCandidates = [...new Set([env.geminiModel, ...env.geminiModelFallbacks].filter(Boolean))];
  let lastError;

  for (const modelName of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: buildAnalysisPrompt({ resumeText, jobDescription }),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.35,
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        },
      });

      return response.text;
    } catch (error) {
      const normalized = toApiError(error);
      lastError = normalized;

      if (normalized.code !== 'GEMINI_MODEL_NOT_FOUND') {
        throw normalized;
      }

      console.warn(`[gemini] model ${modelName} unavailable, retrying with next candidate`);
    }
  }

  throw lastError || new Error('No Gemini model could be used.');
}

/**
 * Public entry point: analyze a resume against a job description.
 * @returns {Promise<object>} the normalised analysis payload
 */
async function analyzeResumeAgainstJob({ resumeText, jobDescription }) {
  const startedAt = Date.now();
  const maxAttempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const text = await requestAnalysis({ resumeText, jobDescription });
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ApiError(502, 'GEMINI_BAD_JSON', 'Gemini did not return valid JSON.');
      }

      return {
        analysis: normaliseAnalysis(parsed),
        model: env.geminiModel,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      lastError = toApiError(error);
      const retryable = lastError.code === 'GEMINI_UNAVAILABLE' || lastError.code === 'GEMINI_ERROR';
      if (!retryable || attempt === maxAttempts) break;
      await sleep(600 * attempt);
    }
  }

  throw lastError;
}

module.exports = {
  analyzeResumeAgainstJob,
  ANALYSIS_RESPONSE_SCHEMA,
  REQUIRED_QUESTION_COUNT,
};

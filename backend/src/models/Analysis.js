'use strict';

const mongoose = require('mongoose');

const MATCH_LEVELS = ['Low', 'Medium', 'High'];

/**
 * A single AI generated interview question, tailored to the resume + JD pair.
 */
const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    whyItMatters: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/**
 * One resume <-> job description analysis produced by Gemini.
 */
const analysisSchema = new mongoose.Schema(
  {
    fileName: { type: String, default: null },

    resumeText: { type: String, required: true, trim: true },
    jobDescription: { type: String, required: true, trim: true },

    atsScore: { type: Number, required: true, min: 0, max: 100 },
    matchLevel: { type: String, enum: MATCH_LEVELS, default: 'Medium' },
    summary: { type: String, default: '', trim: true },

    missingKeywords: { type: [String], default: [] },
    matchedKeywords: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },

    interviewQuestions: { type: [interviewQuestionSchema], default: [] },

    // Observability: which model produced the result and how long it took.
    model: { type: String, default: null },
    latencyMs: { type: Number, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

analysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
module.exports.MATCH_LEVELS = MATCH_LEVELS;

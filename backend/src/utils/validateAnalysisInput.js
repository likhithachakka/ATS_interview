'use strict';

const ApiError = require('../utils/ApiError');

const MIN_RESUME_CHARS = 80;
const MIN_JD_CHARS = 40;

const toCleanString = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Validates and normalises the analysis payload coming from the client.
 * `resumeText` may arrive as a form field, `jobDescription` must always be present.
 */
function validateAnalysisInput({ resumeText, jobDescription, fileName }) {
  const resume = toCleanString(resumeText);
  const jd = toCleanString(jobDescription);

  const errors = {};

  if (!resume) {
    errors.resumeText = 'Provide a resume by uploading a file or pasting the text.';
  } else if (resume.length < MIN_RESUME_CHARS) {
    errors.resumeText = `The resume looks too short (minimum ${MIN_RESUME_CHARS} characters).`;
  }

  if (!jd) {
    errors.jobDescription = 'A job description is required.';
  } else if (jd.length < MIN_JD_CHARS) {
    errors.jobDescription = `The job description looks too short (minimum ${MIN_JD_CHARS} characters).`;
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.unprocessable('The submitted resume / job description is invalid.', errors);
  }

  return {
    resumeText: resume,
    jobDescription: jd,
    fileName: toCleanString(fileName) || null,
  };
}

module.exports = { validateAnalysisInput, MIN_RESUME_CHARS, MIN_JD_CHARS };

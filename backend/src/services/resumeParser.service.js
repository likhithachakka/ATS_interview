'use strict';

const path = require('node:path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const ApiError = require('../utils/ApiError');

const MAX_EXTRACTED_CHARS = 40000;

/**
 * MIME type -> extractor. Kept intentionally small: PDF, DOCX, plain text and Markdown.
 */
const PLAIN_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream', // some browsers send this for .md/.txt
]);

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

function extractPlainText(buffer) {
  return buffer.toString('utf8');
}

/**
 * Turn an uploaded file buffer into normalised plain text.
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file
 * @returns {Promise<string>}
 */
async function extractResumeText(file) {
  if (!file || !file.buffer) {
    throw ApiError.badRequest('No resume file was received.');
  }

  const extension = path.extname(file.originalname || '').toLowerCase();
  let text = '';

  try {
    if (extension === '.pdf' || file.mimetype === 'application/pdf') {
      text = await extractPdf(file.buffer);
    } else if (
      extension === '.docx' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractDocx(file.buffer);
    } else if (extension === '.txt' || extension === '.md' || PLAIN_TEXT_TYPES.has(file.mimetype)) {
      text = extractPlainText(file.buffer);
    } else {
      throw ApiError.badRequest(
        `Unsupported file type "${extension || file.mimetype}". Upload a .pdf, .docx, .txt or .md file.`
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unprocessable(`Could not read "${file.originalname}". ${error.message}`);
  }

  const normalised = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  if (!normalised) {
    throw ApiError.unprocessable(
      `No text could be extracted from "${file.originalname}". If it is a scanned PDF, paste the text instead.`
    );
  }

  return normalised.slice(0, MAX_EXTRACTED_CHARS);
}

module.exports = { extractResumeText, MAX_EXTRACTED_CHARS };

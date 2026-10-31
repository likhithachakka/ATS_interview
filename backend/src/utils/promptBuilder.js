'use strict';

const MAX_RESUME_CHARS = 20000;
const MAX_JD_CHARS = 12000;

const SYSTEM_INSTRUCTION = [
  'You are a senior technical recruiter, an ATS (Applicant Tracking System) optimization expert,',
  'and a hiring manager who has screened tens of thousands of resumes.',
  'You evaluate how well a candidate resume matches a specific job description.',
  'You are precise, evidence based and never invent experience that is not present in the resume.',
  'You always answer with a single valid JSON object that matches the requested schema.',
].join(' ');

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max)}\n...[truncated]` : text;

const buildAnalysisPrompt = ({ resumeText, jobDescription }) => `
Analyse the candidate resume against the target job description below.

<resume>
${truncate(resumeText, MAX_RESUME_CHARS)}
</resume>

<job_description>
${truncate(jobDescription, MAX_JD_CHARS)}
</job_description>

Return a JSON object with exactly these fields:

- "atsScore": integer 0-100. How well an ATS and a human screener would rate this resume for THIS job.
  Weigh: required skills coverage, relevant experience, quantified impact, keyword alignment,
  formatting/keyword density readability. 0-39 = poor, 40-69 = partial, 70-89 = strong, 90-100 = excellent.
- "matchLevel": "Low" | "Medium" | "High" - derived from atsScore.
- "summary": 2-3 sentences addressed to the candidate, explaining the score.
- "missingKeywords": 6-15 short keywords/phrases that the job description asks for but the resume
  does not clearly show. Prefer concrete skills, tools and domain terms.
- "matchedKeywords": 6-15 short keywords/phrases that appear in BOTH the resume and the job description.
- "suggestions": 3-5 actionable, specific edits that would raise the score. Each one sentence.
- "interviewQuestions": EXACTLY 3 interview questions. These must be tailored to the gap between this
  resume and this job - probe the missing keywords and the candidate's weakest areas. For each question:
    - "question": the question a real interviewer would ask.
    - "category": a short label such as "Technical", "System Design", "Behavioural" or "Domain".
    - "whyItMatters": one sentence on what the interviewer is testing.

Rules:
- "interviewQuestions" MUST contain exactly 3 items.
- Never invent employers, degrees, years of experience or projects that are not in the resume.
- Do not wrap the JSON in markdown code fences.
`.trim();

const buildInterviewQuestionsPrompt = ({ resumeText, jobDescription, count = 3 }) => `
You are a senior interviewer. Based on the resume and job description below, write ${count} tailored
interview questions. Answer with a JSON object containing a single key "interviewQuestions".

<resume>
${truncate(resumeText, MAX_RESUME_CHARS)}
</resume>

<job_description>
${truncate(jobDescription, MAX_JD_CHARS)}
</job_description>

Each item must have "question", "category" and "whyItMatters". Return exactly ${count} items.
`.trim();

module.exports = {
  SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
  buildInterviewQuestionsPrompt,
  MAX_RESUME_CHARS,
  MAX_JD_CHARS,
};

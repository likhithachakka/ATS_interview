const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * Thin fetch wrapper that understands the API response envelope:
 *   success -> { success: true, data, meta }
 *   failure -> { success: false, error: { code, message, details } }
 */
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('Cannot reach the API. Is the backend running on port 5000?');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || `Request failed with status ${response.status}.`);
    error.code = payload?.error?.code;
    error.details = payload?.error?.details;
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const getHealth = () => request('/health');

/**
 * Analyze a resume against a job description.
 * Sends multipart/form-data so a file OR pasted text can be used interchangeably.
 */
export async function analyzeResume({ resumeFile, resumeText, jobDescription }) {
  const formData = new FormData();

  if (resumeFile) formData.append('resume', resumeFile);
  if (resumeText) formData.append('resumeText', resumeText);
  formData.append('jobDescription', jobDescription);

  const payload = await request('/analysis', { method: 'POST', body: formData });
  return payload.data;
}

export async function listAnalyses(limit = 20) {
  const payload = await request(`/analysis?limit=${limit}`);
  return payload.data;
}

export async function getAnalysis(id) {
  const payload = await request(`/analysis/${id}`);
  return payload.data;
}

export async function deleteAnalysis(id) {
  await request(`/analysis/${id}`, { method: 'DELETE' });
  return id;
}

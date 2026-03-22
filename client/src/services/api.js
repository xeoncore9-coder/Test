const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// Projects
export const getProjects = () => request('/projects');
export const getProject = (id) => request(`/projects/${id}`);
export const deleteProject = (id) => request(`/projects/${id}`, { method: 'DELETE' });

export async function uploadFile(file, name, sourceLang, targetLang) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name || file.name);
  formData.append('sourceLang', sourceLang);
  formData.append('targetLang', targetLang);

  const res = await fetch(`${BASE}/projects/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export const updateSegment = (projectId, segmentId, data) =>
  request(`/projects/${projectId}/segments/${segmentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const confirmSegment = (projectId, segmentId) =>
  request(`/projects/${projectId}/segments/${segmentId}/confirm`, { method: 'POST' });

export function exportProject(projectId) {
  window.open(`${BASE}/projects/${projectId}/export`, '_blank');
}

// TM
export const getTM = () => request('/tm');
export const searchTM = (q, min = 50) => request(`/tm/search?q=${encodeURIComponent(q)}&min=${min}`);
export const addTMEntry = (data) => request('/tm', { method: 'POST', body: JSON.stringify(data) });
export const deleteTMEntry = (index) => request(`/tm/${index}`, { method: 'DELETE' });

// Glossary
export const getGlossary = () => request('/glossary');
export const searchGlossary = (q) => request(`/glossary/search?q=${encodeURIComponent(q)}`);
export const addGlossaryEntry = (data) => request('/glossary', { method: 'POST', body: JSON.stringify(data) });
export const updateGlossaryEntry = (id, data) => request(`/glossary/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGlossaryEntry = (id) => request(`/glossary/${id}`, { method: 'DELETE' });
export const checkGlossary = (text) => request('/glossary/check', { method: 'POST', body: JSON.stringify({ text }) });

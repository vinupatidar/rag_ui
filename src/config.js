// Centralized backend base URL config for the frontend (CRA)
// CRA only exposes env vars prefixed with REACT_APP_

function ensureTrailingSlash(url) {
  if (!url) return '/';
  return url.endsWith('/') ? url : url + '/';
}

export const BACKEND_BASE_URL = ensureTrailingSlash(
  process.env.REACT_APP_BACKEND_BASE_URL || 'http://localhost:4000/'
);

export function apiUrl(path) {
  const cleanPath = String(path || '').replace(/^\//, '');
  return BACKEND_BASE_URL + cleanPath;
}



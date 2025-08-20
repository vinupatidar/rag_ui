// Centralized backend base URL config for the frontend (CRA)
// CRA only exposes env vars prefixed with REACT_APP_

function ensureTrailingSlash(url) {
  if (!url) return '/';
  return url.endsWith('/') ? url : url + '/';
}

// Prefer CRA env var. If absent and we're not on localhost,
// fall back to same-origin so it works on Vercel without extra config.
let resolvedBase = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
if (!resolvedBase && typeof window !== 'undefined') {
  const isLocalhost = /localhost|127\.0\.0\.1/.test(window.location.hostname);
  resolvedBase = isLocalhost ? 'http://localhost:4000/' :  'https://rag-node-ten.vercel.app/'; //`${window.location.origin}/`;
}

export const BACKEND_BASE_URL = ensureTrailingSlash(resolvedBase);

export function apiUrl(path) {
  const cleanPath = String(path || '').replace(/^\//, '');
  return BACKEND_BASE_URL + cleanPath;
}



const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function withApiBase(path) {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"');
  }
  return `${API_BASE_URL}${path}`;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(withApiBase(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) =>
    apiFetch(path, {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

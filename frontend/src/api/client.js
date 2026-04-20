const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
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

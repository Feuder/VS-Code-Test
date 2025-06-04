const BASE_URL = 'http://localhost:3000';

export function checkLoginStatus() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'Login.html';
    return;
  }
  apiFetch('/verify-token', { method: 'GET' })
    .catch(() => {
      localStorage.removeItem('token');
      window.location.href = 'Login.html';
    });
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let err = response.statusText;
    try {
      const json = await response.json();
      err = json.message || JSON.stringify(json);
    } catch {}
    throw new Error(`API-Fehler: ${err}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'Login.html';
}
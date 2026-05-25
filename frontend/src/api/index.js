const BASE_URL = 'http://127.0.0.1:8000/api';

function getToken() {
  return localStorage.getItem('access_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/';
      return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data.detail || data.error || JSON.stringify(data);
      throw new Error(message);
    }

    return data;

  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Make sure Django and Express are running.');
    }
    throw err;
  }
}

export const auth = {
  register: (data) =>
    request('/auth/register/', { method: 'POST', body: JSON.stringify(data) }),

  login: async (credentials) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  me: () => request('/auth/me/'),
};

export const projects = {
  list: (search = '') =>
    request(`/projects/${search ? `?search=${search}` : ''}`),

  get: (id) => request(`/projects/${id}/`),

  create: (data) =>
    request('/projects/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    request(`/projects/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id) =>
    request(`/projects/${id}/`, { method: 'DELETE' }),
};

export const tasks = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/tasks/${params ? `?${params}` : ''}`);
  },

  get: (id) => request(`/tasks/${id}/`),

  create: (data) =>
    request('/tasks/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    request(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id) =>
    request(`/tasks/${id}/`, { method: 'DELETE' }),
};
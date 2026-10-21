const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const token = localStorage.getItem('campus_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem('campus_token');
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  categories: () => request('/meta/categories'),
  departments: () => request('/meta/departments'),
  studentSummary: () => request('/complaints/summary/student'),
  adminSummary: () => request('/complaints/summary/admin'),
  complaints: (query = '') => request(`/complaints${query ? `?${query}` : ''}`),
  complaint: (id) => request(`/complaints/${id}`),
  createComplaint: (payload) => request('/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  updateComplaint: (id, payload) => request(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addUpdate: (id, comment) => request(`/complaints/${id}/updates`, { method: 'POST', body: JSON.stringify({ comment }) }),
  notifications: () => request('/notifications'),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  upvoteComplaint: (id) => request(`/complaints/${id}/upvote`, { method: 'POST' }),
  rateComplaint: (id, rating, feedback) => request(`/complaints/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, feedback }) }),
  getSettings: () => request('/meta/settings'),
  updateSettings: (payload) => request('/meta/settings', { method: 'POST', body: JSON.stringify(payload) }),
  exportCsvUrl: () => {
    const token = localStorage.getItem('campus_token');
    return `${API_BASE}/complaints/export/csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }
};

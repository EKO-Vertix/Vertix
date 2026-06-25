// Cliente del API.
// - En desarrollo: VITE_API_URL vacío → usa el proxy /api de Vite hacia localhost:4000.
// - En producción: define VITE_API_URL con la URL pública del backend (sin /api al final),
//   p.ej. VITE_API_URL=https://vertix-api.onrender.com
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';
let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está arrancado el backend?');
  }
  if (res.status === 401 && onUnauthorized) onUnauthorized();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ha ocurrido un error');
  return data;
}

export const api = {
  register: (d) => request('/auth/register', { method: 'POST', body: d, auth: false }),
  login: (d) => request('/auth/login', { method: 'POST', body: d, auth: false }),
  me: () => request('/auth/me'),

  listBets: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request('/bets' + (q ? `?${q}` : ''));
  },
  createBet: (d) => request('/bets', { method: 'POST', body: d }),
  updateBet: (id, d) => request(`/bets/${id}`, { method: 'PATCH', body: d }),
  deleteBet: (id) => request(`/bets/${id}`, { method: 'DELETE' }),

  summary: () => request('/stats/summary'),
  calendar: (month) => request(`/stats/calendar?month=${month}`),
  monthly: (year) => request(`/stats/monthly?year=${year}`),

  adminStats: () => request('/admin/stats'),
};

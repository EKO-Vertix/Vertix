// Cliente del API.
// - En desarrollo: VITE_API_URL vacío → usa el proxy /api de Vite hacia localhost:4000.
// - En producción: VITE_API_URL con la URL pública del backend (sin /api al final).
//
// El backend envuelve las respuestas en { data, meta } y los errores en
// { error: { code, message, details } }. Aquí lo "desenvolvemos" para que los
// componentes sigan recibiendo { bets } / { bet } como siempre.
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
    throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.');
  }
  if (res.status === 401 && onUnauthorized) onUnauthorized();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Soporta { error: { message } } (nuevo) y { error: "texto" } (antiguo).
    const err = data && data.error;
    const msg = (err && typeof err === 'object' ? err.message : err) || 'Ha ocurrido un error';
    throw new Error(msg);
  }
  return data;
}

export const api = {
  register: (d) => request('/auth/register', { method: 'POST', body: d, auth: false }),
  login: (d) => request('/auth/login', { method: 'POST', body: d, auth: false }),
  me: () => request('/auth/me'),

  listBets: async (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    const r = await request('/bets' + (q ? `?${q}` : ''));
    return { bets: r.data ?? r.bets ?? [], meta: r.meta };
  },
  createBet: async (d) => {
    const r = await request('/bets', { method: 'POST', body: d });
    return { bet: r.data ?? r.bet };
  },
  updateBet: async (id, d) => {
    const r = await request(`/bets/${id}`, { method: 'PATCH', body: d });
    return { bet: r.data ?? r.bet };
  },
  deleteBet: (id) => request(`/bets/${id}`, { method: 'DELETE' }),

  summary: () => request('/stats/summary'),
  calendar: (month) => request(`/stats/calendar?month=${month}`),
  monthly: (year) => request(`/stats/monthly?year=${year}`),

  adminStats: async () => {
    const r = await request('/admin/stats');
    const d = r.data ?? r;
    return {
      users: (d.users && typeof d.users === 'object') ? d.users.total : (d.users ?? 0),
      newThisWeek: d.users && typeof d.users === 'object' ? d.users.newThisWeek : undefined,
      recentUsers: d.recentUsers ?? [],
      betsStats: d.bets,
    };
  },
};

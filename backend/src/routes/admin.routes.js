import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';

// Email con acceso de administración. Configurable por entorno; por defecto, el dueño.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'anwarmendsdeniali@gmail.com').toLowerCase();

const router = Router();
router.use(authRequired);

// Solo el administrador puede acceder a estas rutas.
router.use((req, res, next) => {
  if ((req.user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Acceso restringido' });
  }
  next();
});

// Estadísticas globales de toda la base de datos.
router.get('/stats', wrap(async (req, res) => {
  const [u, b, staked, recent] = await Promise.all([
    query('SELECT count(*)::int AS n FROM users'),
    query('SELECT count(*)::int AS n FROM bets'),
    query('SELECT COALESCE(SUM(total_stake), 0)::float AS s FROM bets'),
    query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10'),
  ]);
  res.json({
    users: u.rows[0].n,
    bets: b.rows[0].n,
    totalStaked: Math.round(staked.rows[0].s * 100) / 100,
    recentUsers: recent.rows,
  });
}));

export default router;

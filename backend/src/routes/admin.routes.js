import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'anwarmendsdeniali@gmail.com').toLowerCase();

const router = Router();
router.use(authRequired);

router.use((req, res, next) => {
  if ((req.user.email || '').toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Acceso restringido' } });
  }
  next();
});

router.get('/stats', wrap(async (req, res) => {
  const [users, bets, recent] = await Promise.all([
    query(`
      SELECT
        COUNT(*)::int                                           AS total_users,
        COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS new_this_week
      FROM users
    `),
    query(`
      SELECT
        COUNT(*)::int                                                     AS total_bets,
        COUNT(*) FILTER (WHERE status = 'pending')::int                  AS pending,
        COUNT(*) FILTER (WHERE status = 'won')::int                      AS won,
        COUNT(*) FILTER (WHERE status = 'lost')::int                     AS lost,
        COALESCE(SUM(total_stake), 0)::float                             AS total_staked,
        COALESCE(SUM(CASE
          WHEN status = 'void'    THEN 0
          WHEN status = 'pending' THEN expected_profit
          ELSE COALESCE(actual_profit, expected_profit)
        END), 0)::float                                                   AS total_profit,
        COALESCE(AVG(profit_pct), 0)::float                              AS avg_profit_pct
      FROM bets
    `),
    query('SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10'),
  ]);

  const b = bets.rows[0];
  const u = users.rows[0];

  res.json({
    data: {
      users: {
        total:       u.total_users,
        newThisWeek: u.new_this_week,
      },
      bets: {
        total:        b.total_bets,
        pending:      b.pending,
        won:          b.won,
        lost:         b.lost,
        totalStaked:  Math.round(Number(b.total_staked) * 100) / 100,
        totalProfit:  Math.round(Number(b.total_profit) * 100) / 100,
        avgProfitPct: Math.round(Number(b.avg_profit_pct) * 100) / 100,
      },
      recentUsers: recent.rows,
    },
  });
}));

export default router;

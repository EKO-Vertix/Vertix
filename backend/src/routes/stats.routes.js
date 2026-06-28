import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';

const router = Router();
router.use(authRequired);

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

router.get('/summary', wrap(async (req, res) => {
  const ym = new Date().toISOString().slice(0, 7);

  const r = await query(`
    SELECT
      COUNT(*)::int                                                               AS count,
      COUNT(*) FILTER (WHERE status = 'pending')::int                            AS pending,
      COUNT(*) FILTER (WHERE status <> 'pending')::int                           AS settled,
      COUNT(*) FILTER (WHERE status = 'won')::int                                AS won,
      COALESCE(SUM(total_stake), 0)                                              AS total_staked,
      COALESCE(SUM(CASE
        WHEN status = 'void'    THEN 0
        WHEN status = 'pending' THEN expected_profit
        ELSE COALESCE(actual_profit, expected_profit)
      END), 0)                                                                   AS total_profit,
      COALESCE(SUM(CASE WHEN substr(placed_at, 1, 7) = $2 THEN
        CASE
          WHEN status = 'void'    THEN 0
          WHEN status = 'pending' THEN expected_profit
          ELSE COALESCE(actual_profit, expected_profit)
        END ELSE 0 END), 0)                                                      AS month_profit,
      COALESCE(MAX(CASE
        WHEN status = 'void'    THEN 0
        WHEN status = 'pending' THEN expected_profit
        ELSE COALESCE(actual_profit, expected_profit)
      END), 0)                                                                   AS best_profit,
      COALESCE(AVG(CASE
        WHEN status NOT IN ('pending','void') THEN COALESCE(actual_profit, expected_profit)
      END), 0)                                                                   AS avg_profit
    FROM bets
    WHERE user_id = $1
  `, [req.user.id, ym]);

  const row = r.rows[0];
  const totalProfit  = round2(Number(row.total_profit));
  const totalStaked  = round2(Number(row.total_staked));
  const { settled, won } = row;

  res.json({
    count:        row.count,
    pending:      row.pending,
    settled,
    won,
    winRate:      settled ? round2((won / settled) * 100) : 0,
    totalStaked,
    totalProfit,
    monthProfit:  round2(Number(row.month_profit)),
    bestProfit:   round2(Number(row.best_profit)),
    avgProfit:    round2(Number(row.avg_profit)),
    roi:          totalStaked ? round2((totalProfit / totalStaked) * 100) : 0,
  });
}));

router.get('/calendar', wrap(async (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));

  const r = await query(`
    SELECT
      placed_at                                         AS date,
      COUNT(*)::int                                     AS count,
      COUNT(*) FILTER (WHERE status = 'pending')::int  AS pending,
      COALESCE(SUM(total_stake), 0)                    AS stake,
      COALESCE(SUM(CASE
        WHEN status = 'void'    THEN 0
        WHEN status = 'pending' THEN expected_profit
        ELSE COALESCE(actual_profit, expected_profit)
      END), 0)                                          AS profit
    FROM bets
    WHERE user_id = $1 AND substr(placed_at, 1, 7) = $2
    GROUP BY placed_at
    ORDER BY placed_at
  `, [req.user.id, month]);

  const days = r.rows.map((d) => ({
    date:    d.date,
    count:   d.count,
    pending: d.pending,
    stake:   round2(Number(d.stake)),
    profit:  round2(Number(d.profit)),
  }));

  res.json({ month, days });
}));

router.get('/monthly', wrap(async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());

  const r = await query(`
    SELECT
      substr(placed_at, 1, 7)                          AS month,
      COUNT(*)::int                                     AS count,
      COUNT(*) FILTER (WHERE status = 'won')::int      AS won,
      COUNT(*) FILTER (WHERE status <> 'pending')::int AS settled,
      COALESCE(SUM(total_stake), 0)                    AS stake,
      COALESCE(SUM(CASE
        WHEN status = 'void'    THEN 0
        WHEN status = 'pending' THEN expected_profit
        ELSE COALESCE(actual_profit, expected_profit)
      END), 0)                                          AS profit
    FROM bets
    WHERE user_id = $1 AND substr(placed_at, 1, 4) = $2
    GROUP BY substr(placed_at, 1, 7)
    ORDER BY month
  `, [req.user.id, year]);

  const months = r.rows.map((m) => {
    const profit = round2(Number(m.profit));
    const stake  = round2(Number(m.stake));
    return {
      month:   m.month,
      count:   m.count,
      won:     m.won,
      settled: m.settled,
      winRate: m.settled ? round2((m.won / m.settled) * 100) : 0,
      stake,
      profit,
      roi:     stake ? round2((profit / stake) * 100) : 0,
    };
  });

  res.json({ year, months });
}));

export default router;

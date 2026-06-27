import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';
import { calcArbitrage } from '../arb.js';

const router = Router();
router.use(authRequired);

function parseBet(row) {
  return { ...row, legs: safeParse(row.legs) };
}
function safeParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

// Listado con filtros opcionales (?from=YYYY-MM-DD&to=...&status=...)
router.get('/', wrap(async (req, res) => {
  const { from, to, status } = req.query;
  let sql = 'SELECT * FROM bets WHERE user_id = $1';
  const params = [req.user.id];
  let i = 2;
  if (from) { sql += ` AND placed_at >= $${i++}`; params.push(String(from)); }
  if (to) { sql += ` AND placed_at <= $${i++}`; params.push(String(to)); }
  if (status) { sql += ` AND status = $${i++}`; params.push(String(status)); }
  sql += ' ORDER BY placed_at DESC, id DESC';
  const r = await query(sql, params);
  res.json({ bets: r.rows.map(parseBet) });
}));

router.get('/:id', wrap(async (req, res) => {
  const r = await query('SELECT * FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Apuesta no encontrada' });
  res.json({ bet: parseBet(r.rows[0]) });
}));

router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.event) return res.status(400).json({ error: 'El evento es obligatorio' });
  const legs = Array.isArray(b.legs) ? b.legs : [];

  // El importe sale de total_stake o, si no, de la suma de los stakes de las patas.
  const totalStake = Number(b.total_stake) || legs.reduce((a, l) => a + (Number(l.stake) || 0), 0);
  if (!(totalStake > 0)) return res.status(400).json({ error: 'El importe debe ser mayor que 0' });

  // Con 2+ resultados (surebet) se puede recalcular el arbitraje en el servidor.
  // Con menos (apuesta manual: simple, combinada…) se usan los valores enviados.
  const calc = legs.length >= 2 ? calcArbitrage(legs.map((l) => Number(l.odds)), totalStake) : null;
  const expected = b.expected_profit != null ? Number(b.expected_profit) : (calc ? calc.guaranteedProfit : 0);
  const profitPct = b.profit_pct != null
    ? Number(b.profit_pct)
    : (calc ? calc.profitPctRealized : Math.round((expected / totalStake) * 10000) / 100);
  const placedAt = b.placed_at || new Date().toISOString().slice(0, 10);

  const r = await query(`
    INSERT INTO bets
      (user_id, event, sport, market, legs, total_stake, expected_profit, profit_pct, status, actual_profit, placed_at, settled_at, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    req.user.id,
    String(b.event),
    b.sport ? String(b.sport) : null,
    b.market ? String(b.market) : null,
    JSON.stringify(legs),
    totalStake,
    expected,
    profitPct,
    b.status ? String(b.status) : 'pending',
    b.actual_profit != null ? Number(b.actual_profit) : null,
    String(placedAt),
    b.settled_at ? String(b.settled_at) : null,
    b.notes ? String(b.notes) : null,
  ]);

  res.status(201).json({ bet: parseBet(r.rows[0]) });
}));

router.patch('/:id', wrap(async (req, res) => {
  const cur = await query('SELECT * FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!cur.rows.length) return res.status(404).json({ error: 'Apuesta no encontrada' });
  const row = cur.rows[0];

  const b = req.body || {};
  const fields = {};
  const allowed = ['event', 'sport', 'market', 'status', 'actual_profit', 'placed_at', 'settled_at', 'notes', 'total_stake', 'expected_profit', 'profit_pct'];
  for (const k of allowed) {
    if (k in b && b[k] !== undefined) {
      fields[k] = b[k] === null ? null : (['actual_profit', 'total_stake', 'expected_profit', 'profit_pct'].includes(k) ? Number(b[k]) : String(b[k]));
    }
  }
  if ('legs' in b && Array.isArray(b.legs)) fields.legs = JSON.stringify(b.legs);

  // Al liquidar, fija settled_at automáticamente
  if (fields.status && fields.status !== 'pending' && !fields.settled_at && !row.settled_at) {
    fields.settled_at = new Date().toISOString().slice(0, 10);
  }
  // Si se marca ganada sin beneficio real, usa el esperado
  if (fields.status === 'won' && fields.actual_profit == null && row.actual_profit == null) {
    fields.actual_profit = row.expected_profit;
  }
  if (fields.status === 'void' && fields.actual_profit == null) fields.actual_profit = 0;

  const keys = Object.keys(fields);
  if (keys.length === 0) return res.json({ bet: parseBet(row) });

  const setSql = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
  const params = keys.map((k) => fields[k]);
  params.push(row.id);
  const upd = await query(`UPDATE bets SET ${setSql} WHERE id = $${keys.length + 1} RETURNING *`, params);

  res.json({ bet: parseBet(upd.rows[0]) });
}));

router.delete('/:id', wrap(async (req, res) => {
  const r = await query('DELETE FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Apuesta no encontrada' });
  res.json({ ok: true });
}));

export default router;

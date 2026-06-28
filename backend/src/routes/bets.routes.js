import { Router } from 'express';
import { query, wrap } from '../db.js';
import { authRequired } from '../auth.js';
import { calcArbitrage } from '../arb.js';

const router = Router();
router.use(authRequired);

const VALID_STATUSES = new Set(['pending', 'won', 'lost', 'void']);
const NUMERIC_FIELDS = new Set(['actual_profit', 'total_stake', 'expected_profit', 'profit_pct']);
const PATCH_ALLOWED  = ['event', 'sport', 'market', 'status', 'actual_profit', 'placed_at', 'settled_at', 'notes', 'total_stake', 'expected_profit', 'profit_pct'];

function parseBet(row) {
  return { ...row, legs: safeParse(row.legs) };
}
function safeParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}
function notFound(res) {
  return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Apuesta no encontrada' } });
}

router.get('/', wrap(async (req, res) => {
  const { from, to, status, limit = '100', offset = '0', sport } = req.query;

  const lim = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const off = Math.max(parseInt(offset, 10) || 0, 0);

  let sql = 'SELECT * FROM bets WHERE user_id = $1';
  const params = [req.user.id];
  let i = 2;

  if (from)   { sql += ` AND placed_at >= $${i++}`; params.push(String(from)); }
  if (to)     { sql += ` AND placed_at <= $${i++}`; params.push(String(to)); }
  if (status) { sql += ` AND status = $${i++}`;     params.push(String(status)); }
  if (sport)  { sql += ` AND sport   = $${i++}`;    params.push(String(sport)); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)::int AS n');
  const [countR, rowsR] = await Promise.all([
    query(countSql, params),
    query(sql + ` ORDER BY placed_at DESC, id DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, lim, off]),
  ]);

  res.json({
    data: rowsR.rows.map(parseBet),
    meta: { total: countR.rows[0].n, limit: lim, offset: off },
  });
}));

router.get('/:id', wrap(async (req, res) => {
  const r = await query('SELECT * FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!r.rows.length) return notFound(res);
  res.json({ data: parseBet(r.rows[0]) });
}));

router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.event) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'El evento es obligatorio' } });
  }

  const legs       = Array.isArray(b.legs) ? b.legs : [];
  const totalStake = Number(b.total_stake) || legs.reduce((a, l) => a + (Number(l.stake) || 0), 0);
  if (!(totalStake > 0)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'El importe debe ser mayor que 0' } });
  }

  const calc      = legs.length >= 2 ? calcArbitrage(legs.map((l) => Number(l.odds)), totalStake) : null;
  const expected  = b.expected_profit != null ? Number(b.expected_profit) : (calc ? calc.guaranteedProfit : 0);
  const profitPct = b.profit_pct != null
    ? Number(b.profit_pct)
    : (calc ? calc.profitPctRealized : Math.round((expected / totalStake) * 10000) / 100);
  const placedAt  = b.placed_at || new Date().toISOString().slice(0, 10);
  const status    = b.status && VALID_STATUSES.has(b.status) ? b.status : 'pending';

  const r = await query(`
    INSERT INTO bets
      (user_id, event, sport, market, legs, total_stake, expected_profit, profit_pct,
       status, actual_profit, placed_at, settled_at, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *
  `, [
    req.user.id,
    String(b.event),
    b.sport   ? String(b.sport)   : null,
    b.market  ? String(b.market)  : null,
    JSON.stringify(legs),
    totalStake, expected, profitPct, status,
    b.actual_profit != null ? Number(b.actual_profit) : null,
    String(placedAt),
    b.settled_at ? String(b.settled_at) : null,
    b.notes      ? String(b.notes)      : null,
  ]);

  res.status(201).json({ data: parseBet(r.rows[0]) });
}));

router.patch('/:id', wrap(async (req, res) => {
  const cur = await query('SELECT * FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!cur.rows.length) return notFound(res);
  const row = cur.rows[0];
  const b   = req.body || {};

  const fields = {};
  for (const k of PATCH_ALLOWED) {
    if (!(k in b) || b[k] === undefined) continue;
    if (k === 'status' && !VALID_STATUSES.has(b[k])) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Estado inválido: ${b[k]}` } });
    }
    fields[k] = b[k] === null ? null : (NUMERIC_FIELDS.has(k) ? Number(b[k]) : String(b[k]));
  }
  if ('legs' in b && Array.isArray(b.legs)) fields.legs = JSON.stringify(b.legs);

  if (fields.status && fields.status !== 'pending' && !fields.settled_at && !row.settled_at) {
    fields.settled_at = new Date().toISOString().slice(0, 10);
  }
  if (fields.status === 'won' && fields.actual_profit == null && row.actual_profit == null) {
    fields.actual_profit = row.expected_profit;
  }
  if (fields.status === 'void' && fields.actual_profit == null) fields.actual_profit = 0;

  const keys = Object.keys(fields);
  if (keys.length === 0) return res.json({ data: parseBet(row) });

  const setSql = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const params = [...keys.map((k) => fields[k]), row.id];
  const upd = await query(`UPDATE bets SET ${setSql} WHERE id = $${keys.length + 1} RETURNING *`, params);

  res.json({ data: parseBet(upd.rows[0]) });
}));

router.delete('/:id', wrap(async (req, res) => {
  const r = await query('DELETE FROM bets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (r.rowCount === 0) return notFound(res);
  res.json({ data: { ok: true } });
}));

export default router;

import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { initDb, pool, wrap } from './db.js';
import authRoutes from './routes/auth.routes.js';
import betRoutes from './routes/bets.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { fetchLiveOdds } from './odds.js';

const app = express();

const allowedOrigin = process.env.CLIENT_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin, credentials: true } : {}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    process.stdout.write(JSON.stringify({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    }) + '\n');
  });
  next();
});

app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/ready', wrap(async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'postgres', ts: Date.now() });
  } catch {
    res.status(503).json({ ok: false, error: { code: 'DB_UNREACHABLE', message: 'Database not reachable' } });
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/odds', wrap(async (req, res) => {
  const data = await fetchLiveOdds({ sport: req.query.sport, region: req.query.region });
  res.json(data);
}));

app.use((err, req, res, _next) => {
  const pg = { '23505': [409, 'DUPLICATE', 'Registro duplicado'], '23503': [400, 'INVALID_REF', 'Referencia inválida'] };
  if (pg[err.code]) {
    const [status, code, message] = pg[err.code];
    return res.status(status).json({ error: { code, message, requestId: req.requestId } });
  }
  process.stderr.write(JSON.stringify({ level: 'error', requestId: req.requestId, message: err.message, stack: err.stack }) + '\n');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor', requestId: req.requestId } });
});

const PORT = process.env.PORT || 4000;

initDb().then(() => {
  const server = app.listen(PORT, () =>
    process.stdout.write(JSON.stringify({ level: 'info', message: `Vertix API listening on port ${PORT}` }) + '\n')
  );

  const shutdown = async (signal) => {
    process.stdout.write(JSON.stringify({ level: 'info', message: `${signal} received — shutting down` }) + '\n');
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}).catch((e) => {
  process.stderr.write(JSON.stringify({ level: 'fatal', message: e.message }) + '\n');
  process.exit(1);
});

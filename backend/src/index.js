import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb } from './db.js';
import authRoutes from './routes/auth.routes.js';
import betRoutes from './routes/bets.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { fetchLiveOdds } from './odds.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, db: 'postgres', ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Cuotas en vivo (stub, listo para enchufar un proveedor real)
app.get('/api/odds', async (req, res) => {
  try {
    const data = await fetchLiveOdds({ sport: req.query.sport, region: req.query.region });
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Error obteniendo cuotas', detail: String(e) });
  }
});

// Manejo de errores genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Vertix API (PostgreSQL) escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('❌ No se pudo inicializar la base de datos:', e.message);
    process.exit(1);
  });

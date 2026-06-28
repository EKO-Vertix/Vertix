import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(JSON.stringify({ level: 'fatal', msg: 'DATABASE_URL not set' }));
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error(JSON.stringify({ level: 'error', msg: 'pg pool error', error: err.message }));
});

export const query = (text, params) => pool.query(text, params);

export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      name          TEXT,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bets (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event           TEXT NOT NULL,
      sport           TEXT,
      market          TEXT,
      legs            TEXT NOT NULL,
      total_stake     DOUBLE PRECISION NOT NULL,
      expected_profit DOUBLE PRECISION NOT NULL,
      profit_pct      DOUBLE PRECISION NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','won','lost','void')),
      actual_profit   DOUBLE PRECISION,
      placed_at       TEXT NOT NULL,
      settled_at      TEXT,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_bets_user_date   ON bets(user_id, placed_at);');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_bets_user_status ON bets(user_id, status);');
}

export default pool;

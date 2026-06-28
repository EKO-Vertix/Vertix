import { Router } from 'express';
import { query, wrap } from '../db.js';
import { hashPassword, verifyPassword, signToken, authRequired } from '../auth.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginAttempts = new Map();
function rateLimit(max = 10) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = loginAttempts.get(ip) || { count: 0, reset: now + 60_000 };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
    entry.count += 1;
    loginAttempts.set(ip, entry);
    if (entry.count > max) {
      return res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Espera un momento.' },
      });
    }
    next();
  };
}

function validate(fields) {
  const details = [];
  if (!fields.email) details.push({ field: 'email', message: 'Obligatorio' });
  else if (!EMAIL_RE.test(String(fields.email))) details.push({ field: 'email', message: 'Formato no válido' });
  if (!fields.password) details.push({ field: 'password', message: 'Obligatorio' });
  else if (String(fields.password).length < 8) details.push({ field: 'password', message: 'Mínimo 8 caracteres' });
  if (fields.name !== undefined && String(fields.name).length > 60) {
    details.push({ field: 'name', message: 'Máximo 60 caracteres' });
  }
  return details;
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
}

router.post('/register', rateLimit(20), wrap(async (req, res) => {
  const { email, password, name } = req.body || {};
  const details = validate({ email, password, name });
  if (details.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details } });
  }

  const normEmail = String(email).trim().toLowerCase();
  const normName  = name ? String(name).trim().slice(0, 60) : null;

  try {
    const r = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [normEmail, normName, hashPassword(password)]
    );
    const user = r.rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Ese email ya está registrado' } });
    }
    throw e;
  }
}));

router.post('/login', rateLimit(10), wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Email y contraseña son obligatorios' },
    });
  }

  const normEmail = String(email).trim().toLowerCase();
  const r = await query('SELECT * FROM users WHERE email = $1', [normEmail]);
  const user = r.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales incorrectas' } });
  }

  loginAttempts.delete(req.ip || 'unknown');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authRequired, wrap(async (req, res) => {
  const r = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!r.rows.length) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } });
  }
  res.json({ user: publicUser(r.rows[0]) });
}));

router.patch('/me', authRequired, wrap(async (req, res) => {
  const { name } = req.body || {};
  if (name === undefined) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'No hay campos para actualizar' } });
  }
  const normName = name ? String(name).trim().slice(0, 60) : null;
  const r = await query(
    'UPDATE users SET name = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [normName, req.user.id]
  );
  res.json({ user: publicUser(r.rows[0]) });
}));

export default router;

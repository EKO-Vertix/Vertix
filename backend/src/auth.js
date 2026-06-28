import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify({ level: 'fatal', msg: 'JWT_SECRET not set in production' }));
    process.exit(1);
  }
  console.warn(JSON.stringify({ level: 'warn', msg: 'JWT_SECRET not set — using dev fallback' }));
}

const JWT_SECRET   = process.env.JWT_SECRET   || 'dev-secret-change-me';
const JWT_EXPIRES  = process.env.JWT_EXPIRES  || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

export function hashPassword(pw) {
  return bcrypt.hashSync(String(pw), BCRYPT_ROUNDS);
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(String(pw), hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, scope: ['user'] },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No autorizado' } });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(payload.sub ?? payload.id), email: payload.email, scope: payload.scope ?? [] };
    next();
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Token inválido o expirado' } });
  }
}

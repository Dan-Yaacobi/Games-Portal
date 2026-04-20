import bcrypt from 'bcrypt';
import { query } from '../../db/pool.js';
import { getCookieOptions, signSession } from '../../utils/jwt.js';

function sanitizeUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    coins: row.coins,
    created_at: row.created_at,
    last_login_at: row.last_login_at
  };
}

export async function register(req, res, next) {
  try {
    const { email, password, username } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (email, password_hash, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, coins, created_at, last_login_at`,
      [email.toLowerCase(), passwordHash, username || null]
    );

    const user = result.rows[0];
    const token = signSession({ userId: user.id });
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

    if (!result.rowCount) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const updated = await query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE id = $1
       RETURNING id, email, username, coins, created_at, last_login_at`,
      [user.id]
    );

    const safeUser = updated.rows[0];
    const token = signSession({ userId: user.id });
    res.cookie('token', token, getCookieOptions());

    return res.json({ user: sanitizeUser(safeUser) });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie('token', getCookieOptions());
  return res.status(204).send();
}

export async function me(req, res, next) {
  try {
    const result = await query(
      `SELECT id, email, username, coins, created_at, last_login_at
       FROM users
       WHERE id = $1`,
      [req.auth.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

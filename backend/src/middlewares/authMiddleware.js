import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid session' });
  }
}

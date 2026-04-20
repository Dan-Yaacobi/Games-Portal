import { query } from '../../db/pool.js';

export async function getMe(req, res, next) {
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

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

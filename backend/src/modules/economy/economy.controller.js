import { query } from '../../db/pool.js';

export async function listTransactions(req, res, next) {
  try {
    const result = await query(
      `SELECT id, user_id, amount, reason, metadata, created_at
       FROM coin_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.auth.userId]
    );

    return res.json({ transactions: result.rows });
  } catch (error) {
    return next(error);
  }
}

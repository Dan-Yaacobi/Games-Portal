import { pool } from '../db/pool.js';

export async function awardCoins({ userId, amount, reason, metadata = {}, client: externalClient }) {
  const client = externalClient || (await pool.connect());

  try {
    if (!externalClient) {
      await client.query('BEGIN');
    }

    const userResult = await client.query(
      `UPDATE users
       SET coins = coins + $1
       WHERE id = $2
       RETURNING coins`,
      [amount, userId]
    );

    if (!userResult.rowCount) {
      throw new Error('User not found while awarding coins');
    }

    await client.query(
      `INSERT INTO coin_transactions (user_id, amount, reason, metadata)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [userId, amount, reason, JSON.stringify(metadata)]
    );

    if (!externalClient) {
      await client.query('COMMIT');
    }

    return userResult.rows[0].coins;
  } catch (error) {
    if (!externalClient) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (!externalClient) {
      client.release();
    }
  }
}

import { pool, query } from '../../db/pool.js';
import { awardCoins } from '../../services/economyService.js';

function calculateCoins(score) {
  // TODO: Add anti-cheat and game-specific validation rules.
  return Math.floor(score / 10);
}

export async function listGames(_req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, slug, is_active FROM games WHERE is_active = true ORDER BY name ASC'
    );

    return res.json({ games: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function startGameSession(req, res, next) {
  try {
    const { id: gameId } = req.params;
    const userId = req.auth.userId;

    const gameResult = await query('SELECT id, is_active FROM games WHERE id = $1', [gameId]);
    if (!gameResult.rowCount || !gameResult.rows[0].is_active) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const sessionResult = await query(
      `INSERT INTO game_sessions (user_id, game_id)
       VALUES ($1, $2)
       RETURNING id, user_id, game_id, started_at, ended_at, score, coins_earned`,
      [userId, gameId]
    );

    return res.status(201).json({ session: sessionResult.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function completeGameSession(req, res, next) {
  const client = await pool.connect();

  try {
    const { id: gameId } = req.params;
    const userId = req.auth.userId;
    const { sessionId, score } = req.body;

    await client.query('BEGIN');

    const sessionResult = await client.query(
      `SELECT id, user_id, game_id, ended_at
       FROM game_sessions
       WHERE id = $1 AND game_id = $2`,
      [sessionId, gameId]
    );

    if (!sessionResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Forbidden session access' });
    }

    if (session.ended_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Session already completed' });
    }

    const coinsEarned = calculateCoins(score);

    const updatedSessionResult = await client.query(
      `UPDATE game_sessions
       SET score = $1, coins_earned = $2, ended_at = NOW()
       WHERE id = $3
       RETURNING id, user_id, game_id, started_at, ended_at, score, coins_earned`,
      [score, coinsEarned, sessionId]
    );

    const newBalance = await awardCoins({
      userId,
      amount: coinsEarned,
      reason: 'game_reward',
      metadata: { gameId, sessionId, score },
      client
    });

    await client.query('COMMIT');

    return res.json({
      session: updatedSessionResult.rows[0],
      awarded: coinsEarned,
      balance: newBalance
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
}

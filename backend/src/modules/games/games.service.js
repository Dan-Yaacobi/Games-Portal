import { pool, query } from '../../db/pool.js';
import { awardCoins } from '../../services/economyService.js';

const MAX_SCORE = 10000;
const MAX_COINS_PER_SESSION = 1000;

function calculateCoins(score) {
  return Math.min(MAX_COINS_PER_SESSION, Math.max(0, Math.floor(score / 10)));
}

export async function getActiveGames() {
  const result = await query(
    'SELECT id, name, slug, is_active FROM games WHERE is_active = true ORDER BY name ASC'
  );

  return result.rows;
}

export async function startOrGetSession({ userId, gameId }) {
  const gameResult = await query('SELECT id, is_active FROM games WHERE id = $1', [gameId]);

  if (!gameResult.rowCount || !gameResult.rows[0].is_active) {
    return { status: 404, body: { message: 'Game not found' } };
  }

  const existingSessionResult = await query(
    `SELECT id, game_id, started_at
     FROM game_sessions
     WHERE user_id = $1 AND game_id = $2 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [userId, gameId]
  );

  if (existingSessionResult.rowCount) {
    return {
      status: 200,
      body: mapStartResponse(existingSessionResult.rows[0])
    };
  }

  try {
    const createdSessionResult = await query(
      `INSERT INTO game_sessions (user_id, game_id)
       VALUES ($1, $2)
       RETURNING id, game_id, started_at`,
      [userId, gameId]
    );

    return {
      status: 201,
      body: mapStartResponse(createdSessionResult.rows[0])
    };
  } catch (error) {
    if (error.code === '23505') {
      const conflictSessionResult = await query(
        `SELECT id, game_id, started_at
         FROM game_sessions
         WHERE user_id = $1 AND game_id = $2 AND ended_at IS NULL
         ORDER BY started_at DESC
         LIMIT 1`,
        [userId, gameId]
      );

      if (conflictSessionResult.rowCount) {
        return {
          status: 200,
          body: mapStartResponse(conflictSessionResult.rows[0])
        };
      }
    }

    throw error;
  }
}

export async function completeSession({ userId, gameId, sessionId, score }) {
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return { status: 400, body: { message: 'Score must be a number between 0 and 10000' } };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `SELECT id, user_id, game_id, ended_at
       FROM game_sessions
       WHERE id = $1 AND game_id = $2
       FOR UPDATE`,
      [sessionId, gameId]
    );

    if (!sessionResult.rowCount) {
      await client.query('ROLLBACK');
      console.log('[games.complete] rejected: session not found', { userId, gameId, sessionId });
      return { status: 404, body: { message: 'Session not found' } };
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      await client.query('ROLLBACK');
      console.log('[games.complete] rejected: forbidden session access', {
        userId,
        gameId,
        sessionId,
        ownerId: session.user_id
      });
      return { status: 403, body: { message: 'Forbidden session access' } };
    }

    if (session.ended_at) {
      await client.query('ROLLBACK');
      console.log('[games.complete] rejected: session already completed', { userId, gameId, sessionId });
      return { status: 400, body: { message: 'Session already completed' } };
    }

    const coinsEarned = calculateCoins(score);

    const updatedSessionResult = await client.query(
      `UPDATE game_sessions
       SET score = $1, coins_earned = $2, ended_at = NOW()
       WHERE id = $3 AND ended_at IS NULL
       RETURNING id, score, coins_earned`,
      [score, coinsEarned, sessionId]
    );

    if (!updatedSessionResult.rowCount) {
      await client.query('ROLLBACK');
      console.log('[games.complete] rejected: concurrent completion detected', { userId, gameId, sessionId });
      return { status: 400, body: { message: 'Session already completed' } };
    }

    const totalCoins = await awardCoins({
      userId,
      amount: coinsEarned,
      reason: 'game_reward',
      metadata: { gameId, sessionId, score },
      client
    });

    await client.query('COMMIT');

    console.log('[games.complete] success', { userId, gameId, sessionId, score, coinsEarned, totalCoins });

    return {
      status: 200,
      body: {
        sessionId: updatedSessionResult.rows[0].id,
        score: updatedSessionResult.rows[0].score,
        coinsEarned: updatedSessionResult.rows[0].coins_earned,
        totalCoins
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mapStartResponse(session) {
  return {
    sessionId: session.id,
    gameId: session.game_id,
    startedAt: session.started_at
  };
}

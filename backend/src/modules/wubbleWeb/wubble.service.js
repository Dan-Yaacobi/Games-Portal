import { pool, query } from '../../db/pool.js';
import { completeSessionInTransaction, getGameBySlug, startOrGetSession } from '../games/games.service.js';
import { getWubbleContent } from './wubbleContent.service.js';
import { WUBBLE_DURATION_SECONDS } from './wubble.config.js';
import {
  generatePromptSchedule,
  generateSpawnPlan
} from './wubbleSessionGeneration.service.js';
import { validateWubbleSubmission } from './wubbleValidation.service.js';

const GAME_SLUG = 'wubble-web';

async function closePlatformSession(sessionId) {
  await query(
    `UPDATE game_sessions
     SET ended_at = NOW(), score = COALESCE(score, 0), coins_earned = COALESCE(coins_earned, 0)
     WHERE id = $1 AND ended_at IS NULL`,
    [sessionId]
  );
}

async function getWubbleGame() {
  const game = await getGameBySlug(GAME_SLUG);
  if (!game || !game.is_active) {
    return null;
  }
  return game;
}

export async function startWubbleSession({ userId, wordDifficulty, speedDifficulty }) {
  const game = await getWubbleGame();

  if (!game) {
    return { status: 404, body: { message: 'Wubble Web is unavailable' } };
  }

  const sessionResult = await startOrGetSession({ userId, gameId: game.id });
  if (sessionResult.status >= 400) {
    return sessionResult;
  }

  const platformSessionId = sessionResult.body.sessionId;

  const existingWubbleResult = await query(
    `SELECT id, duration_seconds, word_difficulty, speed_difficulty, prompt_schedule_json, spawn_plan_json
     FROM wubble_sessions
     WHERE platform_session_id = $1`,
    [platformSessionId]
  );

  if (existingWubbleResult.rowCount) {
    const row = existingWubbleResult.rows[0];
    const hasMatchingDifficulty =
      row.word_difficulty === wordDifficulty && row.speed_difficulty === speedDifficulty;

    if (hasMatchingDifficulty) {
      return {
        status: 200,
        body: {
          platformSessionId,
          wubbleSessionId: row.id,
          durationSeconds: row.duration_seconds,
          wordDifficulty: row.word_difficulty,
          speedDifficulty: row.speed_difficulty,
          promptSchedule: row.prompt_schedule_json,
          spawnPlan: row.spawn_plan_json,
          serverTime: new Date().toISOString()
        }
      };
    }

    await closePlatformSession(platformSessionId);

    const newSessionResult = await startOrGetSession({ userId, gameId: game.id });
    if (newSessionResult.status >= 400) {
      return newSessionResult;
    }

    return startWubbleSession({
      userId,
      wordDifficulty,
      speedDifficulty
    });
  }

  const content = await getWubbleContent({ wordDifficulty });
  if (content.words.length < 10 || content.categories.length < 3) {
    return { status: 400, body: { message: 'Insufficient Wubble content for selected difficulty' } };
  }

  const promptSchedule = generatePromptSchedule({
    categories: content.categories,
    durationSeconds: WUBBLE_DURATION_SECONDS
  });

  const spawnPlan = generateSpawnPlan({
    words: content.words,
    promptSchedule,
    speedDifficulty,
    durationSeconds: WUBBLE_DURATION_SECONDS
  });

  const insertResult = await query(
    `INSERT INTO wubble_sessions (
      platform_session_id,
      word_difficulty,
      speed_difficulty,
      duration_seconds,
      prompt_schedule_json,
      spawn_plan_json
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
    RETURNING id`,
    [
      platformSessionId,
      wordDifficulty,
      speedDifficulty,
      WUBBLE_DURATION_SECONDS,
      JSON.stringify(promptSchedule),
      JSON.stringify(spawnPlan)
    ]
  );

  return {
    status: 201,
    body: {
      platformSessionId,
      wubbleSessionId: insertResult.rows[0].id,
      durationSeconds: WUBBLE_DURATION_SECONDS,
      wordDifficulty,
      speedDifficulty,
      promptSchedule,
      spawnPlan,
      serverTime: new Date().toISOString()
    }
  };
}

export async function submitWubbleSession({ userId, platformSessionId, wubbleSessionId, eventLog }) {
  const game = await getWubbleGame();

  if (!game) {
    return { status: 404, body: { message: 'Wubble Web is unavailable' } };
  }

  const sessionResult = await query(
    `SELECT
      ws.id,
      ws.platform_session_id,
      ws.duration_seconds,
      ws.prompt_schedule_json,
      ws.spawn_plan_json,
      gs.user_id,
      gs.ended_at
     FROM wubble_sessions ws
     JOIN game_sessions gs ON gs.id = ws.platform_session_id
     WHERE ws.id = $1 AND ws.platform_session_id = $2 AND gs.game_id = $3`,
    [wubbleSessionId, platformSessionId, game.id]
  );

  if (!sessionResult.rowCount) {
    return { status: 404, body: { message: 'Wubble session not found' } };
  }

  const session = sessionResult.rows[0];

  if (session.user_id !== userId) {
    return { status: 403, body: { message: 'Forbidden session access' } };
  }

  const existingSubmissionResult = await query(
    'SELECT id FROM wubble_submissions WHERE wubble_session_id = $1',
    [wubbleSessionId]
  );

  if (existingSubmissionResult.rowCount) {
    return { status: 400, body: { message: 'Wubble session already submitted' } };
  }

  if (session.ended_at) {
    return { status: 400, body: { message: 'Platform session already completed' } };
  }

  const validation = validateWubbleSubmission({
    promptSchedule: session.prompt_schedule_json,
    spawnPlan: session.spawn_plan_json,
    durationSeconds: session.duration_seconds,
    eventLog
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lockedSubmissionResult = await client.query(
      'SELECT id FROM wubble_submissions WHERE wubble_session_id = $1 FOR UPDATE',
      [wubbleSessionId]
    );

    if (lockedSubmissionResult.rowCount) {
      await client.query('ROLLBACK');
      return { status: 400, body: { message: 'Wubble session already submitted' } };
    }

    const completionResult = await completeSessionInTransaction({
      userId,
      gameId: game.id,
      sessionId: platformSessionId,
      score: validation.finalScore,
      client
    });

    if (completionResult.status !== 200) {
      await client.query('ROLLBACK');
      return completionResult;
    }

    await client.query(
      `INSERT INTO wubble_submissions (
        wubble_session_id,
        submitted_event_log_json,
        validated_score,
        validation_summary_json
      ) VALUES ($1, $2::jsonb, $3, $4::jsonb)`,
      [
        wubbleSessionId,
        JSON.stringify(eventLog),
        validation.finalScore,
        JSON.stringify(validation.summary)
      ]
    );

    await client.query('COMMIT');

    return {
      status: 200,
      body: {
        platformSessionId,
        wubbleSessionId,
        validatedScore: validation.finalScore,
        coinsEarned: completionResult.body.coinsEarned,
        totalCoins: completionResult.body.totalCoins,
        validationSummary: validation.summary
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

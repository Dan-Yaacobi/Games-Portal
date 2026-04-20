import { completeSession, getActiveGames, startOrGetSession } from './games.service.js';

export async function listGames(_req, res, next) {
  try {
    const games = await getActiveGames();
    return res.json({ games });
  } catch (error) {
    return next(error);
  }
}

export async function startGameSession(req, res, next) {
  try {
    const { id: gameId } = req.params;
    const userId = req.auth.userId;

    const result = await startOrGetSession({ userId, gameId });

    if (result.status === 201) {
      console.log('[games.start] created', { userId, gameId, sessionId: result.body.sessionId });
    } else if (result.status === 200) {
      console.log('[games.start] reused active session', {
        userId,
        gameId,
        sessionId: result.body.sessionId
      });
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function completeGameSession(req, res, next) {
  try {
    const { id: gameId } = req.params;
    const userId = req.auth.userId;
    const { sessionId, score } = req.body;

    const result = await completeSession({ userId, gameId, sessionId, score });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

import { startWubbleSession, submitWubbleSession } from './wubble.service.js';

export async function startWubble(req, res, next) {
  try {
    const userId = req.auth.userId;
    const { wordDifficulty, speedDifficulty } = req.body;

    const result = await startWubbleSession({ userId, wordDifficulty, speedDifficulty });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

export async function submitWubble(req, res, next) {
  try {
    const userId = req.auth.userId;
    const { platformSessionId, wubbleSessionId, eventLog } = req.body;

    const result = await submitWubbleSession({
      userId,
      platformSessionId,
      wubbleSessionId,
      eventLog
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

import { Router } from 'express';
import { completeGameSession, listGames, startGameSession } from './games.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validate.js';
import { completeGameSchema } from './games.schema.js';

const router = Router();

router.get('/', requireAuth, listGames);
router.post('/:id/start', requireAuth, startGameSession);
router.post('/:id/complete', requireAuth, validate(completeGameSchema), completeGameSession);

export default router;

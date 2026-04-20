import { Router } from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { validate } from '../../middlewares/validate.js';
import { startWubble, submitWubble } from './wubble.controller.js';
import { startWubbleSchema, submitWubbleSchema } from './wubble.schema.js';

const router = Router();

router.post('/start', requireAuth, validate(startWubbleSchema), startWubble);
router.post('/submit', requireAuth, validate(submitWubbleSchema), submitWubble);

export default router;

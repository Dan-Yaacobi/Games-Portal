import { Router } from 'express';
import { getMe } from './users.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', requireAuth, getMe);

export default router;

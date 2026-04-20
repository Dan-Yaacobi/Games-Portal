import { Router } from 'express';
import { listTransactions } from './economy.controller.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/transactions', requireAuth, listTransactions);

export default router;

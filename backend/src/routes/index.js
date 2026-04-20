import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/users.routes.js';
import gameRoutes from '../modules/games/games.routes.js';
import economyRoutes from '../modules/economy/economy.routes.js';
import wubbleRoutes from '../modules/wubbleWeb/wubble.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/games', gameRoutes);
router.use('/economy', economyRoutes);
router.use('/wubble-web', wubbleRoutes);

export default router;

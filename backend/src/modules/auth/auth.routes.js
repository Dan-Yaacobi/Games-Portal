import { Router } from 'express';
import { login, logout, me, register } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;

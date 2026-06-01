import { Router } from 'express';
import { generateRtcToken } from '../controllers/agora.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Protected route to generate token
router.get('/agora/token', verifyJWT, generateRtcToken);

export default router;

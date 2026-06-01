import { Router } from 'express';
import { startChatSession, endChatSession, getSessionMessages } from '../controllers/chat.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/chat/start', verifyJWT, startChatSession);
router.post('/chat/:sessionId/end', verifyJWT, endChatSession);
router.get('/chat/:sessionId/messages', verifyJWT, getSessionMessages);

export default router;

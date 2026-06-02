import { Router } from 'express';
import { requestCall, acceptCall, rejectCall, getCallHistory } from '../controllers/call.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// User requests a call
router.post('/calls/request', verifyJWT, requestCall);

// User and Astrologer view history
router.get('/calls/history', verifyJWT, getCallHistory);

// Astrologer specific routes
router.post('/calls/accept', verifyJWT, authorizeRoles('astrologer'), acceptCall);
router.post('/calls/reject', verifyJWT, authorizeRoles('astrologer'), rejectCall);

export default router;

import { Router } from 'express';
import { getPanchang, getMuhurat, checkMatchmaking, getHoroscope, getKundli } from '../controllers/tools.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/tools/panchang', optionalAuth, getPanchang);
router.get('/tools/muhurat', optionalAuth, getMuhurat);
router.post('/tools/matchmaking', optionalAuth, checkMatchmaking);
router.post('/tools/horoscope', optionalAuth, getHoroscope);
router.post('/tools/kundli', optionalAuth, getKundli);

export default router;

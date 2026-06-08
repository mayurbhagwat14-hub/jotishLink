import express from 'express';
import {
  getNotifications,
  markAsRead,
  deleteNotifications
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyJWT);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead); // use 'all' for ID to mark all as read
router.delete('/', deleteNotifications);

export default router;

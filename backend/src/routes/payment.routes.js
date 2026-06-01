import express from 'express';
import { createOrder, verifyPayment } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validate, createOrderSchema, verifyPaymentSchema } from '../middlewares/validation.middleware.js';

const router = express.Router();

router.post('/create-order', verifyJWT, validate(createOrderSchema), createOrder);
router.post('/verify', verifyJWT, validate(verifyPaymentSchema), verifyPayment);

export default router;

import Joi from 'joi';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const validate = (schema) => asyncHandler(async (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    console.error("VALIDATION FAILED FOR PAYLOAD:", JSON.stringify(req.body, null, 2));
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    throw new ApiError(400, errorMessage);
  }
  next();
});

// User schemas
export const requestOtpSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
});

export const verifyOtpSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  otp: Joi.string().length(4).required(),
});

export const registerUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  dob: Joi.string().optional(),
  timeOfBirth: Joi.string().optional(),
  placeOfBirth: Joi.string().optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  pincode: Joi.string().optional(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Astrologer schemas
export const astrologerCheckPhoneSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
});

export const astrologerSignupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
  otp: Joi.string().length(4).required(),
  skills: Joi.array().items(Joi.string()).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
  experience: Joi.number().min(0).optional(),
  about: Joi.string().allow('').optional(),
  email: Joi.string().email().optional().allow(''),
  gender: Joi.string().optional().allow(''),
  dob: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  pincode: Joi.string().optional().allow(''),
  consultationStyle: Joi.string().optional().allow(''),
  education: Joi.string().optional().allow(''),
  certificationDetails: Joi.string().optional().allow(''),
  pricing: Joi.object({
    chat: Joi.number().min(5).optional(),
    audioCall: Joi.number().min(5).optional(),
    videoCall: Joi.number().min(5).optional(),
    report: Joi.number().min(0).optional(),
  }).optional(),
  bankDetails: Joi.object({
    accountHolderName: Joi.string().optional().allow(''),
    bankName: Joi.string().optional().allow(''),
    accountNumber: Joi.string().optional().allow(''),
    ifscCode: Joi.string().optional().allow(''),
    upiId: Joi.string().optional().allow(''),
  }).optional(),
  identityProof: Joi.string().allow('').optional(),
  avatar: Joi.string().allow('').optional(),
  aadhaarFront: Joi.string().allow('').optional(),
  aadhaarBack: Joi.string().allow('').optional(),
  panCard: Joi.string().allow('').optional(),
  certificate: Joi.string().allow('').optional(),
  selfieVerification: Joi.string().allow('').optional(),
  isPandit: Joi.boolean().optional(),
  poojasOffered: Joi.array().items(
    Joi.object({
      poojaName: Joi.string().required(),
      price: Joi.number().required()
    })
  ).optional()
});

export const astrologerLoginSchema = Joi.object({
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  otp: Joi.string().length(4).required(),
});

// Admin schemas
export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refundUserSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  reason: Joi.string().min(3).max(100).required(),
});

// Payment schemas
export const createOrderSchema = Joi.object({
  amount: Joi.number().min(10).required(),
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  amount: Joi.number().min(10).required(),
});

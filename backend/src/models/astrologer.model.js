import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const astrologerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ['astrologer'],
      default: 'astrologer',
    },
    
    // Personal Details
    dob: { type: String }, // DD/MM/YYYY or Date
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
    },

    wallet: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },

    // Professional Details
    skills: {
      type: [String],
      default: ['Vedic'],
    },
    languages: {
      type: [String],
      default: ['Hindi', 'English'],
    },
    categories: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
    },
    about: {
      type: String,
      default: '',
    },
    consultationStyle: { type: String },
    education: { type: String },
    certificationDetails: { type: String },

    // Documents
    identityProof: { type: String }, // Legacy
    identityProofPublicId: { type: String }, // Legacy
    aadhaarFront: { type: String },
    aadhaarFrontPublicId: { type: String },
    aadhaarBack: { type: String },
    aadhaarBackPublicId: { type: String },
    panCard: { type: String },
    panCardPublicId: { type: String },
    certificate: { type: String },
    certificatePublicId: { type: String },
    selfieVerification: { type: String },
    selfieVerificationPublicId: { type: String },

    // Metrics & Counters
    rating: {
      type: Number,
      default: 5,
    },
    orders: {
      type: String,
      default: '0k+',
    },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalChats: { type: Number, default: 0 },
    totalAudioCalls: { type: Number, default: 0 },
    totalVideoCalls: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },

    // Verification & Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['incomplete', 'pending', 'approved', 'rejected'],
      default: 'incomplete',
    },
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },

    // Service Settings
    pricing: {
      chat: { type: Number, default: 5 },
      audioCall: { type: Number, default: 5 },
      videoCall: { type: Number, default: 10 },
      report: { type: Number, default: 0 }
    },
    availabilitySchedule: { type: String }, // Can be a structured JSON string or basic text
    
    onlineStatus: {
      type: String,
      enum: ['online', 'offline', 'busy'],
      default: 'offline',
    },

    // Bank Details
    bankDetails: {
      accountHolderName: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    }
  },
  {
    timestamps: true,
  }
);

astrologerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

astrologerSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const Astrologer = mongoose.model('Astrologer', astrologerSchema);
export default Astrologer;

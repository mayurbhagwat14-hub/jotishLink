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
    avatar: {
      type: String,
      default: '',
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
    skills: {
      type: [String],
      default: ['Vedic'],
    },
    languages: {
      type: [String],
      default: ['Hindi', 'English'],
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
    },
    identityProof: {
      type: String,
    },
    identityProofPublicId: {
      type: String,
    },
    categories: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5,
    },
    orders: {
      type: String,
      default: '0k+',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    about: {
      type: String,
      default: '',
    },
    pricing: {
      chat: { type: Number, default: 5 },
      audioCall: { type: Number, default: 5 },
      videoCall: { type: Number, default: 10 },
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'offline', 'busy'],
      default: 'offline',
    },
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

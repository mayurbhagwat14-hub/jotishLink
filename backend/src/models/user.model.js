import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Guest User',
    },
    fcmToken: { type: [String], default: [] }, // For web tokens
    fcmTokenMobile: { type: [String], default: [] }, // For mobile tokens
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
      enum: ['user'],
      default: 'user',
    },
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
    ratedAstrologers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
    }],
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    dob: {
      type: String, // Format YYYY-MM-DD
    },
    timeOfBirth: {
      type: String, // Format HH:MM AM/PM
    },
    placeOfBirth: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: String,
    },
    zodiacSign: {
      type: String,
      lowercase: true,
      trim: true
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
    freeChatUsed: {
      type: Boolean,
      default: false,
    },
    freeChatUsedAt: {
      type: Date,
    },
    freeChatDuration: {
      type: Number,
    },
    otpHash: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

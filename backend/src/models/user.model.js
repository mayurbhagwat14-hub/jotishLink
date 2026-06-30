import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Guest User',
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s.-]+$/, 'Name can only contain letters, spaces, dots, and hyphens']
    },
    fcmToken: { type: [String], default: [] }, // For web tokens
    fcmTokenMobile: { type: [String], default: [] }, // For mobile tokens
    phone: {
      type: String,
      unique: true,
      required: [true, 'Phone number is required'],
      index: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
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
      min: [0, 'Wallet balance cannot be negative']
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
      trim: true,
      maxlength: [100, 'Place of birth cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces']
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
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

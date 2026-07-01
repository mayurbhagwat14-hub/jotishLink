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
      match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Only @gmail.com email addresses are allowed']
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
      type: String,
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Date of birth must be in YYYY-MM-DD format'
      }
    },
    timeOfBirth: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time of birth must be in HH:MM format (24-hour)'
      }
    },
    placeOfBirth: {
      type: String,
      trim: true,
      maxlength: [100, 'Place of birth cannot exceed 100 characters'],
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^[a-zA-Z\s,.-]+$/.test(v);
        },
        message: 'Place of birth can only contain letters, spaces, commas, dots, and hyphens'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^[a-zA-Z\s,.-]+$/.test(v);
        },
        message: 'City can only contain letters, spaces, commas, dots, and hyphens'
      }
    },
    pincode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v || v.trim() === '') return true;
          return /^[0-9]{6}$/.test(v);
        },
        message: 'Please enter a valid 6-digit pincode'
      }
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

userSchema.pre('validate', function (next) {
  if (this.timeOfBirth) {
    const tob = this.timeOfBirth.trim();
    if (/^not\s+provided$/i.test(tob)) {
      this.timeOfBirth = '';
    } else {
      const ampmMatch = tob.match(/(am|pm)/i);
      if (ampmMatch) {
        const timeParts = tob.replace(/(am|pm)/i, '').trim().split(':');
        if (timeParts.length >= 2) {
          let hr = parseInt(timeParts[0], 10);
          const mn = parseInt(timeParts[1], 10);
          const isPm = ampmMatch[0].toLowerCase() === 'pm';
          if (isPm && hr < 12) hr += 12;
          if (!isPm && hr === 12) hr = 0;
          if (!isNaN(hr) && !isNaN(mn)) {
            this.timeOfBirth = `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
          }
        }
      }
    }
  }
  next();
});

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

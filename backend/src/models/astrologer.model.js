import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const astrologerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s.-]+$/, 'Name can only contain letters, spaces, dots, and hyphens']
    },
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
      enum: ['astrologer'],
      default: 'astrologer',
    },
    isTopVerified: {
      type: Boolean,
      default: false,
    },
    
    // Personal Details
    dob: { type: String }, // DD/MM/YYYY or Date
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    address: { type: String, maxlength: [250, 'Address cannot exceed 250 characters'] },
    city: { type: String, maxlength: [50, 'City cannot exceed 50 characters'], match: [/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces'] },
    state: { type: String, maxlength: [50, 'State cannot exceed 50 characters'], match: [/^[a-zA-Z\s]+$/, 'State can only contain letters and spaces'] },
    pincode: { type: String, match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'] },
    
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: {
      type: String,
    },

    earnings: {
      total: { type: Number, default: 0, min: 0 },
      pending: { type: Number, default: 0, min: 0 },
      withdrawn: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
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
    fcmToken: { type: [String], default: [] }, // For web tokens
    fcmTokenMobile: { type: [String], default: [] }, // For mobile tokens

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
      min: [0, 'Experience cannot be negative'],
      max: [100, 'Experience seems unrealistically high']
    },
    about: {
      type: String,
      default: '',
      maxlength: [1000, 'About section cannot exceed 1000 characters']
    },
    consultationStyle: { type: String, maxlength: [200, 'Consultation style text is too long'] },
    education: { type: String, maxlength: [200, 'Education text is too long'] },
    certificationDetails: { type: String, maxlength: [200, 'Certification text is too long'] },

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

    // Pandit & Pooja Settings
    isPandit: {
      type: Boolean,
      default: false,
    },
    poojasOffered: {
      type: [{
        poojaName: { type: String, required: true },
        price: { type: Number, required: true, default: 0 }
      }],
      default: [],
    },
    serviceLocations: {
      type: [String],
      default: ['Online', 'Offline'],
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

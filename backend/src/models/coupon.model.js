import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters']
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountPercent: {
      type: Number,
      required: true,
      min: [0, 'Discount percent cannot be negative'],
      max: [100, 'Discount percent cannot exceed 100']
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 means no limit
      min: [0, 'Max discount cannot be negative']
    },
    minOrderValue: {
      type: Number,
      default: 0, // Minimum cart value to apply coupon
      min: [0, 'Min order value cannot be negative']
    },
    categoryRestriction: {
      type: String,
      default: null, // If set, only applies to this category
    },
    productRestriction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null, // If set, only applies to this specific product
    },
    isFirstOrderOnly: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // Global limit. 0 means unlimited
      min: [0, 'Usage limit cannot be negative']
    },
    usagePerUser: {
      type: Number,
      default: 1, // How many times a single user can use it
      min: [1, 'Usage per user must be at least 1']
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: [0, 'Current usage cannot be negative']
    },
    usedBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      count: { type: Number, default: 0 }
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

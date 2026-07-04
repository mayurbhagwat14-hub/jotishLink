import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  costPrice: {
    type: Number,
    default: 0, // Cost price at the time of order
  },
  gstPercent: {
    type: Number,
    default: 18,
    min: [0, 'GST percent cannot be negative'],
    max: [100, 'GST percent cannot exceed 100']
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  taxableAmount: {
    type: Number,
    default: 0
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  hsnCode: {
    type: String,
    default: '',
  }
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: [true, 'Full name is required'], trim: true, minlength: 2, maxlength: 100 },
      email: { type: String, required: [true, 'Email is required'], trim: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'] },
      phone: { type: String, required: [true, 'Phone is required'], match: [/^[0-9]{10}$/, 'Invalid phone number'] },
      addressLine: { type: String, required: [true, 'Address line is required'], trim: true, maxlength: 250 },
      city: { type: String, required: [true, 'City is required'], trim: true, match: [/^[a-zA-Z\s]+$/, 'City can only contain letters'], maxlength: 50 },
      state: { type: String, required: [true, 'State is required'], trim: true, match: [/^[a-zA-Z\s]+$/, 'State can only contain letters'], maxlength: 50 },
      pincode: { type: String, required: [true, 'Pincode is required'], match: [/^[0-9]{6}$/, 'Invalid 6-digit pincode'] },
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative']
    },
    taxableAmount: {
      type: Number,
      default: 0,
      min: [0, 'Taxable amount cannot be negative']
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: [0, 'GST amount cannot be negative']
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: [0, 'Shipping fee cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'online', 'cod', 'razorpay'],
      required: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    deletedByUser: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
      default: 'pending',
    },
    trackingId: {
      type: String,
      default: null,
    },
    courierPartner: {
      type: String,
      default: null,
    },
    shiprocketOrderId: {
      type: String,
      default: null,
    },
    shipmentId: {
      type: String,
      default: null,
    },
    awbCode: {
      type: String,
      default: null,
    },
    courierCompanyId: {
      type: String,
      default: null,
    },
    cancelRequest: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      requestedAt: { type: Date },
      adminResponse: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      refundPercent: { type: Number, default: 80 },
      refundAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;

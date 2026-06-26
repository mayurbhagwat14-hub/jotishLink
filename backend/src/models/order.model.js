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
    required: true, // Price at the time of order
  },
  costPrice: {
    type: Number,
    default: 0, // Cost price at the time of order
  },
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
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    totalAmount: {
      type: Number,
      required: true,
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

import mongoose from 'mongoose';

const poojaBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer', // Pandit or Astrologer ID
      required: true,
    },
    poojaName: {
      type: String,
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // format: HH:MM
      required: true,
    },
    address: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'razorpay'],
      required: true,
    },
    deletedByUser: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const PoojaBooking = mongoose.model('PoojaBooking', poojaBookingSchema);
export default PoojaBooking;

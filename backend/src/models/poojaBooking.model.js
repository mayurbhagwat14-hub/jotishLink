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
      maxlength: [100, 'Pooja name cannot exceed 100 characters']
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
      maxlength: [250, 'Address cannot exceed 250 characters']
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
    deletedByAstrologer: {
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
      enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Rejected', 'Refunded', 'Expired'],
      default: 'Pending',
    },
    amountHold: {
      type: Number,
      default: 0,
      min: [0, 'Amount hold cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: ['held', 'released', 'refunded'],
      default: 'held',
    },
    proofMedia: {
      type: [String],
      default: [],
    },
    proofNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Proof notes cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
  },
  {
    timestamps: true,
  }
);

const PoojaBooking = mongoose.model('PoojaBooking', poojaBookingSchema);
export default PoojaBooking;

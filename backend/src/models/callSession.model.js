import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
      min: [0, 'Duration cannot be negative']
    },
    ratePerMinute: {
      type: Number,
      required: [true, 'Rate per minute is required'],
      min: [0, 'Rate cannot be negative']
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'ringing', 'accepted', 'rejected', 'missed', 'completed', 'cancelled'],
      default: 'pending',
    },
    deletedByUser: {
      type: Boolean,
      default: false,
    },
    deletedByAstrologer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
callSessionSchema.index({ userId: 1 });
callSessionSchema.index({ astrologerId: 1 });
callSessionSchema.index({ status: 1 });
callSessionSchema.index({ createdAt: -1 });

export const CallSession = mongoose.model('CallSession', callSessionSchema);

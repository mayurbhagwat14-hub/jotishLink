import mongoose from 'mongoose';

const revenueLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
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
    sessionType: {
      type: String,
      enum: ['chat', 'audio', 'video', 'audio_call', 'video_call'],
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    commissionPercent: {
      type: Number,
      required: true,
    },
    adminShare: {
      type: Number,
      required: true,
    },
    astrologerShare: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for reporting
revenueLogSchema.index({ date: -1 });
revenueLogSchema.index({ sessionType: 1 });
revenueLogSchema.index({ astrologerId: 1 });

const RevenueLog = mongoose.model('RevenueLog', revenueLogSchema);
export default RevenueLog;

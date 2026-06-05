import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema(
  {
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
    },
    bankDetailsSnapshot: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
    },
    processedAt: {
      type: Date,
    },
    payoutId: {
      type: String,
    },
    rejectionReason: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;

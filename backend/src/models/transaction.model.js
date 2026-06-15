import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['recharge', 'deduction', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'success'
    },
    razorpayReference: {
      type: String,
      unique: true,
      sparse: true,
    }
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

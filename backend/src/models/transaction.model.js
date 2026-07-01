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
      required: [true, 'Amount is required'],
    },
    desc: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [200, 'Description cannot exceed 200 characters']
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

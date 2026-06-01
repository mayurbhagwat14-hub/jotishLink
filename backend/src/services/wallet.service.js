import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';
import { ApiError } from '../utils/apiError.js';

class WalletService {
  /**
   * Deduct balance from a user's wallet
   */
  static async deduct(userId, amount, desc) {
    if (amount <= 0) {
      throw new ApiError(400, 'Invalid deduction amount');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.wallet < amount) {
      throw new ApiError(400, `Insufficient wallet balance. Required: ₹${amount}, Available: ₹${user.wallet}`);
    }

    user.wallet = Math.max(0, user.wallet - amount);
    await user.save();

    const transaction = await Transaction.create({
      userId,
      type: 'deduction',
      amount: -amount,
      desc,
    });

    return { user, transaction };
  }

  /**
   * Credit balance to a user's wallet
   */
  static async credit(userId, amount, desc) {
    if (amount <= 0) {
      throw new ApiError(400, 'Invalid recharge/refund amount');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    user.wallet = (user.wallet || 0) + amount;
    await user.save();

    const transaction = await Transaction.create({
      userId,
      type: 'recharge', // Or refund based on desc/context
      amount,
      desc,
    });

    return { user, transaction };
  }

  /**
   * Retrieve transaction history
   */
  static async getHistory(userId) {
    return Transaction.find({ userId }).sort({ date: -1 });
  }
}

export default WalletService;

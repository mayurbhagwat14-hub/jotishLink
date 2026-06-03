import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
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

  /**
   * Credit balance to an astrologer's wallet (after platform commission)
   */
  static async creditAstrologer(astrologerId, grossAmount, desc, commissionPercent = 30) {
    if (grossAmount <= 0) return null;

    try {
      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) return null; // Silently fail to not crash billing loops

      const netAmount = grossAmount * (1 - commissionPercent / 100);
      const commissionAmount = grossAmount - netAmount;

      astrologer.wallet = (astrologer.wallet || 0) + netAmount;
      await astrologer.save();

      const transaction = await Transaction.create({
        userId: astrologer._id,
        type: 'recharge',
        amount: netAmount,
        desc: `[Earning] ${desc} | Gross: ₹${grossAmount} | Commission: ${commissionPercent}% | Net: ₹${netAmount.toFixed(2)}`,
      });

      return { astrologer, netAmount, commissionAmount };
    } catch (error) {
      console.error('[WalletService] Failed to credit astrologer:', error);
      return null;
    }
  }
}

export default WalletService;

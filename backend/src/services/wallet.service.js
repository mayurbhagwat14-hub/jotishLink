import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Transaction from '../models/transaction.model.js';
import RevenueLog from '../models/revenueLog.model.js';
import { ApiError } from '../utils/apiError.js';
import { io } from '../server.js';

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

    if (io) {
      io.to(`room_user_${userId}`).emit('wallet_updated', { wallet: user.wallet, transaction });
      io.to('admin_room').emit('dashboard_updated');
    }

    return { user, transaction };
  }

  /**
   * Credit balance to a user's wallet
   */
  static async credit(userId, amount, desc, razorpayReference = null, paymentStatus = 'success') {
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
      razorpayReference,
      paymentStatus
    });

    if (io) {
      io.to(`room_user_${userId}`).emit('wallet_updated', { wallet: user.wallet, transaction });
      io.to('admin_room').emit('dashboard_updated');
    }

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
  static async creditAstrologer(astrologerId, userId, sessionId, sessionType, grossAmount, desc, commissionPercent = 30) {
    if (grossAmount <= 0) return null;

    try {
      const astrologer = await Astrologer.findById(astrologerId);
      if (!astrologer) return null; // Silently fail to not crash billing loops

      const netAmount = grossAmount * (1 - commissionPercent / 100);
      const commissionAmount = grossAmount - netAmount;

      // Update structured earnings
      if (!astrologer.earnings) {
        astrologer.earnings = { total: 0, pending: 0, withdrawn: 0, available: 0 };
      }
      astrologer.earnings.total += netAmount;
      astrologer.earnings.available += netAmount;

      // Update public counters
      astrologer.totalEarnings = (astrologer.totalEarnings || 0) + netAmount;
      if (sessionType === 'chat') {
        astrologer.totalChats = (astrologer.totalChats || 0) + 1;
      } else if (sessionType === 'audio' || sessionType === 'audio_call') {
        astrologer.totalAudioCalls = (astrologer.totalAudioCalls || 0) + 1;
      } else if (sessionType === 'video' || sessionType === 'video_call') {
        astrologer.totalVideoCalls = (astrologer.totalVideoCalls || 0) + 1;
      }

      // Update orders string
      const totalOrdersNum = (astrologer.totalChats || 0) + (astrologer.totalAudioCalls || 0) + (astrologer.totalVideoCalls || 0);
      astrologer.orders = totalOrdersNum > 999 ? `${Math.floor(totalOrdersNum/1000)}k+` : `${totalOrdersNum}`;

      await astrologer.save();

      const transaction = await Transaction.create({
        userId: astrologer._id,
        type: 'recharge',
        amount: netAmount,
        desc: `[Earning] ${desc} | Gross: ₹${grossAmount} | Commission: ${commissionPercent}% | Net: ₹${netAmount.toFixed(2)}`,
      });

      // Insert Revenue Log for Admin Tracking
      await RevenueLog.create({
        sessionId,
        userId,
        astrologerId,
        sessionType,
        durationSeconds: 0, // This can be updated by caller if needed, but totalCost matters more here. Or pass it down.
        totalCost: grossAmount,
        commissionPercent,
        adminShare: commissionAmount,
        astrologerShare: netAmount
      });

      if (io) {
        io.to(`room_astro_${astrologer._id}`).emit('wallet_updated', { wallet: astrologer.earnings.available, transaction });
        io.to('admin_room').emit('dashboard_updated');
      }

      return { astrologer, netAmount, commissionAmount };
    } catch (error) {
      console.error('[WalletService] Failed to credit astrologer:', error);
      return null;
    }
  }
}

export default WalletService;

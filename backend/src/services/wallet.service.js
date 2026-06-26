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

    // Atomic deduction: only deducts if wallet has >= amount
    const user = await User.findOneAndUpdate(
      { _id: userId, wallet: { $gte: amount } },
      { $inc: { wallet: -amount } },
      { new: true }
    );

    if (!user) {
      // It might be user doesn't exist or insufficient balance. Let's check which one it is.
      const existingUser = await User.findById(userId);
      if (!existingUser) throw new ApiError(404, 'User not found');
      throw new ApiError(400, `Insufficient wallet balance. Required: ₹${amount}, Available: ₹${existingUser.wallet || 0}`);
    }

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

    // Only notify for non-session billing (like pooja booking) to avoid spamming the bell
    const isSessionBilling = desc?.toLowerCase().includes('session') || desc?.toLowerCase().includes('call') || desc?.toLowerCase().includes('chat');
    if (!isSessionBilling) {
      import('../utils/notifyHelper.js').then(({ notify }) => {
        notify({ 
          userId, 
          role: 'user', 
          title: 'Wallet Debited', 
          message: `₹${amount} deducted — ${desc}`, 
          type: 'warning', 
          link: '/user/wallet' 
        });
      }).catch(err => console.error('Notify failed in deduct:', err));
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

    // Atomic credit
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { wallet: amount } },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

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

    // Push notification logic removed here — callers (like payment.controller.js) should call notify() themselves.
    
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
  static async creditAstrologer(astrologerId, userId, sessionId, sessionType, grossAmount, desc, commissionPercent = 30, durationSeconds = 0) {
    if (grossAmount <= 0) return null;

    try {
      const netAmount = Number((grossAmount * (1 - commissionPercent / 100)).toFixed(2));
      const commissionAmount = Number((grossAmount - netAmount).toFixed(2));

      const astrologer = await Astrologer.findByIdAndUpdate(
        astrologerId,
        {
          $inc: {
            'earnings.total': netAmount,
            'earnings.available': netAmount,
            totalEarnings: netAmount,
            ...(sessionType === 'chat' ? { totalChats: 1 } : {}),
            ...(sessionType === 'audio' || sessionType === 'audio_call' ? { totalAudioCalls: 1 } : {}),
            ...(sessionType === 'video' || sessionType === 'video_call' ? { totalVideoCalls: 1 } : {})
          }
        },
        { new: true }
      );

      if (!astrologer) return null; // Silently fail to not crash billing loops

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
        durationSeconds, 
        totalCost: grossAmount,
        commissionPercent,
        adminShare: commissionAmount,
        astrologerShare: netAmount
      });

      if (io) {
        io.to(`room_astro_${astrologer._id}`).emit('wallet_updated', { wallet: astrologer.earnings.available, transaction });
        io.to('admin_room').emit('dashboard_updated');
      }

      try {
        const { notify } = await import('../utils/notifyHelper.js');
        await notify({
          userId: astrologer._id,
          role: 'astrologer',
          title: 'Earnings Added 💰',
          message: `₹${netAmount.toFixed(2)} credited for a ${sessionType} session.`,
          type: 'success',
          link: '/astrologer/earnings'
        });
      } catch (err) {
        console.error('Notify failed:', err);
      }

      return { astrologer, netAmount, commissionAmount };
    } catch (error) {
      console.error('[WalletService] Failed to credit astrologer:', error);
      return null;
    }
  }
}

export default WalletService;

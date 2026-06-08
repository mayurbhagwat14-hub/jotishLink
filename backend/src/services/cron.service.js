import cron from 'node-cron';
import PoojaBooking from '../models/poojaBooking.model.js';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';

export const initCronJobs = (io) => {
  // Run every day at 12:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('Running Pooja Expiration Cron Job...');
    try {
      // Find all Accepted bookings where the date was yesterday or earlier
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const expiredBookings = await PoojaBooking.find({
        status: 'Accepted',
        paymentStatus: 'held',
        date: { $lte: yesterdayStr }
      });

      for (const booking of expiredBookings) {
        // Auto-refund logic
        if (booking.amountHold > 0) {
          const user = await User.findById(booking.userId);
          if (user) {
            user.wallet += booking.amountHold;
            await user.save();

            await Transaction.create({
              userId: user._id,
              amount: booking.amountHold,
              type: 'pooja_refund',
              status: 'completed',
              paymentMethod: 'wallet',
              desc: `Auto-Refund for Expired Pooja: ${booking.poojaName}`
            });

            booking.paymentStatus = 'refunded';
          }
        }
        
        booking.status = 'Expired';
        await booking.save();

        if (io) {
          io.to(`room_user_${booking.userId}`).emit('pooja_booking_expired', { booking });
          io.to(`astro_${booking.astrologerId}`).emit('pooja_booking_expired', { booking });
        }
      }

      if (expiredBookings.length > 0 && io) {
        io.to('admin_room').emit('dashboard_updated');
      }

    } catch (error) {
      console.error('Error in Pooja Expiration Cron:', error);
    }
  });
};

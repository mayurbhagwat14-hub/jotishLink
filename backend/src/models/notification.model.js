import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'alert'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: null, // optional deep link inside the app
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.post('save', async function (doc, next) {
  try {
    const { io } = await import('../server.js');
    if (io && doc.userId) {
      // Broadcast to both user and astrologer room to cover all bases
      io.to(`room_user_${doc.userId}`).emit('new_notification', doc);
      io.to(`room_astro_${doc.userId}`).emit('new_notification', doc);
    }
  } catch (error) {
    console.error('Socket notification emit failed:', error);
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

import Notification from '../models/notification.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  return res.status(200).json(
    new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched successfully')
  );
});

// PUT /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  if (notificationId === 'all') {
    // Mark all as read
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.status(200).json(new ApiResponse(200, {}, 'All notifications marked as read'));
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) throw new ApiError(404, 'Notification not found');

  return res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

// DELETE /api/notifications
export const deleteNotifications = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of notification IDs to delete');
  }

  await Notification.deleteMany({
    _id: { $in: ids },
    userId: req.user._id
  });

  return res.status(200).json(new ApiResponse(200, {}, 'Notifications deleted successfully'));
});

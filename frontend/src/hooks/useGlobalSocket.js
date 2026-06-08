import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../socket/socketManager';
import { updateUser } from '../store/slices/authSlice';
import { fetchAdminDashboardThunk } from '../store/slices/dashboardSlice';
import toast from 'react-hot-toast';

export const useGlobalSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = getSocket();

    // 1. Join Global Room (and handle reconnections)
    const joinRoom = () => {
      socket.emit('join_global_room', { userId: user._id, role: user.role });
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    // 2. Setup Listeners

    // Real-Time Wallet Updates
    const handleWalletUpdate = (data) => {
      dispatch(updateUser({ wallet: data.wallet }));
    };

    // Real-Time Notifications
    const handleNewNotification = (data) => {
      toast.success(`New Notification: ${data.title}`);
      // dispatch(fetchNotifications()); // Refetch notifications or push to state
    };

    // Admin Dashboard Real-Time Updates
    const handleDashboardUpdate = () => {
      if (user.role === 'admin' || user.role === 'superadmin') {
        dispatch(fetchAdminDashboardThunk());
      }
    };

    // Real-Time Pooja Updates
    const handlePoojaStatus = (data) => {
      const status = data.booking?.status || 'updated';
      toast.success(`Your Pooja booking was marked as ${status}!`, { icon: '🙏' });
    };

    socket.on('wallet_updated', handleWalletUpdate);
    socket.on('new_notification', handleNewNotification);
    socket.on('dashboard_updated', handleDashboardUpdate);
    socket.on('pooja_booking_accepted', handlePoojaStatus);
    socket.on('pooja_booking_rejected', handlePoojaStatus);
    socket.on('pooja_booking_completed', handlePoojaStatus);

    // Cleanup to prevent memory leaks and duplicate toasts
    return () => {
      socket.off('connect', joinRoom);
      socket.off('wallet_updated', handleWalletUpdate);
      socket.off('new_notification', handleNewNotification);
      socket.off('dashboard_updated', handleDashboardUpdate);
      socket.off('pooja_booking_accepted', handlePoojaStatus);
      socket.off('pooja_booking_rejected', handlePoojaStatus);
      socket.off('pooja_booking_completed', handlePoojaStatus);
    };
  }, [isAuthenticated, user, dispatch]);
};

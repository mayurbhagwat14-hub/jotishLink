import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../socket/socketManager';
import { updateUser } from '../store/slices/authSlice';
import { fetchAdminDashboardThunk } from '../store/slices/dashboardSlice';
import {
  addIncomingRequest,
  removeIncomingRequestByUserId,
  removeIncomingRequestsByRoomIds,
  clearAllIncomingRequests,
  removeActiveSession,
  removeIncomingRequest
} from '../store/slices/astrologerSlice';
import { fetchAstrologerDashboardThunk } from '../store/slices/dashboardSlice';
import toast from 'react-hot-toast';

export const useGlobalSocket = () => {
  const dispatch = useDispatch();
  const userAuth = useSelector((state) => state.auth) || {};
  const adminAuth = useSelector((state) => state.adminAuth) || {};
  const astrologerAuth = useSelector((state) => state.astrologerAuth) || {};

  useEffect(() => {
    const activeUsers = [userAuth.user, adminAuth.user, astrologerAuth.user].filter(Boolean);
    
    if (activeUsers.length === 0) return;

    const socket = getSocket();

    // 1. Join Global Room (and handle reconnections)
    const joinRoom = () => {
      activeUsers.forEach(u => {
        socket.emit('join_global_room', { userId: u._id, role: u.role });
        if (u.role === 'astrologer') {
          socket.emit('join_astrologer_room', { astrologerId: u._id });
        }
      });
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
      if (adminAuth.isAuthenticated && adminAuth.user) {
        dispatch(fetchAdminDashboardThunk());
      }
    };

    // Real-Time Pooja Updates
    const handlePoojaStatus = (data) => {
      const status = data.booking?.status || 'updated';
      toast.success(`Your Pooja booking was marked as ${status}!`, { icon: '🙏' });
    };

    // --- Astrologer Global Listeners ---
    const handleIncomingRequest = (data) => {
      if (!astrologerAuth.isAuthenticated) return;
      dispatch(addIncomingRequest(data));
      toast.success(`Incoming ${data.type} request from ${data.userName}!`, {
        duration: 10000,
        position: 'top-center',
        icon: data.type === 'video' ? '📹' : (data.type === 'audio' ? '📞' : '💬'),
        style: { background: '#fa6830', color: '#fff', fontWeight: 'bold' }
      });
      dispatch(fetchAstrologerDashboardThunk());
    };

    const handleRequestCancelled = (data) => {
      if (!astrologerAuth.isAuthenticated) return;
      if (data.userId) dispatch(removeIncomingRequestByUserId(data.userId));
      if (data.roomId) dispatch(removeIncomingRequest(data.roomId));
      toast('Session request cancelled by user or expired.', {
        icon: '⏳',
        style: { background: '#f3f4f6', color: '#374151' }
      });
    };

    const handlePendingCleared = () => {
      if (!astrologerAuth.isAuthenticated) return;
      dispatch(clearAllIncomingRequests());
      toast('Aapne ek session accept kar liya hai — baaki pending requests clear ho gayi hain.', {
        duration: 4000,
        position: 'top-center',
        icon: '🧹',
        style: { background: '#fa6830', color: '#fff', fontWeight: 'bold' }
      });
    };

    const handlePendingClearedByRoom = (data = {}) => {
      if (!astrologerAuth.isAuthenticated) return;
      if (Array.isArray(data.clearedRoomIds) && data.clearedRoomIds.length > 0) {
        dispatch(removeIncomingRequestsByRoomIds(data.clearedRoomIds));
      } else {
        handlePendingCleared();
      }
    };

    const handleAcceptFailed = (data) => {
      if (!astrologerAuth.isAuthenticated) return;
      toast.error(data.reason || 'Accept failed due to active session.', {
        duration: 5000,
        position: 'top-center',
        style: { fontWeight: 'bold' }
      });
    };

    const handleSessionEnded = (data) => {
      if (!astrologerAuth.isAuthenticated) return;
      if (data.roomId) {
        dispatch(removeActiveSession(data.roomId));
      }
    };

    const handleAcceptConfirmed = () => {
      if (!astrologerAuth.isAuthenticated) return;
      dispatch(clearAllIncomingRequests());
      dispatch(fetchAstrologerDashboardThunk());
    };

    const handleAstroStatusChanged = ({ astrologerId, status }) => {
      if (!astrologerAuth.isAuthenticated) return;
      if (astrologerId === astrologerAuth.user?._id && status === 'busy') {
        dispatch(clearAllIncomingRequests());
      }
    };

    socket.on('wallet_updated', handleWalletUpdate);
    socket.on('new_notification', handleNewNotification);
    socket.on('dashboard_updated', handleDashboardUpdate);
    socket.on('pooja_booking_accepted', handlePoojaStatus);
    socket.on('pooja_booking_rejected', handlePoojaStatus);
    socket.on('pooja_booking_completed', handlePoojaStatus);

    // Attach astrologer listeners globally
    socket.on('incoming_session_request', handleIncomingRequest);
    socket.on('session_request_cancelled', handleRequestCancelled);
    socket.on('pending_requests_cleared', handlePendingClearedByRoom);
    socket.on('accept_failed', handleAcceptFailed);
    socket.on('session_ended', handleSessionEnded);
    socket.on('call_ended', handleSessionEnded);
    socket.on('session_accept_confirmed', handleAcceptConfirmed);
    socket.on('astro_status_changed', handleAstroStatusChanged);

    // Cleanup to prevent memory leaks and duplicate toasts
    return () => {
      socket.off('connect', joinRoom);
      socket.off('wallet_updated', handleWalletUpdate);
      socket.off('new_notification', handleNewNotification);
      socket.off('dashboard_updated', handleDashboardUpdate);
      socket.off('pooja_booking_accepted', handlePoojaStatus);
      socket.off('pooja_booking_rejected', handlePoojaStatus);
      socket.off('pooja_booking_completed', handlePoojaStatus);

      socket.off('incoming_session_request', handleIncomingRequest);
      socket.off('session_request_cancelled', handleRequestCancelled);
      socket.off('pending_requests_cleared', handlePendingClearedByRoom);
      socket.off('accept_failed', handleAcceptFailed);
      socket.off('session_ended', handleSessionEnded);
      socket.off('call_ended', handleSessionEnded);
      socket.off('session_accept_confirmed', handleAcceptConfirmed);
      socket.off('astro_status_changed', handleAstroStatusChanged);
    };
  }, [userAuth.isAuthenticated, adminAuth.isAuthenticated, astrologerAuth.isAuthenticated, dispatch]);
};

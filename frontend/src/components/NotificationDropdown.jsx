import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../api/notificationApis';
import { useSelector } from 'react-redux';
import getSocket from '../socket/socketManager';

const NotificationDropdown = ({ iconSize = 22, iconClassName = "text-gray-400 hover:text-orange-500" }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const astrologerState = useSelector((state) => state.astrologer);
  const incomingRequests = astrologerState?.incomingRequests || [];

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
    
    // Set up socket listener for real-time notifications
    try {
      const socket = getSocket();
      if (window.location.pathname.startsWith('/admin')) {
        socket.on('admin_new_order', fetchNotifications);
      }
      
      return () => {
        if (window.location.pathname.startsWith('/admin')) {
          socket.off('admin_new_order', fetchNotifications);
        }
      };
    } catch (err) {
      console.error('Socket init error', err);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      setNotifications(res.data?.data?.notifications || res.data?.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && !notification._id.startsWith('room_')) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <FiCheckCircle size={16} className="text-green-500" />;
      case 'warning': return <FiAlertCircle size={16} className="text-orange-500" />;
      case 'alert': return <FiAlertCircle size={16} className="text-red-500" />;
      default: return <FiInfo size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'warning': return 'bg-orange-50 border-orange-100';
      case 'alert': return 'bg-red-50 border-red-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  const requestNotifications = incomingRequests.map(req => ({
    _id: req.roomId,
    title: `New ${req.type.charAt(0).toUpperCase() + req.type.slice(1)} Request`,
    message: `${req.userName} is requesting a ${req.type} session.`,
    type: 'warning', 
    createdAt: new Date().toISOString(),
    isRead: false,
    link: req.type === 'chat' ? '/astrologer/chats' : '/astrologer/calls',
  }));

  const allNotifications = [...requestNotifications, ...notifications];
  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const formatMessage = (msg) => {
    if (!msg) return '';
    // Formats any number with more than 2 decimal places to 2 decimal places
    return msg.replace(/(\d+\.\d{3,})/g, (match) => parseFloat(match).toFixed(2));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-colors ${iconClassName} flex items-center justify-center`}
      >
        <FiBell size={iconSize} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in origin-top-right">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <FiBell className="text-orange-500" /> Notifications
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">{unreadCount} unread messages</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-orange-600 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiBell size={20} className="text-gray-400" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">No Notifications</h4>
                <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {allNotifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 transition-colors cursor-pointer flex gap-3 ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-orange-50/30 hover:bg-orange-50/50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getBgColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-bold text-[13px] leading-tight ${notification.isRead ? 'text-gray-800' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap shrink-0 mt-0.5">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                        {formatMessage(notification.message)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

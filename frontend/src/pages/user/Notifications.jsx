import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { useGlobalSocket } from '../../hooks/useGlobalSocket';
import LogoLoader from '../../components/LogoLoader';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useGlobalSocket();

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (data) => {
        setNotifications((prev) => [data, ...prev]);
      });
      // also listen to user-specific notifications if applicable
      socket.on('notification_received', (data) => {
        setNotifications((prev) => [data, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('notification_received');
      }
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/notifications');
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    toggleSelection(notification._id);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await axiosInstance.delete('/notifications', { data: { ids: selectedIds } });
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put('/notifications/all/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft size={22} className="text-gray-700" />
            </button>
            <h1 className="text-[17px] font-bold text-gray-800">
              {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Notifications'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <button onClick={handleDeleteSelected} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1">
                <Trash2 size={18} />
              </button>
            ) : notifications.some(n => !n.isRead) && (
              <button onClick={markAllAsRead} className="text-[12px] font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <LogoLoader />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-orange-400" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-800 mb-2">No Notifications Yet</h3>
            <p className="text-[13px] text-gray-500">When you receive updates about orders, poojas, or offers, they will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isSelected = selectedIds.includes(notification._id);
            return (
              <div 
                key={notification._id || Math.random()} 
                onClick={() => handleNotificationClick(notification)}
                className={`group relative bg-white rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'border-2 border-orange-500 bg-orange-50/30 shadow-md ring-4 ring-orange-50' 
                    : !notification.isRead 
                      ? 'border border-orange-100 shadow-[0_4px_16px_rgba(255,106,26,0.06)] hover:shadow-md hover:-translate-y-0.5' 
                      : 'border border-gray-100 shadow-sm opacity-90 hover:opacity-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4 relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isSelected ? 'scale-95' : 'group-hover:scale-105'} ${
                    notification.type === 'offer' ? 'bg-green-50 text-green-500' :
                    notification.type === 'warning' ? 'bg-red-50 text-red-500' :
                    'bg-orange-50 text-orange-500'
                  }`}>
                    <Bell size={20} fill={!notification.isRead ? "currentColor" : "none"} />
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1 pr-6">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className={`text-[15px] ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[11px] font-medium text-gray-400 shrink-0 mt-0.5 tracking-wide">
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[13px] leading-relaxed ${!notification.isRead ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>

                {/* Unread Dot (Only when not selected) */}
                {!notification.isRead && !isSelected && (
                  <div className="absolute top-5 right-4 w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-sm" />
                )}

                {/* Professional Circular Checkbox */}
                <div className={`absolute top-1/2 -translate-y-1/2 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isSelected 
                    ? 'border-orange-500 bg-orange-500 scale-100 opacity-100' 
                    : 'border-gray-200 bg-white scale-90 opacity-0 group-hover:opacity-50'
                }`}>
                  <Check size={14} className={`text-white transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BottomNav from '../components/BottomNav';
import { X, ChevronRight, LogOut } from 'lucide-react';
import { logout, fetchProfileThunk } from '../store/slices/authSlice';
import CartBottomSheet from '../components/CartBottomSheet';
import { useEffect } from 'react';
import getSocket from '../socket/socketManager';
import { setActiveSession, clearPendingRequest } from '../store/slices/sessionSlice';
import axios from '../api/axios';

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isBottomBannerHidden, setIsBottomBannerHidden] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, settings, isAuthenticated } = useSelector((state) => state.auth) || {};
  const { appName, appLogo } = useSelector((state) => state.settings) || { appName: 'JyotishLink', appLogo: '' };

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfileThunk());
    }
  }, [dispatch, isAuthenticated]);

  const isFullWidth = location.pathname.includes('/user/store') || location.pathname.includes('/user/chat') || location.pathname.includes('/user/details') || location.pathname.includes('/user/video-room');
  const hideBottomNav = location.pathname.includes('/user/details') || location.pathname.includes('/user/recharge') || location.pathname.includes('/user/free-chat-offer') || location.pathname.includes('/user/video-room') || location.pathname.includes('/user/payment') || location.pathname.includes('/user/cart') || location.pathname.includes('/user/checkout') || location.pathname.includes('/user/product') || location.pathname.includes('/user/search') || location.pathname.includes('/user/pooja-booking') || location.pathname.includes('/user/order');

  const handleLogout = async () => {
    try {
      const fcmToken = localStorage.getItem('jl_last_fcm_token');
      await axios.post('/auth/logout', { fcmToken, role: 'user' });
      localStorage.removeItem('jl_last_fcm_token');
      localStorage.removeItem('jl_last_fcm_role');
    } catch (err) {
      console.error('Logout error:', err);
    }
    dispatch(logout());
    setIsSidebarOpen(false);
    navigate('/');
  };

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (user) {
      const socket = getSocket();

      const handleSessionAccepted = ({ roomId }) => {
        dispatch(setActiveSession({ roomId, status: 'accepted' }));
        dispatch(clearPendingRequest());
      };

      const handleSessionRejected = ({ reason }) => {
        dispatch(clearPendingRequest());
      };

      socket.on('session_accepted', handleSessionAccepted);
      socket.on('session_rejected', handleSessionRejected);

      return () => {
        socket.off('session_accepted', handleSessionAccepted);
        socket.off('session_rejected', handleSessionRejected);
      };
    }
  }, [user, dispatch]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="bg-white min-h-screen relative">
      {/* ═══ SIDEBAR OVERLAY ═══ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* ═══ SIDEBAR DRAWER ═══ */}
      <div className={`fixed top-0 bottom-0 left-0 w-[250px] bg-white z-[100] transform transition-transform duration-300 shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 p-5 flex flex-col items-center justify-center relative">
          <button onClick={() => setIsSidebarOpen(false)} className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white rounded-full border-4 border-orange-200 overflow-hidden shadow-lg mb-2">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500 text-xl font-bold">
                {(user?.name || 'G')[0]}
              </div>
            )}
          </div>
          <h2 className="font-bold text-white text-[15px]">{user?.name || 'Guest User'}</h2>
          <p className="text-orange-100 text-[11px] font-medium mt-0.5">{user?.phone || '+91 9876543210'}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            {[
              { label: 'My Profile', emoji: '👤', path: '/user/profile' },
              { label: 'Order History', emoji: '📋', path: '/user/history' },
              { label: 'Wallet', emoji: '👛', path: '/user/history?tab=wallet' },
              { label: 'Notifications', emoji: '🔔', path: '/user/notifications' },
              { label: 'Customer Support', emoji: '🎧', action: () => { setIsSidebarOpen(false); setShowSupportModal(true); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { 
                  if (item.action) {
                    item.action();
                  } else {
                    setIsSidebarOpen(false); navigate(item.path); 
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3 font-semibold text-[14px]">
                  <span className="text-lg">{item.emoji}</span> {item.label}
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
              </button>
            ))}
            <div className="pt-4 mt-2">
              {!user?.phone ? (
                <button
                  onClick={async () => {
                    try {
                      const fcmToken = localStorage.getItem('jl_last_fcm_token');
                      await axios.post('/auth/logout', { fcmToken, role: 'user' });
                      localStorage.removeItem('jl_last_fcm_token');
                      localStorage.removeItem('jl_last_fcm_role');
                    } catch (e) {}
                    dispatch(logout());
                    setIsSidebarOpen(false);
                    navigate('/user/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 font-bold py-2.5 rounded-lg hover:bg-orange-100 transition-colors text-[14px]"
                >
                  Login / Sign Up
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-100 transition-colors text-[14px]"
                >
                  <LogOut size={16} /> Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className={`w-full pb-16 lg:pb-0 ${isFullWidth ? '' : 'max-w-7xl mx-auto'}`}>
        <Outlet context={{ 
          openSidebar: () => setIsSidebarOpen(true),
          setHideBottomBanner: setIsBottomBannerHidden 
        }} />
      </main>

      {/* ═══ FREE CHAT BOTTOM BANNER ═══ */}
      {user?.freeChatUsed === false && localStorage.getItem('claimedFreeChat') !== 'true' && !isBannerDismissed && !hideBottomNav && !isBottomBannerHidden && (
        <div className="fixed bottom-[56px] lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-[0_-4px_20px_rgba(255,106,26,0.1)] px-3 py-2 flex items-center gap-3 animate-slide-up rounded-t-xl sm:rounded-none">
          <button onClick={() => setIsBannerDismissed(true)} className="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
          
          <div className="flex flex-col items-center shrink-0 mt-1">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="w-10 h-10 object-contain mb-0.5" />
            ) : (
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mb-0.5 border border-orange-100 shadow-sm">
                 <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-6 h-6">
                    <circle cx="12" cy="12" r="3"/>
                    <circle cx="12" cy="12" r="7" strokeDasharray="2 2"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                 </svg>
              </div>
            )}
            <span className="text-[9px] text-orange-500 font-bold leading-none">{appName}</span>
          </div>

          <div className="flex-1 pr-2">
            <p className="text-[12px] text-gray-800 font-medium leading-snug mb-1.5">
              <span className="text-orange-600 font-bold">Congratulations!</span> Free chat with Astrologer
            </p>
            <button 
              onClick={() => navigate('/user/astrologers')} 
              className="w-full bg-orange-500 text-white font-bold py-2 rounded-md text-[11px] uppercase tracking-wide hover:bg-orange-600 transition-colors shadow-sm"
            >
              CHAT NOW
            </button>
          </div>
        </div>
      )}

      {/* ═══ CUSTOMER SUPPORT MODAL ═══ */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowSupportModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 p-6 flex flex-col items-center justify-center relative text-white">
              <button onClick={() => setShowSupportModal(false)} className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-3xl">🎧</span>
              </div>
              <h2 className="font-bold text-lg">Customer Support</h2>
              <p className="text-orange-100 text-xs font-medium mt-1 text-center">We're here to help you 24/7</p>
            </div>
            
            <div className="p-6 space-y-4">
              <a href={`mailto:${settings?.supportEmail || 'support@jyotishlink.com'}`} className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl hover:bg-orange-100 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                  ✉️
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Us</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{settings?.supportEmail || 'support@jyotishlink.com'}</p>
                </div>
              </a>
              
              <a href={`tel:${settings?.supportPhone || '+91 9999999999'}`} className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl hover:bg-orange-100 transition-colors group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500 group-hover:scale-110 transition-transform">
                  📞
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Call Us</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">{settings?.supportPhone || '+91 9999999999'}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <CartBottomSheet />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

export default UserLayout;

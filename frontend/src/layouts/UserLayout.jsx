import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BottomNav from '../components/BottomNav';
import { X, ChevronRight, LogOut } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import CartBottomSheet from '../components/CartBottomSheet';

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isBottomBannerHidden, setIsBottomBannerHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const isFullWidth = location.pathname.includes('/user/store') || location.pathname.includes('/user/chat') || location.pathname.includes('/user/details') || location.pathname.includes('/user/video-room');
  const hideBottomNav = location.pathname.includes('/user/details') || location.pathname.includes('/user/free-chat-offer') || location.pathname.includes('/user/video-room') || location.pathname.includes('/user/payment') || location.pathname.includes('/user/cart') || location.pathname.includes('/user/checkout');

  const handleLogout = () => {
    dispatch(logout());
    setIsSidebarOpen(false);
    navigate('/');
  };

  return (
    <div className="bg-white min-h-screen relative">
      {/* ═══ SIDEBAR OVERLAY ═══ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* ═══ SIDEBAR DRAWER ═══ */}
      <div className={`fixed top-0 bottom-0 left-0 w-[280px] bg-white z-50 transform transition-transform duration-300 shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 p-6 flex flex-col items-center justify-center relative">
          <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
          <div className="w-20 h-20 bg-white rounded-full border-4 border-orange-200 overflow-hidden shadow-lg mb-3">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500 text-2xl font-bold">
                {(user?.name || 'G')[0]}
              </div>
            )}
          </div>
          <h2 className="font-bold text-white text-lg">{user?.name || 'Guest User'}</h2>
          <p className="text-orange-100 text-sm font-medium">{user?.phone || '+91 9876543210'}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 space-y-1">
            {[
              { label: 'My Profile', emoji: '👤', path: '/user/profile' },
              { label: 'My Chats', emoji: '💬', path: '/user/chat' },
              { label: 'Order History', emoji: '📋', path: '/user/history' },
              { label: 'Wallet', emoji: '👛', path: '/user/history?tab=wallet' },
              { label: 'Notifications', emoji: '🔔', path: '/user/notifications' },
              { label: 'Settings', emoji: '⚙️', path: '/user/settings' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { setIsSidebarOpen(false); navigate(item.path); }}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 font-semibold">
                  <span className="text-xl">{item.emoji}</span> {item.label}
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
              </button>
            ))}
            <div className="pt-4 mt-2">
              {!user?.phone ? (
                <button
                  onClick={() => {
                    dispatch(logout());
                    setIsSidebarOpen(false);
                    navigate('/user/login');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 font-bold py-3 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  Login / Sign Up
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} /> Logout
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
      {user?.hasUsedFreeChat === false && localStorage.getItem('claimedFreeChat') !== 'true' && !isBannerDismissed && !hideBottomNav && !isBottomBannerHidden && (
        <div className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-orange-100 shadow-[0_-4px_20px_rgba(255,106,26,0.1)] px-4 py-3 flex items-center gap-4 animate-slide-up rounded-t-2xl sm:rounded-none">
          <button onClick={() => setIsBannerDismissed(true)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
          
          <div className="flex flex-col items-center shrink-0 mt-2">
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mb-1 border-2 border-orange-100 shadow-sm">
               <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-8 h-8">
                  <circle cx="12" cy="12" r="3"/>
                  <circle cx="12" cy="12" r="7" strokeDasharray="2 2"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
               </svg>
            </div>
            <span className="text-[10px] text-orange-500 font-bold">JyotishLink</span>
          </div>

          <div className="flex-1 pr-2">
            <p className="text-[14px] text-gray-800 font-medium leading-snug mb-3">
              <span className="text-orange-600 font-bold">Congratulations!</span> You have got a free chat with Astrologer
            </p>
            <button 
              onClick={() => navigate('/user/astrologers')} 
              className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide hover:bg-orange-600 transition-colors shadow-sm"
            >
              CHAT NOW
            </button>
          </div>
        </div>
      )}

      <CartBottomSheet />
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

export default UserLayout;

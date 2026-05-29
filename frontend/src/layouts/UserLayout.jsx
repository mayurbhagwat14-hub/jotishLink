import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import BottomNav from '../components/BottomNav';
import { X, ChevronRight, LogOut } from 'lucide-react';
import { logout } from '../store/slices/authSlice';

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const isFullWidth = location.pathname.includes('/user/store') || location.pathname.includes('/user/chat') || location.pathname.includes('/user/details') || location.pathname.includes('/user/video-room');
  const hideBottomNav = location.pathname.includes('/user/details') || location.pathname.includes('/user/free-chat-offer') || location.pathname.includes('/user/video-room');

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
              {user?.name === 'Guest User' ? (
                <button
                  onClick={() => navigate('/login')}
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
        <Outlet context={{ openSidebar: () => setIsSidebarOpen(true) }} />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

export default UserLayout;

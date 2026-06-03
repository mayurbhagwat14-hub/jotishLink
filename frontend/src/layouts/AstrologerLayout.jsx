import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { FiHome, FiMessageSquare, FiPhoneCall, FiVideo, FiUser, FiBell, FiX, FiSettings, FiLogOut, FiLogIn, FiUserPlus, FiCreditCard, FiActivity, FiClock, FiMenu, FiCheckCircle } from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import { updateAstrologerOnlineStatus } from '../api/astrologerApis';
import { login } from '../store/slices/authSlice';
import { addIncomingRequest, removeIncomingRequestByUserId } from '../store/slices/astrologerSlice';
import getSocket from '../socket/socketManager';
import NotificationDropdown from '../components/NotificationDropdown';

const AstrologerLayout = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(user?.onlineStatus === 'online' || false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'astrologer') {
      const socket = getSocket();
      socketRef.current = socket;

      socket.emit('join_astrologer_room', { astrologerId: user._id });

      socket.on('incoming_session_request', (data) => {
        dispatch(addIncomingRequest(data));
      });

      socket.on('session_request_cancelled', (data) => {
        dispatch(removeIncomingRequestByUserId(data.userId));
      });

      return () => {
        socket.off('incoming_session_request');
        socket.off('session_request_cancelled');
      };
    }
  }, [user, token, dispatch]);

  // Requests are now handled in the Chats/Calls tabs directly

  const handleLogout = () => {
    dispatch(logout());
    navigate('/astrologer/login');
  };

  const toggleStatus = async () => {
    if (statusLoading) return;
    setStatusLoading(true);
    const newStatus = isOnline ? 'offline' : 'online';
    try {
      await updateAstrologerOnlineStatus(newStatus);
      setIsOnline(!isOnline);
      if (user) {
        dispatch(login({ user: { ...user, onlineStatus: newStatus }, token }));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const { incomingRequests } = useSelector((state) => state.astrologer);
  
  const chatRequestsCount = incomingRequests.filter(req => req.type === 'chat').length;
  const callRequestsCount = incomingRequests.filter(req => req.type === 'audio' || req.type === 'video').length;

  const navLinks = [
    { path: '/astrologer/dashboard', name: 'Home', icon: <FiHome size={22} /> },
    { path: '/astrologer/chats', name: 'Chats', icon: <FiMessageSquare size={22} />, badge: chatRequestsCount > 0 ? chatRequestsCount : null },
    { path: '/astrologer/calls', name: 'Calls', icon: <FiPhoneCall size={22} />, badge: callRequestsCount > 0 ? callRequestsCount : null },
    { path: '/astrologer/history', name: 'History', icon: <FiClock size={22} /> },
    { path: '/astrologer/pooja', name: 'Pooja', icon: <GiFlowerPot size={22} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 z-10 shrink-0 relative">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <FiMenu size={20} />
          </button>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors text-left"
          >
             <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 overflow-hidden flex-shrink-0">
                <img src="https://i.pravatar.cc/150?u=astrologer1" alt="Astrologer" className="w-full h-full object-cover" />
             </div>
             <div>
               <h3 className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[120px]">{user?.name || 'Astrologer'}</h3>
             </div>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            <span className={`text-[12px] font-bold ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <div 
              onClick={toggleStatus}
              className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${statusLoading ? 'opacity-50' : ''} ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isOnline ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </div>
          
          <div className="relative">
            <NotificationDropdown iconClassName="text-gray-400 hover:text-orange-500" iconSize={22} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 relative">
         {/* Subtle background decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
         <Outlet />

      </main>

      {/* Side Drawer Navbar */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80%] bg-white h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 overflow-hidden flex-shrink-0 shadow-sm">
                    <img src="https://i.pravatar.cc/150?u=astrologer1" alt="Astrologer" className="w-full h-full object-cover" />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 leading-tight">{user?.name || 'Astrologer'}</h3>
                   <p className="text-xs font-bold text-orange-500">Astrologer Panel</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-500 hover:text-red-500 shadow-sm border border-gray-100 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Manage Profile</p>
                
                <Link to="/astrologer/profile" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors">
                  <FiSettings size={18} /> Profile Settings
                </Link>
                <Link to="/astrologer/earnings" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors">
                  <FiCreditCard size={18} /> Earnings & Wallet
                </Link>
                <Link to="/astrologer/analytics" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-bold transition-colors">
                  <FiActivity size={18} /> Analytics
                </Link>
              </div>

              <div className="mt-6 px-4 space-y-1">
                <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                
                {user ? (
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold transition-colors text-left">
                    <FiLogOut size={18} /> Log out
                  </button>
                ) : (
                  <>
                    <Link to="/astrologer/login" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-bold transition-colors">
                      <FiLogIn size={18} /> Log In
                    </Link>
                    <Link to="/astrologer/apply" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-600 font-bold transition-colors">
                      <FiUserPlus size={18} /> Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 text-center">
              <p className="text-xs font-bold text-gray-400">JyotishLink Panel v1.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none md:max-w-md md:mx-auto">
        <nav className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-orange-500/10 rounded-3xl flex justify-around items-center h-16 px-2 pointer-events-auto relative overflow-hidden">
          {/* Subtle gradient glow inside the navbar */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
          
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all group relative z-10"
              >
                <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 -translate-y-1' : 'text-gray-400 group-hover:text-orange-400 group-hover:bg-orange-50/50'}`}>
                  {link.icon}
                  {link.badge && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black flex items-center justify-center rounded-full border-2 ${isActive ? 'bg-white text-red-500 border-orange-500 shadow-sm' : 'bg-red-500 text-white border-white shadow-sm shadow-red-500/30 animate-pulse-slow'}`}>
                      {link.badge}
                    </span>
                  )}
                </div>
                {/* Optional subtle dot for active state if we don't use name */}
                {isActive ? (
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-0.5"></span>
                ) : (
                  <span className="text-[9px] font-bold text-gray-400 transition-colors group-hover:text-orange-400">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Desktop Wrapper (Optional, to keep it centered like an app on large screens) */}
      <style>{`
        @media (min-width: 768px) {
          body {
            background-color: #f3f4f6;
          }
          #root {
            max-w: 28rem; /* 448px */
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            min-height: 100vh;
            position: relative;
          }
            max-width: 28rem;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default AstrologerLayout;

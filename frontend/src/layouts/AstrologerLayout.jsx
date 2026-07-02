import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { astrologerLogout } from '../store/slices/astrologerAuthSlice';
import { clearAstrologerDashboard } from '../store/slices/dashboardSlice';
import axios from '../api/axios';
import { FiHome, FiMessageSquare, FiPhoneCall, FiVideo, FiUser, FiBell, FiX, FiSettings, FiLogOut, FiLogIn, FiUserPlus, FiCreditCard, FiActivity, FiClock, FiMenu, FiCheckCircle } from 'react-icons/fi';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { GiFlowerPot } from 'react-icons/gi';
import { updateAstrologerOnlineStatus } from '../api/astrologerApis';
import { login } from '../store/slices/authSlice';
import { addIncomingRequest, removeIncomingRequestByUserId, clearAllIncomingRequests, removeActiveSession } from '../store/slices/astrologerSlice';
import getSocket from '../socket/socketManager';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';

const AstrologerLayout = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.astrologerAuth);
  const { profile } = useSelector((state) => state.astrologer);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(user?.onlineStatus === 'online' || user?.onlineStatus === 'busy');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      setIsOnline(user.onlineStatus === 'online' || user.onlineStatus === 'busy');
    }
  }, [user]);

  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(false);
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (user && user.role === 'astrologer') {
      const socket = getSocket(token);
      socketRef.current = socket;

      const joinRoom = () => {
        socket.emit('join_astrologer_room', { astrologerId: user._id });
      };

      // Join immediately if connected, or when it connects
      if (socket.connected) {
        joinRoom();
      }
      socket.on('connect', joinRoom);

      // Note: All astrologer request/session socket listeners (incoming_session_request, 
      // pending_requests_cleared, etc.) have been moved to useGlobalSocket.js so they 
      // do not unmount when navigating to the full-screen ChatRoom.

      return () => {
        socket.off('connect', joinRoom);
      };
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    if (user && user.role === 'astrologer') {
      import('../store/slices/astrologerSlice').then(({ fetchAstrologerProfileThunk, fetchAstrologerPoojaRequestsThunk }) => {
        dispatch(fetchAstrologerProfileThunk());
        dispatch(fetchAstrologerPoojaRequestsThunk());
      });
    }
  }, [dispatch, user]);

  // Requests are now handled in the Chats/Calls tabs directly

  const handleLogout = async () => {
    try {
      const fcmToken = localStorage.getItem('jl_last_fcm_token');
      await axios.post('/auth/logout', { fcmToken, role: 'astrologer' });
      localStorage.removeItem('jl_last_fcm_token');
      localStorage.removeItem('jl_last_fcm_role');
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // Disconnect socket properly on logout
    import('../socket/socketManager').then(({ resetSocket }) => resetSocket());
    
    dispatch(astrologerLogout());
    dispatch(clearAstrologerDashboard());
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

  const { incomingRequests, poojaRequests = [] } = useSelector((state) => state.astrologer);
  
  const chatRequestsCount = incomingRequests.filter(req => req.type === 'chat').length;
  const callRequestsCount = incomingRequests.filter(req => req.type === 'audio' || req.type === 'video').length;
  const poojaRequestsCount = poojaRequests.filter(req => req.status === 'Pending').length;

  const navLinks = [
    { path: '/astrologer/dashboard', name: 'Home', icon: <FiHome size={22} /> },
    { path: '/astrologer/chats', name: 'Chats', icon: <FiMessageSquare size={22} />, badge: chatRequestsCount > 0 ? chatRequestsCount : null },
    { path: '/astrologer/calls', name: 'Calls', icon: <FiPhoneCall size={22} />, badge: callRequestsCount > 0 ? callRequestsCount : null },
    { path: '/astrologer/history', name: 'History', icon: <FiClock size={22} /> },
    { path: '/astrologer/pooja', name: 'Pooja', icon: <GiFlowerPot size={22} />, badge: poojaRequestsCount > 0 ? poojaRequestsCount : null },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-2 sm:px-4 z-10 shrink-0 relative">
        <div className="flex items-center gap-0 sm:gap-1 overflow-hidden">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-[#fa6830] hover:bg-orange-50 rounded-lg transition-colors flex-shrink-0"
          >
            <FiMenu size={20} />
          </button>
          
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 hover:bg-gray-50 px-1 sm:px-2 py-1 rounded-lg transition-colors text-left overflow-hidden"
          >
             <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-100 border border-orange-200 overflow-hidden flex-shrink-0">
                <img src={profile?.astrologer?.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name === 'Temp Astrologer' ? 'Astrologer' : user?.name) || 'Astrologer')}&background=ffedD5&color=f97316`} alt="Astrologer" className="w-full h-full object-cover" />
             </div>
             <div className="overflow-hidden">
               <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate max-w-[80px] sm:max-w-[120px]">{user?.name === 'Temp Astrologer' ? 'Astrologer' : (user?.name || 'Astrologer')}</h3>
             </div>
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-full border border-gray-100">
            <span className={`text-[10px] sm:text-[12px] font-bold ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <div 
              onClick={toggleStatus}
              className={`w-8 h-4 sm:w-9 sm:h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${statusLoading ? 'opacity-50' : ''} ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-sm transition-transform ${isOnline ? 'translate-x-3.5 sm:translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </div>
          
          <div className="relative flex-shrink-0">
            <NotificationDropdown iconClassName="text-gray-400 hover:text-[#fa6830]" iconSize={20} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden pb-16 relative">
         {/* Subtle background decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
         <ErrorBoundary>
           <Outlet />
         </ErrorBoundary>
      </main>

      {/* Side Drawer Navbar */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
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
                    <img src={profile?.astrologer?.avatar || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.name === 'Temp Astrologer' ? 'Astrologer' : user?.name) || 'Astrologer')}&background=ffedD5&color=f97316`} alt="Astrologer" className="w-full h-full object-cover" />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 leading-tight">{user?.name === 'Temp Astrologer' ? 'Astrologer' : (user?.name || 'Astrologer')}</h3>
                   <p className="text-xs font-bold text-[#fa6830]">Astrologer Panel</p>
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
                
                <Link to="/astrologer/profile" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-[#e55923] font-bold transition-colors">
                  <FiSettings size={18} /> Profile Settings
                </Link>
                <Link to="/astrologer/earnings" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-[#e55923] font-bold transition-colors">
                  <FiCreditCard size={18} /> Earnings & Wallet
                </Link>
                <Link to="/astrologer/session-earnings" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-[#e55923] font-bold transition-colors">
                  <FiClock size={18} /> Session Earnings
                </Link>
                <Link to="/astrologer/analytics" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-[#e55923] font-bold transition-colors">
                  <FiActivity size={18} /> Analytics
                </Link>
              </div>

              <div className="mt-6 px-4 space-y-1">
                <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                
                {user ? (
                  <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 font-bold transition-colors text-left">
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
              <p className="text-xs font-bold text-gray-400">{appName} Panel v1.0</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Up Banner - Absolute positioned overlay */}
      {!isKeyboardOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-[90] pointer-events-none md:max-w-md md:mx-auto">
          <nav className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full flex justify-around items-center h-[60px] px-2 pointer-events-auto relative overflow-hidden">
          
          {navLinks.map((link) => {
            const isActive = location.pathname.includes(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 transition-all group relative z-10"
              >
                <div className={`relative transition-all duration-300 ${isActive ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {link.icon}
                  {link.badge && (
                    <span className={`absolute -top-1 -right-2 w-4 h-4 text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white ${isActive ? 'bg-[#fa6830] text-white' : 'bg-red-500 text-white animate-pulse-slow'}`}>
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      )}
      
      {/* ═══ LOGOUT CONFIRMATION MODAL ═══ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 animate-scale-in text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <FiLogOut size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Log Out</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Are you sure you want to log out of your astrologer account?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm shadow-red-500/30"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

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

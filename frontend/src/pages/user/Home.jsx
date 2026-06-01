import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Grid, Target, MessageCircle, Phone, Lock, BadgeCheck, ShieldCheck, Bell, ChevronRight, Calendar, Clock } from 'lucide-react';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import { fetchUserHomeDataThunk } from '../../store/slices/dashboardSlice';
import NotificationDropdown from '../../components/NotificationDropdown';
import LowBalanceModal from '../../components/LowBalanceModal';
import { io } from 'socket.io-client';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFreeChatPopup, setShowFreeChatPopup] = useState(false);
  const { openSidebar, setHideBottomBanner } = useOutletContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { userHome } = useSelector((state) => state.dashboard);

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, name: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const s = io('http://localhost:5000', { auth: { token } });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (setHideBottomBanner) {
      setHideBottomBanner(showFreeChatPopup);
    }
    return () => {
      if (setHideBottomBanner) setHideBottomBanner(false);
    };
  }, [showFreeChatPopup, setHideBottomBanner]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 0);
    dispatch(fetchProfileThunk());
    dispatch(fetchUserHomeDataThunk());
    return () => clearTimeout(t);
  }, [dispatch]);

  useEffect(() => {
    if (user && user.hasUsedFreeChat === false) {
      setShowFreeChatPopup(true);
    }
  }, [user]);

  const handleChatCallAction = (path) => {
    if (!user || user?.name === 'Guest User') {
      navigate('/user/login', { state: { redirectTo: path } });
    } else if (!user?.name || user?.name.trim() === '') {
      navigate('/user/details', { state: { redirectTo: path } });
    } else {
      navigate(path);
    }
  };

  const handleViewChat = (session) => {
    if (session.astrologer) {
      navigate('/user/chat', { state: { astrologer: session.astrologer } });
    } else {
      navigate('/user/astrologers');
    }
  };

  const handleChatAgain = (session) => {
    const astro = session.astrologer;
    if (!astro) {
      navigate('/user/astrologers');
      return;
    }

    const rate = astro.pricing?.chat || astro.rate || 5;
    const requiredAmount = rate * 5;
    const walletBalance = user?.wallet || 0;
    const astroName = astro.name || session.name || 'Astrologer';

    const isFreeChatEligible = user?.hasUsedFreeChat === false;

    if (walletBalance < requiredAmount && !isFreeChatEligible) {
      setShortBalanceInfo({ required: requiredAmount, current: walletBalance, name: astroName });
      setShowBalanceModal(true);
    } else {
      if (isFreeChatEligible) {
        navigate(`/user/chat`, { state: { astrologer: astro, startWithBot: true, roomId: `room_${user._id}_bot_${Date.now()}` } });
        return;
      }

      if (!socket) return;
      setIsConnecting(true);
      setConnectingAstroName(astroName);

      const targetAstroId = astro.userId?._id || astro.userId || astro._id;
      setConnectingAstroId(targetAstroId);

      socket.emit('request_session', {
        astrologerId: targetAstroId,
        userId: user._id,
        userName: user.name,
        type: 'chat',
      });

      socket.once('session_accepted', ({ roomId }) => {
        setIsConnecting(false);
        socket.off('session_rejected');
        navigate(`/user/chat`, { state: { astrologer: astro, startWithBot: false, roomId } });
      });

      socket.once('session_rejected', ({ reason }) => {
        setIsConnecting(false);
        socket.off('session_accepted');
        alert(`Request declined: ${reason}`);
      });
    }
  };

  return (
    <div className={`w-full font-sans pb-24 bg-white relative transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* ═══ TOP NAVBAR ═══ */}
      <div className="flex items-center justify-between px-4 py-3 bg-orange-400 sticky top-0 z-30 border-b border-orange-500">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-orange-500 px-2 py-1 -ml-2 rounded-xl transition-colors"
            onClick={openSidebar}
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">{(user?.name || 'G')[0]}</span>
              )}
            </div>
            <span className="text-white font-semibold text-[15px]">Hi {user?.name || 'Guest'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/user/wallet')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-white/40 rounded-full text-[12px] font-bold text-white bg-white/20 shadow-sm hover:bg-white/30 transition-colors"
          >
            <span className="text-base leading-none">👛</span> Add Cash
            <span className="bg-white text-orange-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">+</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <NotificationDropdown iconSize={16} iconClassName="text-white" />
          </div>
        </div>
      </div>

      {/* ═══ SEARCH BAR ═══ */}
      <div className="px-4 py-3 bg-orange-400 rounded-b-3xl mb-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search astrologers, services..."
            className="w-full border-2 border-transparent rounded-xl py-2.5 px-4 pr-10 text-[14px] outline-none focus:ring-2 focus:ring-white/50 bg-white text-gray-800 transition-all shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400">
            <Search size={18} />
          </div>
        </div>
      </div>

      {/* ═══ QUICK SERVICES ═══ */}
      <div className="flex justify-between px-3 py-6 bg-white w-full">
        {[
          { name: 'Daily\nHoroscope', icon: <Sun size={24} className="text-white" />, path: '/user/horoscope', bg: 'bg-orange-400' },
          { name: 'Free\nKundli', icon: <Grid size={24} className="text-white" />, path: '/user/kundli', bg: 'bg-orange-500' },
          { name: 'Kundli\nMatching', icon: <Target size={24} className="text-white" />, path: '/user/matchmaking', bg: 'bg-orange-400' },
          { name: 'Panchang', icon: <Calendar size={24} className="text-white" />, path: '/user/panchang', bg: 'bg-orange-500' },
          { name: 'Shubh\nMuhurat', icon: <Clock size={24} className="text-white" />, path: '/user/muhurat', bg: 'bg-orange-400' },
        ].map((service, idx) => (
          <div key={idx} onClick={() => service.path && navigate(service.path)} className="flex flex-col items-center text-center group cursor-pointer flex-1">
            <div className={`w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] ${service.bg} rounded-2xl flex items-center justify-center mb-2 shadow-md shadow-orange-200/50 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
              {service.icon}
            </div>
            <span className="text-[9.5px] sm:text-[11px] text-gray-600 font-semibold whitespace-pre-line leading-tight">{service.name}</span>
          </div>
        ))}
      </div>

      {/* ═══ CHAT BANNER ═══ */}
      <div className="px-4 pb-4">
        <div
          className="w-full rounded-2xl overflow-hidden shadow-card cursor-pointer hover:shadow-card-hover transition-shadow duration-300 relative bg-gradient-to-r from-orange-500 to-orange-400 p-4 flex items-center gap-4"
          onClick={() => handleChatCallAction('/user/astrologers')}
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-[16px]">Got any questions?</h3>
            <p className="text-orange-100 text-[13px]">Chat with Astrologer @ ₹5/min</p>
          </div>
          <ChevronRight size={20} className="text-white/60" />
        </div>
      </div>

      {/* ═══ MY SESSIONS ═══ */}
      {/* ═══ MY SESSIONS / EXCLUSIVE OFFER ═══ */}
      {(userHome?.activeSession || (user && user.hasUsedFreeChat === false)) && (
        <div className="px-4 py-5 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-bold text-gray-800">
              {userHome?.activeSession ? "My Sessions" : "Exclusive Offer"}
            </h2>
            {userHome?.activeSession && (
              <span 
                onClick={() => navigate('/user/history')} 
                className="text-[13px] text-orange-500 font-semibold cursor-pointer hover:text-orange-600 transition-colors"
              >
                View All
              </span>
            )}
          </div>

          {userHome?.activeSession ? (
            <div className="border border-gray-100 rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <img src={userHome.activeSession.avatar} alt={userHome.activeSession.name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-orange-100" />
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[16px]">{userHome.activeSession.name}</h3>
                  <p className="text-[12px] text-gray-400 font-medium mt-0.5">{userHome.activeSession.date}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleViewChat(userHome.activeSession)} 
                  className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-[13px] hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  View Chat
                </button>
                <button 
                  onClick={() => handleChatAgain(userHome.activeSession)} 
                  className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl text-[13px] shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  Chat Again
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-orange-100 bg-gradient-to-br from-orange-50/50 to-white rounded-2xl p-5 shadow-card relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/40 rounded-full blur-xl -z-10" />
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] bg-orange-500 rounded-full flex items-center justify-center relative shrink-0 shadow-md shadow-orange-200">
                  <span className="text-2xl">🎁</span>
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase scale-90 border border-white animate-pulse">
                    Free
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-1.5 leading-snug">
                    Get your First Chat for FREE! <span className="text-orange-500">✨</span>
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5 leading-relaxed">
                    Consult our top verified astrologers at zero cost. Get answers instantly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChatCallAction('/user/free-chat-offer')}
                className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-[12px] shadow-sm shadow-orange-200 transition-all hover:shadow-md shrink-0 active:scale-95 whitespace-nowrap"
              >
                START FREE CHAT
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ ASTROLOGERS SECTION ═══ */}
      {userHome?.featuredAstrologers?.length > 0 && (
        <div className="px-4 py-5 bg-white mt-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-bold text-gray-800">Astrologers</h2>
            <span 
              onClick={() => navigate('/user/astrologers')} 
              className="text-[13px] text-gray-400 font-semibold cursor-pointer hover:text-orange-500 transition-colors"
            >
              View All
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {userHome.featuredAstrologers.map((astro, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/user/astrologers')}
                className="shrink-0 w-[140px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative flex flex-col items-center p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Celebrity Ribbon */}
                <div className="absolute top-0 left-0 bg-[#2d2d2d] text-yellow-500 text-[8px] font-bold py-0.5 px-6 -rotate-45 -translate-x-5 translate-y-2 shadow-sm">
                  *Celebrity*
                </div>
                
                {/* Avatar */}
                <div className="w-[72px] h-[72px] rounded-full p-[2px] border-[2px] border-yellow-400 mb-2 mt-3">
                  <img 
                    src={astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`} 
                    alt={astro.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                
                {/* Info */}
                <h3 className="font-semibold text-[14px] text-gray-800 text-center w-full truncate">{astro.name}</h3>
                <p className="text-[11px] text-gray-500 mb-3 font-medium">₹ {astro.pricing?.chat || 5}/min</p>
                
                {/* Chat Button */}
                <button className="w-full py-1.5 rounded-full border border-green-600 text-green-700 text-[13px] font-semibold hover:bg-green-50 transition-colors">
                  Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ JYOTISHLINK STORE ═══ */}
      <div className="px-4 py-5 bg-white mt-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[17px] font-bold text-gray-800">JyotishLink Services</h2>
          <span
            onClick={() => navigate('/user/store')}
            className="text-[13px] text-orange-500 font-semibold cursor-pointer hover:text-orange-600 transition-colors"
          >
            Visit Store →
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(userHome?.services || []).map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[90px] cursor-pointer group">
              <div className="w-[80px] h-[80px] bg-orange-50 rounded-2xl overflow-hidden shadow-card border border-orange-100">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="text-[12px] text-gray-700 font-semibold">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CELEBRITIES SECTION ═══ */}
      {userHome?.celebrities?.length > 0 && (
        <div className="px-4 py-5 bg-white mt-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[17px] font-bold text-gray-800">What Celebrities Says</h2>
            <span className="text-[13px] text-orange-500 font-semibold cursor-pointer">View All</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {userHome.celebrities.map((celeb, i) => (
              <div key={i} className="shrink-0 w-[200px] bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 p-4 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <img src={celeb.img} alt={celeb.name} className="w-12 h-12 rounded-full object-cover border-2 border-orange-200" />
                  <div>
                    <h4 className="font-bold text-gray-800 text-[14px]">{celeb.name}</h4>
                    <p className="text-[11px] text-gray-400">{celeb.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-[11px] bg-orange-500 text-white px-3 py-1 rounded-full font-bold">Top Astro</button>
                  <button onClick={() => handleChatCallAction('/user/astrologers')} className="text-[11px] border border-orange-300 text-orange-500 px-3 py-1 rounded-full font-medium">View Chat</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ UNLOCK COSMIC BANNER ═══ */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <h3 className="text-white font-bold text-[18px] mb-1">Unlock Your Cosmic Destiny</h3>
          <p className="text-orange-100 text-[13px] mb-4">Chat with verified astrologers at ₹5/min</p>
          <button onClick={() => handleChatCallAction('/user/chat')} className="bg-white text-orange-600 font-bold text-[13px] px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
            Chat Now
          </button>
        </div>
      </div>

      {/* ═══ NEWS & BLOGS ═══ */}
      <div className="px-4 py-5 bg-white mt-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[17px] font-bold text-gray-800">News & Blogs</h2>
          <span className="text-[13px] text-orange-500 font-semibold cursor-pointer">View All</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(userHome?.blogs || []).map((blog, i) => (
            <div key={i} className="shrink-0 w-[160px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-card cursor-pointer hover:shadow-card-hover transition-shadow">
              <div className="h-[100px]">
                <img src={blog.img} alt="blog" className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-[12px] text-gray-800 leading-snug line-clamp-2">{blog.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TRUST BADGES ═══ */}
      <div className="px-4 py-6 bg-orange-50 mt-2">
        <p className="text-center text-[12px] text-gray-500 font-medium mb-4">With verified astrologers your details are Private & Confidential!</p>
        <div className="flex justify-around items-start">
          {[
            { name: 'Private &\nConfidential', icon: <Lock size={22} className="text-orange-500" /> },
            { name: 'Verified\nAstrologers', icon: <BadgeCheck size={22} className="text-orange-500" /> },
            { name: 'Secure\nPayments', icon: <ShieldCheck size={22} className="text-orange-500" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-2 w-[80px]">
              <div className="w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center border-2 border-orange-200 shadow-sm">
                {item.icon}
              </div>
              <span className="text-[11px] text-gray-600 font-semibold whitespace-pre-line leading-tight">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ LIVE ASTROLOGERS ═══ */}
      <div className="px-4 py-5 bg-white mt-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[17px] font-bold text-gray-800">Live Astrologers</h2>
          <span className="text-[13px] text-orange-500 font-semibold cursor-pointer">View All</span>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {(userHome?.liveAstrologers || []).map((astro, i) => (
            <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-[80px] cursor-pointer group">
              <div className="relative">
                <div className="w-[64px] h-[64px] rounded-full border-2 border-orange-400 p-0.5 group-hover:border-orange-500 transition-colors">
                  <img src={astro.img} alt={astro.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <span className="text-[11px] text-gray-700 font-semibold text-center leading-tight">{astro.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FLOATING STICKY ACTION BUTTONS ═══ */}
      <div className="fixed bottom-[76px] left-0 right-0 px-4 flex gap-4 justify-center z-40 lg:hidden">
        <button
          onClick={() => handleChatCallAction('/user/astrologers?type=chat')}
          className="flex-1 bg-orange-500 text-white shadow-lg shadow-orange-300/50 rounded-full py-3 flex items-center justify-center gap-2 font-bold text-[13px] hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          <MessageCircle size={16} fill="currentColor" /> Chat with Astrologer
        </button>
        <button
          onClick={() => handleChatCallAction('/user/astrologers?type=call')}
          className="flex-1 bg-orange-500 text-white shadow-lg shadow-orange-300/50 rounded-full py-3 flex items-center justify-center gap-2 font-bold text-[13px] hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          <Phone size={16} fill="currentColor" /> Call with Astrologer
        </button>
      </div>

      {/* ═══ FREE CHAT POPUP ═══ */}
      {showFreeChatPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up relative">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-400 to-orange-500" />
            <div className="absolute top-[5%] right-[10%] w-24 h-24 bg-white/10 rounded-full blur-xl" />
            
            <div className="relative pt-12 px-6 flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 border-4 border-white z-10 relative">
                <MessageCircle size={32} className="text-orange-500" fill="currentColor" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse border border-white">
                  FREE
                </div>
              </div>
              
              <h3 className="text-[22px] font-bold text-gray-900 mb-2 leading-tight">
                Congratulations!
              </h3>
              <p className="text-[14px] text-gray-600 font-medium mb-8">
                You have unlocked your <span className="text-orange-500 font-bold">First Free Chat</span> with an Astrologer.
              </p>
              
              <div className="w-full space-y-3 mb-6">
                <button
                  onClick={() => {
                    setShowFreeChatPopup(false);
                    localStorage.setItem('claimedFreeChat', 'true');
                    navigate('/user/astrologers');
                  }}
                  className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl text-[15px] shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  START FREE CHAT
                </button>
                <button
                  onClick={() => {
                    setShowFreeChatPopup(false);
                    localStorage.setItem('claimedFreeChat', 'false');
                  }}
                  className="w-full py-3.5 text-gray-500 font-semibold text-[14px] hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LowBalanceModal 
        isOpen={showBalanceModal} 
        onClose={() => setShowBalanceModal(false)}
        requiredAmount={shortBalanceInfo.required}
        currentBalance={shortBalanceInfo.current}
        targetName={shortBalanceInfo.name}
      />

      {/* ═══ CONNECTING MODAL (ASTROLOGER REQUEST) ═══ */}
      {isConnecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Waiting for <span className="font-semibold text-gray-800">{connectingAstroName}</span> to accept your chat request...
            </p>
            <button 
              onClick={() => {
                setIsConnecting(false);
                if (socket && user && connectingAstroId) {
                  socket.emit('cancel_session_request', { 
                    astrologerId: connectingAstroId, 
                    userId: user._id 
                  });
                }
              }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Grid, Target, MessageCircle, Phone, Lock, BadgeCheck, ShieldCheck, Bell, ChevronRight, Calendar, Clock, Star, Menu, Plus, Wallet, Heart, Users, Mic, FileText } from 'lucide-react';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import { fetchUserHomeDataThunk } from '../../store/slices/dashboardSlice';
import NotificationDropdown from '../../components/NotificationDropdown';
import LowBalanceModal from '../../components/LowBalanceModal';
import getSocket from '../../socket/socketManager';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFreeChatPopup, setShowFreeChatPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const { openSidebar, setHideBottomBanner } = useOutletContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth) || {};
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  const { settings } = useSelector((state) => state.auth) || {};
  const { userHome } = useSelector((state) => state.dashboard);

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, name: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const scrollRef = useRef(null);

  const topBanners = userHome?.banners?.filter(b => !b.pages || b.pages.length === 0 || b.pages.includes('Home')) || [];

  const handleBannerScroll = (e) => {
    if (!e.target.children[0]) return;
    const childWidth = e.target.children[0].offsetWidth;
    const scrollLeft = e.target.scrollLeft;
    const index = Math.round(scrollLeft / (childWidth + 16));
    if (index >= 0 && index < topBanners.length && index !== currentBannerIndex) {
      setCurrentBannerIndex(index);
    }
  };

  useEffect(() => {
    if (topBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => {
        const next = (prev + 1) % topBanners.length;
        if (scrollRef.current && scrollRef.current.children[next]) {
          const child = scrollRef.current.children[next];
          scrollRef.current.scrollTo({ left: child.offsetLeft - 20, behavior: 'smooth' });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [topBanners.length]);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    if (s) {
      const refreshHomeData = () => dispatch(fetchUserHomeDataThunk());
      s.on('banners_updated', refreshHomeData);
      s.on('topAstrologersUpdated', refreshHomeData);
      return () => {
        s.off('banners_updated', refreshHomeData);
        s.off('topAstrologersUpdated', refreshHomeData);
      };
    }
  }, [dispatch]);

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
    if (isAuthenticated) {
      dispatch(fetchProfileThunk());
    }
    dispatch(fetchUserHomeDataThunk());
    return () => clearTimeout(t);
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (user) {
      if (user.freeChatUsed) {
        setShowFreeChatPopup(false);
      } else if (!hasShownPopup) {
        setShowFreeChatPopup(true);
        setHasShownPopup(true);
      }
    }
  }, [user, hasShownPopup]);

  const handleChatCallAction = (path) => {
    if (!isAuthenticated) {
      navigate('/user/login', { state: { redirectTo: path } });
    } else if (!user || user?.name === 'Guest User' || user?.isNewUser) {
      navigate('/user/details', { state: { redirectTo: path } });
    } else if (!user?.name || user?.name.trim() === '') {
      navigate('/user/profile', { state: { redirectTo: path } });
    } else {
      navigate(path);
    }
  };

  const handleSessionRequest = (astro, type) => {
    if (!isAuthenticated) {
      return navigate('/user/login', { state: { redirectTo: '/' } });
    }
    if (!user || user?.name === 'Guest User' || user?.isNewUser) {
      return navigate('/user/details', { state: { redirectTo: '/' } });
    }
    
    const minBalance = settings?.minChatBalance || 10;
    const isFreeChatEligible = type === 'chat' && user?.freeChatUsed === false;
    
    if ((user?.wallet || 0) < minBalance && !isFreeChatEligible) {
      setShortBalanceInfo({ required: minBalance, current: user?.wallet || 0, name: astro.name || astro.userId?.name || 'Astrologer' });
      setShowBalanceModal(true);
      return;
    }
    
    if (isFreeChatEligible) {
      navigate(`/user/chat`, { state: { astrologer: astro, startWithBot: true, roomId: `room_${user._id}_bot_${Date.now()}` } });
      return;
    }
    
    navigate('/user/waiting', { state: { astrologer: astro, type } });
  };

  const handleViewChat = (session) => {
    if (session.astrologer) {
      navigate('/user/chat', { state: { astrologer: session.astrologer, viewOnly: true, roomId: session.roomId } });
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
    const astroId = astro.userId?._id || astro.userId || astro._id;
    navigate('/user/astrologers?type=chat', { state: { autoConnectAstro: astroId } });
  };

  return (
    <div className={`w-full min-h-screen font-sans pb-24 relative bg-white transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

      {/* ═══ ORANGE HEADER ═══ */}
      <div className="bg-gradient-to-b from-[#fa6830] to-[#fa6830] rounded-b-[24px] pt-3 pb-4 px-5 sticky top-0 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="relative cursor-pointer" onClick={openSidebar}>
              <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center border-[1.5px] border-white text-white font-bold text-lg shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#fa6830] rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-[16px] tracking-wide leading-tight drop-shadow-sm">Hi, {user?.name ? user.name.split(' ')[0] : 'User'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/user/recharge')}
              className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-white/20 border border-white/20 transition-transform active:scale-95 shadow-sm backdrop-blur-sm"
            >
              <div className="w-[16px] h-[13px] bg-pink-500 rounded-sm relative shadow-sm">
                 <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-2 h-1.5 border-t border-l border-r border-[#fcd34d] rounded-t-[3px]"></div>
                 <div className="absolute top-1/2 right-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-[#fcd34d] rounded-full"></div>
              </div>
              <span className="text-white text-[13px] font-bold">₹{Math.floor(user?.wallet || 0)}</span>
              <div className="w-5 h-5 rounded-full bg-[#fcd34d] flex items-center justify-center shadow-sm">
                <Plus size={14} className="text-[#fa6830] font-bold" strokeWidth={3} />
              </div>
            </button>
            
            <div className="relative w-[36px] h-[36px] flex items-center justify-center rounded-full bg-white/20 border border-white/20 cursor-pointer shadow-sm backdrop-blur-sm">
              <NotificationDropdown iconSize={18} iconClassName="text-white w-full h-full flex items-center justify-center" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div 
          className="w-full bg-white rounded-full py-2.5 px-4 flex items-center justify-between cursor-pointer shadow-sm"
          onClick={() => navigate('/user/search')}
        >
          <span className="text-gray-400 text-[13px] font-medium">Searchhh astrologers, products...</span>
          <Search size={18} className="text-[#fa6830]" />
        </div>
      </div>

      {/* ═══ QUICK SERVICES ═══ */}
      <div className="flex justify-between px-3.5 sm:px-5 mb-6 mt-6 w-full relative z-10 max-w-full overflow-hidden">
        {[
          { name: 'Daily\nHoroscope', icon: <Sun size={24} strokeWidth={2.5} className="text-white" />, path: '/user/horoscope' },
          { name: 'Free\nKundli', icon: <Grid size={24} strokeWidth={2.5} className="text-white" />, path: '/user/kundli' },
          { name: 'Kundli\nMatching', icon: <Target size={24} strokeWidth={2.5} className="text-white" />, path: '/user/matchmaking' },
          { name: 'Panchang', icon: <Calendar size={24} strokeWidth={2.5} className="text-white" />, path: '/user/panchang' },
          { name: 'Shubh\nMuhurat', icon: <Clock size={24} strokeWidth={2.5} className="text-white" />, path: '/user/muhurat' },
        ].map((service, idx) => (
          <div key={idx} onClick={() => service.path && navigate(service.path)} className="flex flex-col items-center text-center cursor-pointer gap-2 group w-[60px] sm:w-[68px] shrink-0">
            <div className="w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] bg-[#fa6830] rounded-[18px] sm:rounded-[22px] flex items-center justify-center shadow-[0_8px_15px_rgba(255,140,0,0.3)] group-hover:scale-105 transition-transform active:scale-95 border border-orange-100/20">
              {service.icon}
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-700 font-bold whitespace-pre-line leading-[1.2]">{service.name}</span>
          </div>
        ))}
      </div>

      {/* ═══ DYNAMIC BANNERS CAROUSEL (TOP) ═══ */}
      {topBanners.length > 0 && (
        <div className="mb-4 relative z-10 w-full overflow-hidden">
          <div 
            ref={scrollRef}
            onScroll={handleBannerScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 pb-2"
          >
            {topBanners.map((banner, idx) => (
              <div 
                key={banner._id || idx} 
                className="w-[calc(100vw-40px)] sm:w-[400px] h-[160px] shrink-0 snap-center rounded-[20px] overflow-hidden shadow-sm relative cursor-pointer bg-gray-50"
                onClick={() => {
                  if (banner.linkUrl) {
                    if (banner.linkUrl.startsWith('http')) {
                      window.open(banner.linkUrl, '_blank');
                    } else {
                      navigate(banner.linkUrl);
                    }
                  }
                }}
              >
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ GOT ANY QUESTIONS BANNER ═══ */}
      <div className="px-5 mb-6 relative z-10">
        <div 
          onClick={() => handleChatCallAction('/user/astrologers')}
          className="rounded-[20px] py-3.5 px-4 relative overflow-hidden shadow-md flex items-center justify-between cursor-pointer group bg-gradient-to-r from-[#802c1f] to-[#cf4b16]"
        >
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-[44px] h-[44px] rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
              <MessageCircle size={22} className="text-white" fill="none" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-white font-bold text-[16px] mb-0.5 leading-tight tracking-wide">Got any questions?</h3>
              <p className="text-white/90 text-[12px] font-medium">Chat with Astrologer @ ₹5/min</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/90 relative z-10" />
        </div>
      </div>

      {/* ═══ MY SESSIONS / EXCLUSIVE OFFER (Moved up here) ═══ */}
      {(userHome?.activeSession || (user && user.freeChatUsed === false)) && (
        <div className="px-5 mb-5 relative z-10 bg-white">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">
            {userHome?.activeSession ? "My Sessions" : "Exclusive Offer"}
          </h2>

          {userHome?.activeSession ? (
            <div className="bg-white rounded-[16px] p-4 border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img src={userHome.activeSession.avatar} alt={userHome.activeSession.name} className="w-[48px] h-[48px] rounded-full object-cover bg-gray-100" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-0.5">{userHome.activeSession.name}</h3>
                    <p className="text-[11px] text-gray-500 font-semibold uppercase">{userHome.activeSession.date}</p>
                  </div>
                </div>
                <span 
                  onClick={() => navigate('/user/history')} 
                  className="text-[13px] text-[#fa6830] font-bold cursor-pointer hover:text-orange-600 transition-colors"
                >
                  View All
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleViewChat(userHome.activeSession)} 
                  className="flex-1 py-2 rounded-full border border-[#fa6830] text-[#fa6830] text-[13px] font-bold hover:bg-orange-50 transition-colors"
                >
                  View Chat
                </button>
                <button 
                  onClick={() => handleChatAgain(userHome.activeSession)} 
                  className="flex-1 py-2 rounded-full bg-[#fa6830] text-white text-[13px] font-bold hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Chat Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] bg-[#fa6830] rounded-full flex items-center justify-center relative shadow-md">
                  <span className="text-2xl">🎁</span>
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase scale-90 border border-white animate-pulse">
                    Free
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-1.5 leading-snug">
                    First Chat FREE! <span className="text-[#fa6830]">✨</span>
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                    Consult our top astrologers at zero cost.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChatCallAction('/user/free-chat-offer')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#fa6830] hover:bg-orange-600 text-white font-bold rounded-full text-[13px] shadow-md transition-colors whitespace-nowrap"
              >
                START FREE CHAT
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ OUR SERVICES GRID ═══ */}
      <div className="px-5 mb-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[18px] font-bold text-gray-900">Our Services</h2>
          <span 
            onClick={() => navigate('/user/astrologers')}
            className="text-[13px] text-[#fa6830] font-bold cursor-pointer hover:text-orange-600 transition-colors"
          >
            View All
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'Chat', icon: <MessageCircle size={20} className="text-[#fa6830]" strokeWidth={2} />, path: '/user/astrologers?type=chat', bg: 'bg-orange-50' },
            { name: 'Call', icon: <Phone size={20} className="text-green-500" strokeWidth={2} />, path: '/user/astrologers?type=call', bg: 'bg-green-50' },
            { name: 'Video Call', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, path: '/user/video-call', bg: 'bg-purple-50' },
            { name: 'Pooja', icon: <Star size={20} className="text-[#fa6830]" strokeWidth={2} />, action: () => navigate('/user/store', { state: { tab: 'Pandit Booking' } }), bg: 'bg-orange-50' },
            { name: 'Store', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, path: '/user/store', bg: 'bg-pink-50' },
            { name: 'Kundli', icon: <Grid size={20} className="text-blue-500" strokeWidth={2} />, path: '/user/kundli', bg: 'bg-blue-50' },
            { name: 'Reports', icon: <FileText size={20} className="text-teal-500" strokeWidth={2} />, path: '/user/history', bg: 'bg-teal-50' },
            { name: 'Panchang', icon: <Calendar size={20} className="text-red-500" strokeWidth={2} />, path: '/user/panchang', bg: 'bg-red-50' },
          ].map((service, idx) => (
            <div key={idx} onClick={() => service.action ? service.action() : (service.path && navigate(service.path))} className="bg-white rounded-[20px] p-2 py-4 border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col items-center gap-2.5 cursor-pointer active:scale-95 transition-all hover:shadow-md hover:border-gray-200">
              <div className={`w-[48px] h-[48px] rounded-full ${service.bg} flex items-center justify-center`}>
                {service.icon}
              </div>
              <span className="text-[12px] text-gray-800 font-semibold whitespace-nowrap">{service.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TOP ASTROLOGERS ═══ */}
      {userHome?.featuredAstrologers?.length > 0 && (
        <div className="px-5 mb-6 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-bold text-gray-900">Top Astrologers</h2>
            <span 
              onClick={() => navigate('/user/astrologers')} 
              className="text-[13px] text-[#fa6830] font-bold cursor-pointer hover:text-orange-600 transition-colors"
            >
              View All
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
            {userHome.featuredAstrologers.map((astro, i) => {
              const isOffline = astro.onlineStatus === 'offline';
              const isBusy = astro.onlineStatus === 'busy';
              
              return (
              <div 
                key={i} 
                onClick={() => navigate('/user/astrologers')}
                className={`shrink-0 w-[240px] bg-white rounded-[20px] border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 cursor-pointer flex flex-col gap-3 group hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 relative ${isOffline ? 'grayscale opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-[56px] h-[56px] shrink-0">
                    <img 
                      src={astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`} 
                      alt={astro.name} 
                      className="w-full h-full object-cover rounded-xl border border-gray-100 shadow-sm"
                    />
                    {isOffline ? (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white z-10"></div>
                    ) : isBusy ? (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white z-10"></div>
                    ) : (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white z-10"></div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <h3 className="font-bold text-[16px] text-gray-900 mb-0.5 truncate capitalize">{astro.name}</h3>
                    <p className="text-[12px] text-gray-500 mb-1 truncate">{astro.skills?.slice(0,2)?.join(', ') || 'Vedic Astrology'}</p>
                    <div className="flex items-center text-[12px] text-gray-900 font-semibold">
                      <Star size={12} fill="#eab308" className="text-yellow-500 mr-1" />
                      <span>{astro.rating || 4.5}</span> <span className="text-gray-400 font-medium ml-1">(1K)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 w-full pt-1">
                  <span className="text-[#fa6830] font-bold text-[14px]">₹{astro.rate || 5}/min</span>
                  {isOffline ? (
                    <button disabled className="px-5 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[12px] font-bold cursor-not-allowed">
                      Offline
                    </button>
                  ) : isBusy ? (
                    <button disabled className="px-5 py-1.5 rounded-full bg-red-50 text-red-400 text-[12px] font-bold cursor-not-allowed">
                      Busy
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSessionRequest(astro, 'chat'); }}
                      className="px-5 py-1.5 rounded-full border border-[#fa6830] text-[#fa6830] text-[13px] font-bold hover:bg-orange-50 transition-colors text-center"
                    >
                      Chat Now
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}



      {/* ═══ JYOTISHLINK STORE ═══ */}
      <div className="px-5 mb-5 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[18px] font-bold text-gray-900">{appName} Store</h2>
          <span
            onClick={() => navigate('/user/store')}
            className="text-[13px] text-[#fa6830] font-bold cursor-pointer flex items-center gap-1 hover:text-orange-600"
          >
            Visit Store <span className="text-lg leading-none">&rarr;</span>
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(userHome?.services?.length > 0 ? userHome.services : [
            {name: 'Bracelets', img: '/store_bracelet.png'}, 
            {name: 'Rudraksha', img: '/store_rudraksha.png'},
            {name: 'Crystals', img: '/store_crystal.png'}
          ]).map((item, i) => (
            <div 
              key={i} 
              className="flex flex-col gap-2 shrink-0 w-[90px] cursor-pointer group items-center"
              onClick={() => navigate('/user/store', { state: { category: item.name } })}
            >
              <div className="w-[90px] h-[90px] rounded-[18px] flex items-center justify-center overflow-hidden">
                <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="px-1 text-center">
                <span className="block text-[11px] text-gray-700 font-semibold">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ UNLOCK COSMIC BANNER ═══ */}
      <div className="px-5 mb-3">
        <div 
          className="rounded-[24px] p-6 relative overflow-hidden shadow-[0_8px_20px_rgba(255,140,0,0.2)] flex flex-col justify-center items-start bg-gradient-to-r from-[#fa6830] to-[#f97316]"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <h3 className="text-white font-bold text-[20px] mb-1.5 tracking-tight">Unlock Your Cosmic Destiny</h3>
            <p className="text-orange-50 text-[13px] mb-5 font-medium">Chat with verified astrologers at ₹5/min</p>
            <button 
              onClick={() => handleChatCallAction('/user/astrologers')} 
              className="bg-white text-[#fa6830] font-bold text-[14px] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              Chat Now
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TRUST BADGES ═══ */}
      <div className="px-5 py-4 bg-orange-50/50 mb-6">
        <div className="flex justify-between items-start px-2">
          {[
            { name: 'Private &\nConfidential', icon: <Lock size={18} className="text-[#fa6830]" /> },
            { name: 'Verified\nAstrologers', icon: <BadgeCheck size={18} className="text-[#fa6830]" /> },
            { name: 'Secure\nPayments', icon: <ShieldCheck size={18} className="text-[#fa6830]" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-2 w-1/3">
              <div className="flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[10px] text-gray-600 font-semibold whitespace-pre-line leading-tight">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ LIVE ASTROLOGERS ═══ */}
      {userHome?.liveAstrologers?.length > 0 && (
        <div className="px-5 pt-3 pb-3 relative z-10 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[19px] font-bold text-gray-900">Live Astrologers</h2>
            <span className="text-[14px] text-[#fa6830] font-bold cursor-pointer hover:text-orange-600 transition-colors">View All</span>
          </div>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {userHome.liveAstrologers.map((astro, i) => (
              <div 
                key={i} 
                className="shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => navigate(`/user/search?q=${encodeURIComponent(astro.name)}`)}
              >
                <div className="relative">
                  <div className="w-[72px] h-[72px] rounded-full p-[2px] border-2 border-[#fa6830]">
                    <img src={astro.img} alt={astro.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                </div>
                <span className="text-[12px] text-gray-800 font-bold text-center leading-tight mt-1">{astro.name}</span>
              </div>
            ))}
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

    </div>
  );
};

export default Home;

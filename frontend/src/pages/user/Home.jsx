import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Grid, Target, MessageCircle, Phone, Lock, BadgeCheck, ShieldCheck, Bell, ChevronRight, Calendar, Clock, Star, Menu, Plus, Wallet } from 'lucide-react';
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
  
  const { user, isAuthenticated, settings } = useSelector((state) => state.auth) || {};
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
      <div className="bg-gradient-to-b from-[#ff8c00] to-[#f97316] rounded-b-[30px] pt-3 pb-4 px-5 relative z-20 shadow-md">
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={openSidebar}>
              <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-[#ff8c00] font-bold text-lg bg-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#ff8c00] rounded-full"></div>
            </div>
            <span className="text-white font-bold text-[16px] tracking-wide drop-shadow-sm">Hi, {user?.name ? user.name.split(' ')[0] : 'Naitik'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => navigate('/user/recharge')}
              className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full bg-white/20 border border-white/30 transition-transform active:scale-95 shadow-sm"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {/* Pink Wallet Icon */}
                <div className="w-4 h-3.5 bg-pink-500 rounded-sm relative shadow-sm">
                   <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1.5 border-t border-l border-r border-yellow-300 rounded-t-sm"></div>
                   <div className="absolute top-1/2 right-0.5 -translate-y-1/2 w-1 h-1 bg-yellow-300 rounded-full"></div>
                </div>
              </div>
              <span className="text-white text-[13px] font-bold">₹{Math.floor(user?.wallet || 0)}</span>
              <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                <Plus size={12} className="text-[#ff8c00] font-bold" strokeWidth={3} />
              </div>
            </button>
            
            <div className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 border border-white/30 cursor-pointer shadow-sm">
              <NotificationDropdown iconSize={18} iconClassName="text-white w-full h-full flex items-center justify-center" />
            </div>
          </div>
        </div>

        {/* Search Bar (Inside Header) */}
        <div 
          className="w-full bg-white rounded-full py-3.5 px-5 flex items-center justify-between shadow-sm cursor-pointer"
          onClick={() => navigate('/user/search')}
        >
          <span className="text-gray-400 text-[13px] font-medium">Search astrologers, products...</span>
          <Search size={18} className="text-[#ff8c00]" />
        </div>
      </div>

      {/* ═══ QUICK SERVICES ═══ */}
      <div className="flex justify-between px-5 mb-8 mt-6 w-full relative z-10">
        {[
          { name: 'Daily\nHoroscope', icon: <Sun size={24} strokeWidth={2.5} className="text-white" />, path: '/user/horoscope' },
          { name: 'Free\nKundli', icon: <Grid size={24} strokeWidth={2.5} className="text-white" />, path: '/user/kundli' },
          { name: 'Kundli\nMatching', icon: <Target size={24} strokeWidth={2.5} className="text-white" />, path: '/user/matchmaking' },
          { name: 'Panchang', icon: <Calendar size={24} strokeWidth={2.5} className="text-white" />, path: '/user/panchang' },
          { name: 'Shubh\nMuhurat', icon: <Clock size={24} strokeWidth={2.5} className="text-white" />, path: '/user/muhurat' },
        ].map((service, idx) => (
          <div key={idx} onClick={() => service.path && navigate(service.path)} className="flex flex-col items-center text-center cursor-pointer gap-2 flex-1 group">
            <div className="w-[56px] h-[56px] bg-[#ff8c00] rounded-[20px] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform active:scale-95">
              {service.icon}
            </div>
            <span className="text-[11px] text-gray-700 font-bold whitespace-pre-line leading-[1.2]">{service.name}</span>
          </div>
        ))}
      </div>

      {/* ═══ DYNAMIC BANNERS CAROUSEL (TOP) ═══ */}
      {topBanners.length > 0 && (
        <div className="mb-6 relative z-10">
          <div 
            ref={scrollRef}
            onScroll={handleBannerScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 pb-2"
          >
            {topBanners.map((banner, idx) => (
              <div 
                key={banner._id || idx} 
                className="w-[92vw] sm:w-[400px] h-[175px] shrink-0 snap-center rounded-[24px] overflow-hidden shadow-md relative cursor-pointer bg-gray-50"
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
          
          {/* Pagination Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {topBanners.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-[4px] rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'w-4 bg-[#ff8c00]' : 'w-1.5 bg-[#ff8c00]/30'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ OUR SERVICES GRID ═══ */}
      <div className="px-5 mb-8 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[18px] font-bold text-gray-900">Our Services</h2>
          <span 
            onClick={() => navigate('/user/astrologers')}
            className="text-[13px] text-[#ff8c00] font-bold cursor-pointer hover:text-orange-600 transition-colors"
          >
            View All
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-5 px-5">
          {[
            { name: 'Chat', subtitle: '', icon: <MessageCircle size={20} className="text-[#ff8c00]" />, path: '/user/astrologers?type=chat' },
            { name: 'Call', subtitle: '', icon: <Phone size={20} className="text-[#ff8c00]" />, path: '/user/astrologers?type=call' },
            { name: 'Video Call', subtitle: '', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff8c00]"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>, path: '/user/video-call' },
            { name: 'Pooja', subtitle: 'Book Pooja', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff8c00]"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>, path: '/user/store', state: { category: 'Pooja' } },
            { name: 'Store', subtitle: 'Astro Products', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff8c00]"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, path: '/user/store' },
          ].map((service, idx) => (
            <div key={idx} onClick={() => navigate(service.path, { state: service.state })} className="shrink-0 flex flex-col items-center cursor-pointer group w-[90px]">
              <div className="w-[85px] h-[105px] bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm border border-gray-100 group-hover:shadow-md transition-all relative overflow-hidden">
                 <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {service.icon}
                 </div>
                 <span className="text-[12px] text-gray-900 font-bold mb-0.5 whitespace-nowrap">{service.name}</span>
                 {service.subtitle && <span className="text-[10px] text-gray-400 font-medium text-center px-1 leading-tight whitespace-nowrap">{service.subtitle}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MY SESSIONS / EXCLUSIVE OFFER (Moved up here) ═══ */}
      {(userHome?.activeSession || (user && user.freeChatUsed === false)) && (
        <div className="px-5 mb-8 relative z-10 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[19px] font-bold text-gray-900">
              {userHome?.activeSession ? "My Sessions" : "Exclusive Offer"}
            </h2>
            {userHome?.activeSession && (
              <span 
                onClick={() => navigate('/user/history')} 
                className="text-[14px] text-[#ff8c00] font-bold cursor-pointer hover:text-orange-600 transition-colors"
              >
                View All
              </span>
            )}
          </div>

          {userHome?.activeSession ? (
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <img src={userHome.activeSession.avatar} alt={userHome.activeSession.name} className="w-[60px] h-[60px] rounded-full object-cover border-[1.5px] border-orange-200" />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[17px] leading-tight">{userHome.activeSession.name}</h3>
                  <p className="text-[12px] text-gray-400 font-semibold mt-1 tracking-wide uppercase">{userHome.activeSession.date}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleViewChat(userHome.activeSession)} 
                  className="flex-1 bg-white border border-[#ff8c00] text-[#ff8c00] hover:bg-orange-50 font-bold py-2.5 rounded-full text-[14px] shadow-sm transition-colors"
                >
                  View Chat
                </button>
                <button 
                  onClick={() => handleChatAgain(userHome.activeSession)} 
                  className="flex-1 bg-[#ff8c00] hover:bg-orange-600 text-white font-bold py-2.5 rounded-full text-[14px] shadow-sm transition-colors"
                >
                  Chat Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] bg-[#ff8c00] rounded-full flex items-center justify-center relative shadow-md">
                  <span className="text-2xl">🎁</span>
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase scale-90 border border-white animate-pulse">
                    Free
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-1.5 leading-snug">
                    First Chat FREE! <span className="text-[#ff8c00]">✨</span>
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">
                    Consult our top astrologers at zero cost.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChatCallAction('/user/free-chat-offer')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ff8c00] hover:bg-orange-600 text-white font-bold rounded-full text-[13px] shadow-md transition-colors whitespace-nowrap"
              >
                START FREE CHAT
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ TOP VERIFIED ASTROLOGERS ═══ */}
      {userHome?.featuredAstrologers?.length > 0 && (
        <div className="px-5 mb-8 relative z-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[19px] font-bold text-gray-900 flex items-center gap-1">
              Top Verified Astrologers <ChevronRight size={18} className="text-gray-900" strokeWidth={3} />
            </h2>
            <span 
              onClick={() => navigate('/user/astrologers')} 
              className="text-[14px] text-[#ff8c00] font-bold cursor-pointer hover:text-orange-600 transition-colors"
            >
              View All
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1 -mx-5 px-5">
            {userHome.featuredAstrologers.map((astro, i) => {
              const isOffline = astro.onlineStatus === 'offline';
              const isBusy = astro.onlineStatus === 'busy';
              
              return (
              <div 
                key={i} 
                onClick={() => navigate('/user/astrologers')}
                className={`shrink-0 w-[290px] bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.06)] border border-gray-100 p-3 cursor-pointer group hover:-translate-y-1 transition-transform relative flex gap-3 ${isOffline ? 'grayscale opacity-60' : ''}`}
              >
                {/* Left Image */}
                <div className="relative w-[90px] h-[95px] rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                  <img 
                    src={astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`} 
                    alt={astro.name} 
                    className="w-full h-full object-cover"
                  />
                  {isOffline ? (
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-gray-400 rounded-full border border-white"></div>
                  ) : isBusy ? (
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></div>
                  ) : (
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                  )}
                </div>
                
                {/* Right Content */}
                <div className="flex flex-col flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-[16px] text-gray-900 mb-0.5 truncate capitalize">{astro.name}</h3>
                  <div className="flex items-center text-[12px] text-gray-500 font-medium mb-3">
                    <Star size={12} fill="#eab308" className="text-yellow-500 mr-1" />
                    <span className="text-gray-900 font-bold mr-1">{astro.rating || 4.9}</span> 
                    <span className="mx-1 text-gray-300">|</span> 
                    <span className="truncate ml-1">{astro.skills?.slice(0,2)?.join(', ') || 'Vedic Astrology'}</span>
                  </div>
                  
                  {/* Buttons */}
                  <div className="mt-auto flex gap-2 w-full">
                    {isOffline ? (
                      <button disabled className="flex-1 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 text-[13px] font-bold cursor-not-allowed">
                        Offline
                      </button>
                    ) : isBusy ? (
                      <button disabled className="flex-1 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-400 text-[13px] font-bold cursor-not-allowed">
                        Busy
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSessionRequest(astro, 'chat'); }}
                          className="flex-1 py-1.5 rounded-xl bg-orange-50/30 border border-orange-200 text-[#ff8c00] text-[13px] font-bold hover:bg-orange-50 transition-colors"
                        >
                          Chat
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSessionRequest(astro, 'call'); }}
                          className="flex-1 py-1.5 rounded-xl bg-orange-50/30 border border-orange-200 text-[#ff8c00] text-[13px] font-bold hover:bg-orange-50 transition-colors"
                        >
                          Call
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}



      {/* ═══ JYOTISHLINK SERVICES ═══ */}
      <div className="px-5 mb-8 relative z-10">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[19px] font-bold text-[#1f2937]">JyotishLink Services</h2>
          <span
            onClick={() => navigate('/user/store')}
            className="text-[14px] text-[#ff8c00] font-bold cursor-pointer flex items-center gap-1"
          >
            Visit Store <span className="text-lg leading-none">&rarr;</span>
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(userHome?.services?.length > 0 ? userHome.services : [{name: 'Bracelets', img: '/store_bracelet.png'}, {name: 'Rudraksha', img: '/store_rudraksha.png'}]).map((item, i) => (
            <div 
              key={i} 
              className="flex flex-col gap-1.5 shrink-0 w-[90px] cursor-pointer group items-center"
              onClick={() => navigate('/user/store', { state: { category: item.name } })}
            >
              <div className="w-[90px] h-[90px] bg-white rounded-[20px] flex items-center justify-center shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow overflow-hidden p-2">
                <img src={item.img} alt={item.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </div>
              <div className="mt-1 px-1 text-center">
                <span className="block text-[12px] text-gray-800 font-bold">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ UNLOCK COSMIC BANNER ═══ */}
      <div className="px-5 mb-8">
        <div 
          className="rounded-[24px] p-6 relative overflow-hidden shadow-[0_8px_20px_rgba(255,140,0,0.2)] flex flex-col justify-center items-start bg-gradient-to-r from-[#ff8c00] to-[#f97316]"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 w-full">
            <h3 className="text-white font-bold text-[20px] mb-1.5 tracking-tight">Unlock Your Cosmic Destiny</h3>
            <p className="text-orange-50 text-[13px] mb-5 font-medium">Chat with verified astrologers at ₹5/min</p>
            <button 
              onClick={() => handleChatCallAction('/user/astrologers')} 
              className="bg-white text-[#ff8c00] font-bold text-[14px] px-6 py-2.5 rounded-full shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              Chat Now
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TRUST BADGES ═══ */}
      <div className="px-5 py-8 bg-[#fffdf5] border-y border-[#ffeac2]">
        <p className="text-center text-[12px] text-[#8c7462] font-semibold mb-6">With verified astrologers your details are Private & Confidential!</p>
        <div className="flex justify-between items-start px-4">
          {[
            { name: 'Private &\nConfidential', icon: <Lock size={20} className="text-[#ff8c00]" /> },
            { name: 'Verified\nAstrologers', icon: <BadgeCheck size={20} className="text-[#ff8c00]" /> },
            { name: 'Secure\nPayments', icon: <ShieldCheck size={20} className="text-[#ff8c00]" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-2">
              <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-white shadow-sm border border-[#ffe0c2]">
                {item.icon}
              </div>
              <span className="text-[11px] text-gray-700 font-bold whitespace-pre-line leading-tight">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ LIVE ASTROLOGERS ═══ */}
      {userHome?.liveAstrologers?.length > 0 && (
        <div className="px-5 pt-8 pb-6 relative z-10 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[19px] font-bold text-gray-900">Live Astrologers</h2>
            <span className="text-[14px] text-[#ff8c00] font-bold cursor-pointer hover:text-orange-600 transition-colors">View All</span>
          </div>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {userHome.liveAstrologers.map((astro, i) => (
              <div 
                key={i} 
                className="shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => navigate(`/user/search?q=${encodeURIComponent(astro.name)}`)}
              >
                <div className="relative">
                  <div className="w-[72px] h-[72px] rounded-full p-[2px] border-2 border-[#ff8c00]">
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

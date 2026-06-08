import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Grid, Target, MessageCircle, Phone, Lock, BadgeCheck, ShieldCheck, Bell, ChevronRight, Calendar, Clock, Star } from 'lucide-react';
import { fetchProfileThunk } from '../../store/slices/authSlice';
import { fetchUserHomeDataThunk } from '../../store/slices/dashboardSlice';
import NotificationDropdown from '../../components/NotificationDropdown';
import LowBalanceModal from '../../components/LowBalanceModal';
import getSocket from '../../socket/socketManager';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFreeChatPopup, setShowFreeChatPopup] = useState(false);
  const { openSidebar, setHideBottomBanner } = useOutletContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { userHome } = useSelector((state) => state.dashboard);

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, name: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!userHome?.banners || userHome.banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % userHome.banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [userHome?.banners]);

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
    if (user && user.freeChatUsed === false) {
      setShowFreeChatPopup(true);
    }
  }, [user]);

  const handleChatCallAction = (path) => {
    if (!user || user?.name === 'Guest User') {
      navigate('/user/login', { state: { redirectTo: path } });
    } else if (!user?.name || user?.name.trim() === '') {
      navigate('/user/profile', { state: { redirectTo: path } });
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isLoaded, userHome]);

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
    <div className={`w-full min-h-screen font-sans pb-24 relative transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
         style={{ backgroundColor: '#fffaf5', backgroundImage: 'radial-gradient(#f4dcb9 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}>

      {/* ═══ PREMIUM HEADER (NAV + SEARCH) ═══ */}
      <div className="bg-gradient-to-r from-[#ff9b26] to-[#f47025] rounded-b-[32px] pt-3 pb-8 px-4 shadow-[0_10px_30px_rgba(249,115,22,0.2)] mb-2 relative">
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-5 relative z-20">
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={openSidebar}
          >
            <div className="relative">
              <div className="w-[46px] h-[46px] bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xl">{(user?.name || 'G')[0]}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-orange-500"></div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-white font-bold text-[17px] drop-shadow-sm">Hi, {user?.name || 'Guest'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/user/recharge')}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-white/30 rounded-full text-[13px] font-bold text-white bg-white/10 backdrop-blur-md shadow-inner hover:bg-white/20 transition-all active:scale-95"
            >
              <span className="text-lg leading-none drop-shadow-sm">👛</span> 
              <span className="tracking-wide">₹{Math.floor(user?.wallet || 0)}</span>
              <span className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-orange-800 rounded-full w-[18px] h-[18px] flex items-center justify-center text-[14px] font-black shadow-sm ml-0.5">+</span>
            </button>
            <div className="relative w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer">
              <NotificationDropdown iconSize={18} iconClassName="text-white drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div 
          className="relative cursor-pointer group mt-2" 
          onClick={() => navigate('/user/search')}
        >
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl py-3.5 px-5 pr-12 text-[14px] text-gray-500 font-medium shadow-[0_8px_20px_rgba(0,0,0,0.08)] border border-white/50 group-hover:shadow-[0_8px_25px_rgba(249,115,22,0.2)] transition-shadow">
            Search astrologers, products...
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-100 group-hover:scale-105 transition-all">
            <Search size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* ═══ QUICK SERVICES ═══ */}
      <div className="flex justify-between px-3 pt-2 pb-6 w-full relative z-10 mt-1">
        {[
          { name: 'Daily\nHoroscope', icon: <Sun size={28} strokeWidth={2} className="text-white" />, path: '/user/horoscope' },
          { name: 'Free\nKundli', icon: <Grid size={28} strokeWidth={2} className="text-white" />, path: '/user/kundli' },
          { name: 'Kundli\nMatching', icon: <Target size={28} strokeWidth={2} className="text-white" />, path: '/user/matchmaking' },
          { name: 'Panchang', icon: <Calendar size={28} strokeWidth={2} className="text-white" />, path: '/user/panchang' },
          { name: 'Shubh\nMuhurat', icon: <Clock size={28} strokeWidth={2} className="text-white" />, path: '/user/muhurat' },
        ].map((service, idx) => (
          <div key={idx} onClick={() => service.path && navigate(service.path)} className="flex flex-col items-center text-center cursor-pointer flex-1 gap-2">
            <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] bg-[#FF8C38] rounded-[20px] flex items-center justify-center shadow-[0_4px_10px_rgba(255,140,56,0.3)] hover:opacity-90 transition-opacity">
              {service.icon}
            </div>
            <span className="text-[11px] sm:text-[12px] text-[#4b5563] font-semibold whitespace-pre-line leading-[1.2]">{service.name}</span>
          </div>
        ))}
      </div>

      {/* ═══ DYNAMIC BANNERS CAROUSEL ═══ */}
      {userHome?.banners && userHome.banners.length > 0 && (
        <div className="px-4 pb-4">
          <div className="relative w-full h-[88px] rounded-2xl overflow-hidden shadow-card group">
            <div 
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {userHome.banners.map((banner, idx) => (
                <div 
                  key={banner._id || idx} 
                  className="w-full h-full shrink-0 relative cursor-pointer"
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
                  {/* Subtle overlay to ensure title visibility if image is bright, maybe not needed if images are self-contained banners, but good for design */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex flex-col justify-end p-4">
                     {banner.title && <h3 className="text-white font-bold text-lg drop-shadow-md">{banner.title}</h3>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {userHome.banners.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {userHome.banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentBannerIndex ? 'w-4 bg-orange-500' : 'w-1.5 bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CHAT BANNER ═══ */}
      <div className="px-4 pb-4 mt-2">
        <div
          className="w-full rounded-[20px] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.15)] cursor-pointer relative bg-gradient-to-r from-[#4a152e] via-[#852b31] to-[#d65f1a] p-5 flex items-center gap-4"
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
      {(userHome?.activeSession || (user && user.freeChatUsed === false)) && (
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
        <div className="px-4 py-5 mt-1 bg-transparent relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-1">
              Top Verified Astrologers <ChevronRight size={20} className="text-gray-900" />
            </h2>
            <span 
              onClick={() => navigate('/user/astrologers')} 
              className="text-[13px] text-[#b36b39] font-bold cursor-pointer"
            >
              View All
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
            {userHome.featuredAstrologers.map((astro, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/user/astrologers')}
                className="shrink-0 w-[290px] bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden relative flex p-3 pr-4 cursor-pointer hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)] transition-shadow"
              >
                {/* Top Rated Badge */}
                <div className="absolute top-0 right-3 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-white text-[10px] font-bold px-2 py-0.5 rounded-b-[4px] shadow-sm flex items-center gap-1 z-10">
                  <Star size={10} fill="currentColor" /> Top Rated
                  {/* Ribbon tails (CSS trick) */}
                  <div className="absolute -left-1 top-0 border-t-4 border-t-transparent border-r-4 border-r-[#8a650d]"></div>
                  <div className="absolute -right-1 top-0 border-t-4 border-t-transparent border-l-4 border-l-[#8a650d]"></div>
                </div>

                {/* Left Image */}
                <div className="relative w-[95px] h-[115px] rounded-xl overflow-hidden shrink-0 mr-3 shadow-inner">
                  <img 
                    src={astro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astro.name)}&background=ffedD5&color=f97316`} 
                    alt={astro.name} 
                    className="w-full h-full object-cover"
                  />
                  {/* Celebrity Sash */}
                  <div className="absolute top-3 -left-7 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-black text-[9px] font-bold py-0.5 px-8 -rotate-45 shadow-md">
                    #Celebrity
                  </div>
                </div>
                
                {/* Right Content */}
                <div className="flex flex-col flex-1 pt-2">
                  <h3 className="font-bold text-[16px] text-gray-900 leading-tight mb-1">{astro.name}</h3>
                  <div className="flex items-center text-[12px] text-gray-600 font-medium mb-3 truncate w-full">
                    <Star size={12} fill="#eab308" className="text-yellow-500 mr-1 shrink-0" />
                    <span className="text-gray-800 font-bold mr-1">{astro.rating || 4.9}</span> <span className="mx-1 text-gray-300">|</span> <span className="truncate">{astro.skills?.slice(0,2)?.join(', ') || 'Vedic, Palmistry'}</span>
                  </div>
                  
                  {/* Buttons */}
                  <div className="mt-auto flex gap-2">
                    <button className="flex-1 py-1.5 rounded-full border border-orange-200 text-[#c87635] text-[13px] font-bold hover:bg-orange-50 transition-colors shadow-sm">
                      Chat
                    </button>
                    <button className="flex-1 py-1.5 rounded-full border border-orange-200 text-[#c87635] text-[13px] font-bold hover:bg-orange-50 transition-colors shadow-sm">
                      Call
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ JYOTISHLINK STORE ═══ */}
      <div className="px-4 py-5 mt-1 relative z-10">
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
            <div 
              key={i} 
              className="flex flex-col items-center gap-2 shrink-0 w-[90px] cursor-pointer group"
              onClick={() => navigate('/user/store', { state: { category: item.name } })}
            >
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
        <div className="px-4 py-5 mt-1 scroll-animate opacity-0 translate-y-4 transition-all duration-700 relative z-10">
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
      <div className="px-4 py-4 scroll-animate opacity-0 translate-y-4 transition-all duration-700">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <h3 className="text-white font-bold text-[18px] mb-1">Unlock Your Cosmic Destiny</h3>
          <p className="text-orange-100 text-[13px] mb-4">Chat with verified astrologers at ₹5/min</p>
          <button onClick={() => handleChatCallAction('/user/astrologers')} className="bg-white text-orange-600 font-bold text-[13px] px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
            Chat Now
          </button>
        </div>
      </div>

      {/* ═══ NEWS & BLOGS ═══ */}
      <div className="px-4 py-5 mt-1 scroll-animate opacity-0 translate-y-4 transition-all duration-700 delay-100 relative z-10">
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
      <div className="px-4 py-6 bg-orange-50 mt-2 scroll-animate opacity-0 translate-y-4 transition-all duration-700 delay-200">
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
      <div className="px-4 py-5 bg-white mt-1 scroll-animate opacity-0 translate-y-4 transition-all duration-700 delay-300">
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



    </div>
  );
};

export default Home;

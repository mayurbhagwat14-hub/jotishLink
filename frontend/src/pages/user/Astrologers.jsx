import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { fetchAstrologersThunk } from '../../store/slices/userSlice';
import LowBalanceModal from '../../components/LowBalanceModal';
import getSocket from '../../socket/socketManager';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const categories = [
  { name: 'All', icon: <BiCategoryAlt />, active: true },
  { name: 'NEW!', icon: <span className="text-[10px]">✨</span> },
  { name: 'Love', icon: <BiHeart /> },
  { name: 'Education', icon: <BiBookHeart /> },
  { name: 'Marriage', icon: <span className="text-sm">💍</span> },
  { name: 'Health', icon: <MdOutlineHealthAndSafety /> },
  { name: 'Wealth', icon: <FaRupeeSign size={10} /> },
  { name: 'Legal', icon: <MdOutlineGavel /> },
];

const Astrologers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  
  const { astrologers } = useSelector((state) => state.user);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, name: '' });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('type') || 'chat';
  const setActiveTab = (tab) => setSearchParams({ type: tab });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const params = {};
    if (activeCategory !== 'All' && activeCategory !== 'NEW!') {
      params.skill = activeCategory;
    }
    dispatch(fetchAstrologersThunk(params));
    
    const token = localStorage.getItem('accessToken');
    const s = getSocket();
    setSocket(s);
    return () => {  };
  }, [dispatch, activeCategory]);

  const { state } = useLocation();
  useEffect(() => {
    if (state?.autoConnectAstro && socket && astrologers.length > 0) {
      const astroId = typeof state.autoConnectAstro === 'object' ? state.autoConnectAstro._id : state.autoConnectAstro;
      const astro = astrologers.find(a => a._id === astroId && a.onlineStatus === 'online');
      
      // Clear the state so it doesn't fire again
      navigate(location.pathname + location.search, { replace: true, state: {} });

      if (astro) {
        setTimeout(() => {
          let emitType = activeTab;
          if (activeTab === 'call') emitType = 'audio';
          if (activeTab === 'video call') emitType = 'video';
          handleSessionRequest(astro, emitType);
        }, 500);
      } else {
        toast.error("Astrologer is currently offline or unavailable.");
      }
    }
  }, [socket, astrologers, state, navigate]);

  const handleSessionRequest = async (astro, type) => {
    // 1. Check auth
    if (!isAuthenticated) return navigate('/user/login');
    
    // 2. Check wallet balance
    const rate = type === 'chat' ? astro.pricing?.chat
               : type === 'audio' ? astro.pricing?.audioCall
               : astro.pricing?.videoCall;
    const minBalance = (rate || 5) * 5; // minimum 5 minutes worth
    
    // Free Chat Offer eligibility
    const isFreeChatEligible = type === 'chat' && user?.hasUsedFreeChat === false;
    
    if ((user?.wallet || 0) < minBalance && !isFreeChatEligible) {
      setShortBalanceInfo({ required: minBalance, current: user?.wallet || 0, name: astro.name || astro.userId?.name || 'Astrologer' });
      setShowBalanceModal(true);
      return;
    }
    
    if (isFreeChatEligible) {
      navigate(`/user/chat`, { state: { astrologer: astro, startWithBot: true, roomId: `room_${user._id}_bot_${Date.now()}` } });
      return;
    }
    
    // 3. Navigate to WaitingScreen with callId if applicable
    if (type === 'audio' || type === 'video') {
      try {
        const res = await api.post('/calls/request', { astrologerId: astro._id || astro.userId?._id || astro.userId });
        const { callId } = res.data.data.callSession;
        navigate('/user/waiting', {
          state: { astrologer: astro, type, callId }
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initiate call');
      }
    } else {
      navigate('/user/waiting', {
        state: { astrologer: astro, type }
      });
    }
  };

  const filteredAstrologers = astrologers.filter(a => {
    const isOnline = a.onlineStatus === 'online';
    const astroName = a.name || a.userId?.name || '';
    return isOnline && astroName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-20">
      {/* ═══ TOP NAVBAR ═══ */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div 
              onClick={openSidebar}
              className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-200 cursor-pointer shrink-0"
            >
              {isAuthenticated && user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-500 font-bold text-sm">{(user?.name || 'G')[0]}</span>
              )}
            </div>
            <span className="text-gray-800 font-semibold text-[15px]">Find the Astrologer</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowSearch(!showSearch)} className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
              <FiSearch size={18} className="text-orange-500" />
            </button>
            <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
              <FiFilter size={16} className="text-orange-500" />
            </button>
          </div>
        </div>

        {/* Search bar (toggled) */}
        {showSearch && (
          <div className="px-4 pb-3 animate-slide-down">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-orange-200 rounded-xl py-2 px-4 text-[14px] outline-none focus:border-orange-500 bg-orange-50/50 transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Question Banner */}
        <div className="bg-orange-50 border-y border-orange-100 px-4 py-2.5 text-center">
          <span className="text-[13px] text-gray-600 font-medium">Will I have love or arranged marriage?</span>
        </div>

        {/* Tab Bar: Chat / Call */}
        <div className="flex border-b border-gray-100">
          {['chat', 'call'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[14px] font-bold capitalize transition-all duration-200 relative ${
                activeTab === tab
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab === 'call' ? 'Audio Call' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 px-4 py-2.5 no-scrollbar bg-white">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 transition-all duration-200 ${
                activeCategory === cat.name
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-orange-50 text-gray-600 border border-orange-100 hover:bg-orange-100'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ ASTROLOGER LIST ═══ */}
      <div className="px-4 py-3 space-y-3">
        {filteredAstrologers.map((astro, idx) => {
          const astroName = astro.name || astro.userId?.name || 'Astrologer';
          const avatarUrl = astro.avatar || astro.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
          return (
          <div key={astro._id || idx} className="bg-white rounded-2xl shadow-card border border-gray-100 relative overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
            <div className="p-4 cursor-pointer" onClick={() => navigate(`/user/astrologer/${astro._id}`)}>
              <div className="flex gap-3">
                {/* Avatar & rating */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-200 bg-orange-50">
                    <img src={avatarUrl} alt={astroName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`; }} />
                  </div>
                  <div className="flex text-[13px] tracking-[-1px]">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className={i < Math.floor(astro.rating || 5) ? 'text-orange-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-[10px] whitespace-nowrap">{astro.orders || '1k+'} orders</span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col pt-0.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-[16px]">{astroName}</h3>
                    {astro.isVerified !== false && (
                      <span className="w-[14px] h-[14px] bg-green-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{(astro.skills || []).join(', ')}</p>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{(astro.languages || []).join(', ')}</p>
                  <p className="text-gray-500 text-[12px] mb-1.5">Exp: {astro.experience} Years</p>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-gray-800">
                      ₹{activeTab === 'video call' ? (astro.pricing?.videoCall || (astro.rate ? astro.rate * 2 : 10)) : activeTab === 'call' ? (astro.pricing?.audioCall || astro.rate || 5) : (astro.pricing?.chat || astro.rate || 5)}
                      <span className="text-[12px] text-gray-400 font-normal">/min</span>
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-end justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      let emitType = activeTab;
                      if (activeTab === 'call') emitType = 'audio';
                      if (activeTab === 'video call') emitType = 'video';
                      handleSessionRequest(astro, emitType);
                    }}
                    className="bg-orange-500 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all capitalize"
                  >
                    {activeTab === 'call' ? 'Audio Call' : activeTab}
                  </button>
                </div>
              </div>
            </div>

            {/* Offer Footer */}
            {astro.discountedPrice && (
              <div className="bg-orange-50 px-4 py-1.5 border-t border-orange-100 flex items-center gap-1.5">
                <span className="text-orange-400 text-[10px]">%</span>
                <span className="text-orange-400 text-[11px] font-medium">Special offer for new users</span>
              </div>
            )}
          </div>
        )})}
      </div>

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

export default Astrologers;

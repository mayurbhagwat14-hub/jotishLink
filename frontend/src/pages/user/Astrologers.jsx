import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { fetchAstrologersThunk } from '../../store/slices/userSlice';
import LowBalanceModal from '../../components/LowBalanceModal';
import { io } from 'socket.io-client';

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
    dispatch(fetchAstrologersThunk());
    const token = localStorage.getItem('accessToken');
    const s = io('http://localhost:5000', { auth: { token } });
    setSocket(s);
    return () => { s.disconnect(); };
  }, [dispatch]);

  const handleActionClick = (astro) => {
    if (!isAuthenticated || user?.name === 'Guest User') {
      navigate('/user/login', { state: { redirectTo: `/user/astrologers?type=${activeTab}` } });
      return;
    }
    if (!user?.name || user?.name.trim() === '') {
      navigate('/user/details', { state: { redirectTo: `/user/astrologers?type=${activeTab}` } });
      return;
    }

    const rate = activeTab === 'video call'
      ? (astro.pricing?.videoCall || (astro.rate ? astro.rate * 2 : 10))
      : activeTab === 'call' 
      ? (astro.pricing?.audioCall || astro.rate || 5) 
      : (astro.pricing?.chat || astro.rate || 5);

    // Minimum 5 minutes required
    const requiredAmount = rate * 5;
    const walletBalance = user?.wallet || 0;
    const astroName = astro.name || astro.userId?.name || 'Astrologer';

    // Free Chat Offer eligibility (no wallet check needed for free chat)
    const isFreeChatEligible = activeTab === 'chat' && user?.hasUsedFreeChat === false;

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
      
      let emitType = activeTab;
      if (activeTab === 'call') emitType = 'audio';
      if (activeTab === 'video call') emitType = 'video';

      socket.emit('request_session', {
        astrologerId: targetAstroId,
        userId: user._id,
        userName: user.name,
        type: emitType,
      });

      socket.once('session_accepted', ({ roomId }) => {
        setIsConnecting(false);
        socket.off('session_rejected'); // cleanup the other listener
        if (activeTab === 'chat') {
          navigate(`/user/chat`, { state: { astrologer: astro, startWithBot: false, roomId } });
        } else {
          navigate(`/user/video-room/${roomId}?type=${activeTab === 'video call' ? 'video' : 'audio'}`, { state: { astrologer: astro } });
        }
      });

      socket.once('session_rejected', ({ reason }) => {
        setIsConnecting(false);
        socket.off('session_accepted'); // cleanup
        alert(`Request declined: ${reason}`);
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
              {tab}
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
            <div className="p-4">
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
                    onClick={() => handleActionClick(astro)}
                    className="bg-orange-500 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all capitalize"
                  >
                    {activeTab}
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
              Waiting for <span className="font-semibold text-gray-800">{connectingAstroName}</span> to accept your {activeTab} request...
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

export default Astrologers;

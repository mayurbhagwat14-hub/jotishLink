import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiVideo, FiSearch, FiX, FiArrowLeft } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { fetchAstrologersThunk, updateAstrologerStatus } from '../../store/slices/userSlice';
import { addWalletCash } from '../../store/slices/authSlice';
import LowBalanceModal from '../../components/LowBalanceModal';
import getSocket from '../../socket/socketManager';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const categories = [
  { name: 'All', icon: <BiCategoryAlt />, active: true },
  { name: 'Love', icon: <BiHeart /> },
  { name: 'Education', icon: <BiBookHeart /> },
  { name: 'Marriage', icon: <span className="text-sm">💍</span> },
  { name: 'Health', icon: <MdOutlineHealthAndSafety /> },
  { name: 'Wealth', icon: <FaRupeeSign size={10} /> },
  { name: 'Legal', icon: <MdOutlineGavel /> },
  { name: 'Career', icon: <span className="text-[10px]">💼</span> },
  { name: 'Business', icon: <span className="text-[10px]">🏢</span> },
  { name: 'Kids', icon: <span className="text-[10px]">👶</span> },
];

const VideoCallList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { astrologers, loading, error } = useSelector((state) => state.user);
  const { isAuthenticated, user, settings } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const params = {};
    if (activeCategory !== 'All' && activeCategory !== 'NEW!') {
      params.category = activeCategory;
    }
    dispatch(fetchAstrologersThunk(params));

    const token = localStorage.getItem('accessToken');
    const s = getSocket();
    setSocket(s);
    
    // Listen for real-time status updates
    const handleStatusChange = (data) => {
      dispatch(updateAstrologerStatus({ astrologerId: data.astrologerId, status: data.status }));
    };

    s.on('astro_status_changed', handleStatusChange);
    s.on('astrologer_status_changed', handleStatusChange);

    return () => {  
      s.off('astro_status_changed', handleStatusChange);
      s.off('astrologer_status_changed', handleStatusChange);
    };
  }, [dispatch, activeCategory]);

  const handleSessionRequest = (astro, type) => {
    if (!isAuthenticated) return navigate('/user/login');
    
    const minBalance = settings?.minChatBalance || 10;
    
    if ((user?.wallet || 0) < minBalance) {
      setShortBalanceInfo({ required: minBalance, current: user?.wallet || 0, name: astro.name });
      setShowBalanceModal(true);
      return;
    }
    
    navigate('/user/waiting', { state: { astrologer: astro, type } });
  };

  const handleRecharge = () => {
    dispatch(addWalletCash(500));
    setShowBalanceModal(false);
  };

  const filteredAstrologers = astrologers.filter(astro => {
    const astroName = astro.name || '';
    const matchesSearch = astroName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (searchQuery.trim().length > 0) {
      return matchesSearch;
    } else {
      const isOnlineOrBusy = astro.onlineStatus === 'online' || astro.onlineStatus === 'busy';
      return isOnlineOrBusy && matchesSearch;
    }
  });

  return (
    <div className="w-full bg-gray-50 min-h-screen font-sans pb-24">
      {/* Header */}
      <div className="px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/user/home')}
            className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Go back"
          >
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-gray-900 font-bold text-[18px] truncate">Video Call with Astrologer</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#fa6830] shrink-0">
          <FiVideo size={16} />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search astrologer by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl py-2.5 px-4 pr-10 text-[14px] outline-none focus:border-orange-400 bg-gray-50 transition-all"
          />
          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 px-4 py-2.5 no-scrollbar bg-white border-b border-gray-100">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCategory(cat.name)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold shrink-0 transition-all duration-200 ${
              activeCategory === cat.name
                ? 'bg-[#fa6830] text-white shadow-sm'
                : 'bg-orange-50 text-gray-600 border border-orange-100 hover:bg-orange-100'
            }`}
          >
            {cat.icon}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {filteredAstrologers.map((astro, idx) => {
          const astroName = astro.name || astro.userId?.name || 'Astrologer';
          const avatarUrl = astro.avatar || astro.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;
          const isOffline = astro.onlineStatus === 'offline';
          const isBusy = astro.onlineStatus === 'busy';
          
          return (
          <div key={astro._id || idx} className={`bg-white rounded-2xl shadow-card border border-gray-100 relative overflow-hidden hover:shadow-card-hover transition-all duration-500 ${isOffline ? 'grayscale opacity-60' : ''}`}>
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
                <div className="flex-1 flex flex-col pt-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                    <h3 className="font-bold text-gray-900 text-[16px] truncate max-w-[120px] sm:max-w-[140px]">{astroName}</h3>
                    {astro.isVerified !== false && (
                      <span className="w-[14px] h-[14px] bg-green-500 rounded-full flex items-center justify-center text-white text-[9px] shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{(astro.skills || []).join(', ')}</p>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{(astro.languages || []).join(', ')}</p>
                  <p className="text-gray-500 text-[12px] mb-1.5">Exp: {astro.experience} Years</p>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold text-gray-800">
                      ₹{astro.pricing?.videoCall || (astro.rate ? astro.rate * 2 : 10)}
                      <span className="text-[12px] text-gray-400 font-normal">/min</span>
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-end justify-center shrink-0 pl-2">
                  {isOffline ? (
                    <button disabled className="bg-gray-400 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm transition-all capitalize cursor-not-allowed">
                      Offline
                    </button>
                  ) : isBusy ? (
                    <button disabled className="bg-red-500 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm transition-all capitalize cursor-not-allowed">
                      Busy
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionRequest(astro, 'video');
                      }}
                      className="bg-[#fa6830] text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm shadow-orange-200 hover:bg-[#e55923] active:scale-95 transition-all capitalize"
                    >
                      Video Call
                    </button>
                  )}
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

        {filteredAstrologers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 font-medium">No astrologers found.</p>
          </div>
        )}
      </div>

      <LowBalanceModal 
        isOpen={showBalanceModal} 
        onClose={() => setShowBalanceModal(false)}
        requiredAmount={shortBalanceInfo.required}
        currentBalance={shortBalanceInfo.current}
        targetName={shortBalanceInfo.name || 'Astrologer'}
      />



    </div>
  );
};

export default VideoCallList;

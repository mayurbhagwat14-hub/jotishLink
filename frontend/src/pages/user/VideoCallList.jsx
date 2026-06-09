import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiVideo, FiSearch, FiX } from 'react-icons/fi';
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
      <div className="px-4 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-gray-900 font-bold text-[18px]">Video Call with Astrologer</h1>
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
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
                ? 'bg-orange-500 text-white shadow-sm'
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
        {filteredAstrologers.map((astro) => {
          const isOffline = astro.onlineStatus === 'offline';
          const isBusy = astro.onlineStatus === 'busy';
          
          return (
          <div key={astro._id} className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 transition-all duration-500 ${isOffline ? 'grayscale opacity-60' : ''}`}>
            
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-orange-200 overflow-hidden">
                <img src={astro.avatar} alt={astro.name} className="w-full h-full object-cover" />
              </div>
              {astro.isVerified && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-[16px] font-bold text-gray-900">{astro.name}</h3>
              <p className="text-[12px] text-gray-500 line-clamp-1">{astro.skills.join(', ')}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-orange-500 text-[12px]">★</span>
                <span className="text-[12px] font-bold text-gray-700">{astro.rating}</span>
                <span className="text-gray-300 text-[10px] mx-1">•</span>
                <span className="text-[11px] text-gray-500">{astro.experience} Yrs Exp</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-[14px] font-bold text-gray-900">₹{astro.pricing?.videoCall || (astro.rate ? astro.rate * 2 : 10)}/min</span>
              {isOffline ? (
                <button disabled className="bg-gray-400 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-not-allowed">
                  Offline
                </button>
              ) : isBusy ? (
                <button disabled className="bg-red-500 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-not-allowed">
                  Busy
                </button>
              ) : (
                <button 
                  onClick={() => handleSessionRequest(astro, 'video')}
                  className="bg-orange-500 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
                >
                  Call
                </button>
              )}
            </div>

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

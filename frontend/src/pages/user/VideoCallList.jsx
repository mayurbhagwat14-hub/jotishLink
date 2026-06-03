import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiVideo, FiSearch, FiX } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { fetchAstrologersThunk } from '../../store/slices/userSlice';
import { addWalletCash } from '../../store/slices/authSlice';
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
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    dispatch(fetchAstrologersThunk());
    const token = localStorage.getItem('accessToken');
    const s = getSocket();
    setSocket(s);
    return () => {  };
  }, [dispatch]);

  const handleSessionRequest = async (astro, type) => {
    // 1. Check auth
    if (!isAuthenticated) return navigate('/user/login');
    
    // 2. Check wallet balance
    const rate = type === 'chat' ? astro.pricing?.chat
               : type === 'audio' ? astro.pricing?.audioCall
               : astro.pricing?.videoCall;
    const minBalance = (rate || 5) * 5; // minimum 5 minutes worth
    
    if ((user?.wallet || 0) < minBalance) {
      // Show LowBalanceModal or navigate to recharge
      setShortBalanceInfo({ required: minBalance, current: user?.wallet || 0 });
      setShowBalanceModal(true);
      return;
    }
    
    // 3. Navigate to WaitingScreen with callId if applicable
    if (type === 'audio' || type === 'video') {
      try {
        const res = await api.post('/calls/request', { astrologerId: astro._id || astro.userId });
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

  const handleRecharge = () => {
    dispatch(addWalletCash(500));
    setShowBalanceModal(false);
  };

  const filteredAstrologers = astrologers.filter(astro => 
    astro.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {filteredAstrologers.map((astro) => (
          <div key={astro._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            
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
              <button 
                onClick={() => handleSessionRequest(astro, 'video')}
                className="bg-orange-500 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1 shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
              >
                Call
              </button>
            </div>

          </div>
        ))}

        {filteredAstrologers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 font-medium">No astrologers found.</p>
          </div>
        )}
      </div>

      {/* ═══ INSUFFICIENT BALANCE MODAL ═══ */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBalanceModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 overflow-hidden animate-scale-in text-center">
            <button onClick={() => setShowBalanceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <FiX size={20} />
            </button>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👛</span>
            </div>
            <h3 className="font-bold text-gray-900 text-[18px] mb-2">Insufficient Balance</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Your wallet balance is <strong>₹{shortBalanceInfo.current}</strong>, but this session requires at least <strong>₹{shortBalanceInfo.required}</strong>. Please recharge to connect.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBalanceModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl text-[13px] hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRecharge} className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl text-[13px] hover:bg-orange-600 shadow-md shadow-orange-200 transition-colors">
                Recharge (₹500)
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default VideoCallList;

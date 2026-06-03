import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign, FaStar } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAstrologersThunk } from '../../store/slices/userSlice';
import LowBalanceModal from '../../components/LowBalanceModal';

// No mock data

const categories = [
  { name: 'All', icon: <BiCategoryAlt /> },
  { name: 'NEW!', icon: <span className="text-[10px]">✨</span> },
  { name: 'Love', icon: <BiHeart /> },
  { name: 'Education', icon: <BiBookHeart /> },
  { name: 'Marriage', icon: <span className="text-sm">💍</span> },
  { name: 'Health', icon: <MdOutlineHealthAndSafety /> },
  { name: 'Wealth', icon: <FaRupeeSign size={10} /> },
  { name: 'Legal', icon: <MdOutlineGavel /> },
];

const ChatScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { astrologers: reduxAstrologers } = useSelector((state) => state.user);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateStars, setRateStars] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [lowBalanceInfo, setLowBalanceInfo] = useState({ required: 0, current: 0 });

  useEffect(() => {
    dispatch(fetchAstrologersThunk());
  }, [dispatch]);

  const astrologers = reduxAstrologers.map(astro => ({
    ...astro,
    price: astro.rate || astro.pricing?.chat || 5,
    discountedPrice: astro.discountedPrice || null,
    languages: astro.languages || ['Hindi', 'English'],
    avatar: astro.avatar || 'https://i.pravatar.cc/150?u=' + astro.name
  }));

  const handleSessionRequest = (astro, type) => {
    // 1. Check auth
    if (!isAuthenticated) return navigate('/user/login');
    
    // 2. Check wallet balance
    const rate = type === 'chat' ? astro.pricing?.chat
               : type === 'audio' ? astro.pricing?.audioCall
               : astro.pricing?.videoCall;
    const minBalance = (rate || 5) * 5; // minimum 5 minutes worth
    
    if ((user?.wallet || 0) < minBalance) {
      // Show LowBalanceModal or navigate to recharge
      setLowBalanceInfo({ required: minBalance, current: user?.wallet || 0 });
      setShowLowBalance(true);
      return;
    }
    
    // 3. Navigate to WaitingScreen
    navigate('/user/waiting', {
      state: { astrologer: astro, type }
    });
  };

  const submitRating = () => {
    console.log('Rating submitted:', { astrologer: selectedAstrologer?.name, stars: rateStars, comment: rateComment });
    setShowRateModal(false);
    setRateStars(0);
    setRateComment('');
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans pb-20">
      {/* ═══ TOP NAVBAR ═══ */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-200">
              <span className="text-orange-500 font-bold text-sm">{(user?.name || 'G')[0]}</span>
            </div>
            <span className="text-gray-800 font-semibold text-[15px]">Find the Astrologer</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
              <FiSearch size={18} className="text-orange-500" />
            </button>
            <button className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center hover:bg-orange-100 transition-colors">
              <FiFilter size={16} className="text-orange-500" />
            </button>
          </div>
        </div>

        {/* Question banner */}
        <div className="bg-orange-50 border-y border-orange-100 px-4 py-2.5 text-center">
          <span className="text-[13px] text-gray-600 font-medium">Will I have love or arranged marriage?</span>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-100">
          {['Chat', 'Call'].map((tab) => (
            <button key={tab} className={`flex-1 py-3 text-[14px] font-bold relative ${tab === 'Chat' ? 'text-orange-500' : 'text-gray-400'}`}>
              {tab}
              {tab === 'Chat' && <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-orange-500 rounded-full" />}
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
              {cat.icon} <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ ASTROLOGERS LIST ═══ */}
      <div className="px-4 py-3 space-y-3">
        {astrologers.map((astro, idx) => (
          <div key={astro._id || idx} className="bg-white rounded-2xl shadow-card border border-gray-100 relative overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-200">
                    <img src={astro.avatar} alt={astro.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex text-[13px] tracking-[-1px]">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i} className={i < Math.floor(astro.rating || 5) ? 'text-orange-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-[10px]">{astro.orders} orders</span>
                </div>

                <div className="flex-1 flex flex-col pt-0.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-[16px]">{astro.name}</h3>
                    {astro.isVerified && (
                      <span className="w-[14px] h-[14px] bg-green-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{astro.skills?.join(', ')}</p>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{astro.languages?.join(', ')}</p>
                  <p className="text-gray-500 text-[12px] mb-1.5">Exp: {astro.experience} Years</p>
                  <div className="flex items-center gap-1.5">
                    {astro.discountedPrice ? (
                      <>
                        <span className="text-[14px] text-gray-400 line-through">₹{astro.price}</span>
                        <span className="text-[14px] font-bold text-orange-500">₹{astro.discountedPrice}/min</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold text-gray-800">₹{astro.price}<span className="text-[12px] text-gray-400 font-normal">/min</span></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-center">
                  <button
                    onClick={() => handleSessionRequest(astro, 'chat')}
                    className="bg-orange-500 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all"
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>

            {astro.discountedPrice && (
              <div className="bg-orange-50 px-4 py-1.5 border-t border-orange-100 flex items-center gap-1.5">
                <span className="text-orange-400 text-[10px]">%</span>
                <span className="text-orange-400 text-[11px] font-medium">Special offer for new users</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ RATE ASTROLOGER MODAL ═══ */}
      {showRateModal && selectedAstrologer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-6 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button onClick={() => setShowRateModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <FiX size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Astrologer Info */}
            <div className="flex flex-col items-center px-6 pb-4">
              <h3 className="text-[18px] font-bold text-gray-800 mb-1">Rate Astrologer</h3>
              <div className="flex items-center gap-3 mt-4 mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200">
                  <img src={selectedAstrologer.avatar} alt={selectedAstrologer.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{selectedAstrologer.name}</h4>
                  <p className="text-[12px] text-gray-400">{selectedAstrologer.skills?.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              <p className="text-gray-500 text-[13px] text-center my-3">
                Welcome diya bolo! If you are not anonymous it looks more trust worthy.
              </p>

              {/* Stars */}
              <div className="flex gap-2 my-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRateStars(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <FaStar
                      size={32}
                      className={star <= rateStars ? 'text-orange-400' : 'text-gray-200'}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                placeholder="Describe your experience (optional)"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-[14px] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 resize-none h-24 mt-2 transition-all"
              />

              {/* Submit */}
              <button
                onClick={submitRating}
                disabled={rateStars === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-[15px] mt-4 mb-2 transition-all ${
                  rateStars > 0
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

      <LowBalanceModal 
        isOpen={showLowBalance} 
        onClose={() => setShowLowBalance(false)}
        requiredAmount={lowBalanceInfo.required}
        currentBalance={lowBalanceInfo.current}
      />
    </div>
  );
};

export default ChatScreen;

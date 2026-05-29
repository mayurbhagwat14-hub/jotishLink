import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { BiCategoryAlt, BiHeart, BiBookHeart } from 'react-icons/bi';
import { MdOutlineHealthAndSafety, MdOutlineGavel } from 'react-icons/md';
import { FaRupeeSign } from 'react-icons/fa';
import { fetchAstrologersThunk } from '../../store/slices/userSlice';
import { addWalletCash } from '../../store/slices/authSlice';

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
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0 });

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('type') || 'chat';
  const setActiveTab = (tab) => setSearchParams({ type: tab });

  useEffect(() => {
    dispatch(fetchAstrologersThunk());
  }, [dispatch]);

  const handleActionClick = (astro) => {
    if (!isAuthenticated || user?.name === 'Guest User') {
      navigate('/login');
      return;
    }
    if (!user?.name || user?.name.trim() === '') {
      navigate('/user/details');
      return;
    }

    const rate = activeTab === 'call' 
      ? (astro.pricing?.audioCall || astro.rate || 5) 
      : (astro.pricing?.chat || astro.rate || 5);

    const walletBalance = user?.wallet || 0;

    if (walletBalance < rate) {
      setShortBalanceInfo({ required: rate, current: walletBalance });
      setShowBalanceModal(true);
    } else {
      if (activeTab === 'call') {
        navigate(`/user/video-room/${astro._id}`, { state: { astrologer: astro } });
      } else {
        navigate(`/user/chat`, { state: { astrologer: astro } });
      }
    }
  };

  const handleRecharge = () => {
    dispatch(addWalletCash(500));
    setShowBalanceModal(false);
  };

  const filteredAstrologers = astrologers.filter(a => {
    const astroName = a.name || a.user?.name || '';
    return astroName.toLowerCase().includes(searchQuery.toLowerCase());
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
        {filteredAstrologers.map((astro, idx) => (
          <div key={astro._id || idx} className="bg-white rounded-2xl shadow-card border border-gray-100 relative overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
            <div className="p-4">
              <div className="flex gap-3">
                {/* Avatar & rating */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-orange-200">
                    <img src={astro.avatar || astro.user?.avatar} alt={astro.name} className="w-full h-full object-cover" />
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
                    <h3 className="font-bold text-gray-900 text-[16px]">{astro.name || astro.user?.name}</h3>
                    {astro.isVerified !== false && (
                      <span className="w-[14px] h-[14px] bg-green-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{astro.skills?.join(', ')}</p>
                  <p className="text-gray-500 text-[12px] line-clamp-1 mb-0.5">{astro.languages?.join(', ')}</p>
                  <p className="text-gray-500 text-[12px] mb-1.5">Exp: {astro.experience} Years</p>

                  <div className="flex items-center gap-1.5">
                    {astro.pricing?.chat ? (
                      <>
                        <span className="text-[14px] font-bold text-gray-800">₹{activeTab === 'call' ? astro.pricing.audioCall : astro.pricing.chat}<span className="text-[12px] text-gray-400 font-normal">/min</span></span>
                      </>
                    ) : (
                      <span className="text-[14px] font-bold text-gray-800">₹{astro.rate || 5}<span className="text-[12px] text-gray-400 font-normal">/min</span></span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-end justify-center">
                  <button
                    onClick={() => handleActionClick(astro)}
                    className="bg-orange-500 text-white font-bold text-[12px] px-5 py-2 rounded-xl shadow-sm shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all"
                  >
                    {activeTab === 'call' ? 'Call' : 'Chat'}
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
        ))}
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

export default Astrologers;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiStar, FiClock, FiMessageSquare, FiPhoneCall, FiVideo, FiCheckCircle } from 'react-icons/fi';
import * as userApis from '../../api/userApis';
import LowBalanceModal from '../../components/LowBalanceModal';
import SplashScreen from '../../components/SplashScreen';

const AstrologerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, settings } = useSelector((state) => state.auth);
  const { appName } = useSelector((state) => state.settings) || { appName: 'JyotishLink' };
  
  const [astrologer, setAstrologer] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, name: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [astroRes, ratingsRes] = await Promise.all([
          userApis.getAstrologerById(id),
          userApis.getAstrologerRatings(id)
        ]);
        setAstrologer(astroRes.data?.data?.astrologer || astroRes.data?.astrologer);
        setRatings(ratingsRes.data?.data?.ratings || []);
      } catch (err) {
        setError('Failed to fetch astrologer details');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleActionClick = (type) => {
    if (!isAuthenticated || user?.name === 'Guest User') {
      navigate('/user/login', { state: { redirectTo: `/user/astrologer/${id}` } });
      return;
    }
    
    const rate = type === 'video' 
      ? (astrologer.pricing?.videoCall || (astrologer.rate ? astrologer.rate * 2 : 10)) 
      : type === 'call' 
      ? (astrologer.pricing?.audioCall || astrologer.rate || 5) 
      : (astrologer.pricing?.chat || astrologer.rate || 5);
      
    const requiredAmount = settings?.minChatBalance || 10;
    const walletBalance = user?.wallet || 0;
    const astroName = astrologer.name || astrologer.userId?.name || 'Astrologer';

    const isFreeChatEligible = type === 'chat' && user?.freeChatUsed === false;

    if (walletBalance < requiredAmount && !isFreeChatEligible) {
      setShortBalanceInfo({ required: requiredAmount, current: walletBalance, name: astroName });
      setShowBalanceModal(true);
    } else if (isFreeChatEligible) {
      navigate(`/user/chat`, { state: { astrologer, startWithBot: true, roomId: `room_${user._id}_bot_${Date.now()}` } });
    } else {
      navigate('/user/waiting', { state: { astrologer, type: type === 'video' ? 'video' : type === 'call' ? 'audio' : 'chat' } });
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  if (error || !astrologer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 mb-4">{error || 'Astrologer not found'}</p>
        <button onClick={() => navigate(-1)} className="bg-[#fa6830] text-white px-6 py-2 rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const astroName = astrologer.name || astrologer.userId?.name || 'Astrologer';
  const avatarUrl = astrologer.avatar || astrologer.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astroName)}&background=ffedD5&color=f97316`;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 font-sans">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100 flex items-center px-4 py-4">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800 ml-3">{astroName}</h1>
      </div>

      <div className="max-w-md mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl m-4 p-5 shadow-sm border border-gray-100">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-100 shrink-0">
              <img src={avatarUrl} alt={astroName} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{astroName}</h2>
                {astrologer.isVerified && <FiCheckCircle className="text-green-500 fill-green-50" size={16} />}
              </div>
              <p className="text-gray-500 text-sm mb-1 line-clamp-1">{(astrologer.skills || []).join(', ')}</p>
              <p className="text-gray-500 text-sm mb-2 line-clamp-1">{(astrologer.languages || []).join(', ')}</p>
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                <FiClock className="text-[#fa6830]" />
                <span>Exp: {astrologer.experience} Years</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 bg-orange-50 p-3 rounded-xl border border-orange-100/50">
            <div className="flex flex-col items-center flex-1 border-r border-orange-200/50">
              <span className="text-gray-500 text-xs font-medium mb-1">Rating</span>
              <div className="flex items-center gap-1">
                <FiStar className="text-[#fa6830] fill-orange-500" size={14} />
                <span className="font-bold text-gray-900">{astrologer.rating || '5.0'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center flex-1 border-r border-orange-200/50">
              <span className="text-gray-500 text-xs font-medium mb-1">Orders</span>
              <span className="font-bold text-gray-900">{astrologer.orders || '1K+'}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-gray-500 text-xs font-medium mb-1">Price/min</span>
              <span className="font-bold text-gray-900">₹{astrologer.pricing?.chat || astrologer.rate || 5}</span>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-2xl m-4 p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 text-lg">About Me</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {astrologer.about || `Hello, I am ${astroName}, a verified and experienced astrologer on ${appName}. I specialize in providing accurate predictions and guidance on various aspects of life including love, marriage, career, and health. With over ${astrologer.experience} years of experience, I am here to help you navigate your journey.`}
          </p>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl m-4 p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Reviews</h3>
            {ratings.length > 3 && (
              <button 
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-sm font-bold text-[#fa6830] hover:text-[#e55923]"
              >
                {showAllReviews ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {ratings.length > 0 ? (
              (showAllReviews ? ratings : ratings.slice(0, 3)).map((review, i) => (
                <div key={review._id || i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800 text-sm">{review.user?.name || `${appName} User`}</span>
                    <div className="flex gap-0.5">
                      {Array(5).fill(0).map((_, idx) => (
                        <FiStar key={idx} size={10} className={idx < review.rating ? "text-orange-400 fill-orange-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">{review.review || 'No review provided.'}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm italic">No reviews yet. Be the first to rate!</p>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="max-w-md mx-auto flex gap-2">
          <button onClick={() => handleActionClick('chat')} className="flex-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#e55923] font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-[13px] sm:text-[14px]">
            <FiMessageSquare /> Chat
          </button>
          <button onClick={() => handleActionClick('call')} className="flex-1 bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/30 transition-colors text-[13px] sm:text-[14px]">
            <FiPhoneCall /> Call
          </button>
          <button onClick={() => handleActionClick('video')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/30 transition-colors text-[13px] sm:text-[14px]">
            <FiVideo /> Video
          </button>
        </div>
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

export default AstrologerProfile;

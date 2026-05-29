import { useNavigate } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';

const FreeChatOffer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans relative px-6 py-12 justify-center items-center">
      {/* Decorative dots */}
      <div className="absolute top-[15%] right-[15%] w-3 h-3 bg-orange-400 rounded-full animate-float opacity-80" />
      <div className="absolute top-[35%] left-[10%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-60" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-[20%] right-[20%] w-4 h-4 bg-orange-200 rounded-full animate-float opacity-50" style={{ animationDelay: '0.5s' }} />

      {/* Graphic */}
      <div className="w-[120px] h-[120px] bg-orange-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-orange-200 relative z-10 animate-bounce-slow">
        <FiMessageCircle size={50} className="text-white" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
          FREE
        </div>
      </div>

      <h1 className="text-[28px] font-bold text-gray-900 mb-4 text-center leading-tight">
        Congratulations!
      </h1>
      
      <p className="text-[16px] text-gray-600 font-medium text-center mb-12 max-w-[280px]">
        You have unlocked your <span className="font-bold text-gray-900">First Free Chat</span> with an Astrologer.
      </p>

      <button
        onClick={() => navigate('/user/details', { state: { redirectTo: '/user/astrologers' } })}
        className="w-full max-w-xs py-4 rounded-xl font-bold text-[15px] tracking-wide transition-all duration-300 bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]"
      >
        START FREE CHAT
      </button>

      <button
        onClick={() => navigate('/user/details', { state: { redirectTo: '/user/home' } })}
        className="mt-6 text-gray-500 font-medium text-[14px] hover:text-gray-800 transition-colors"
      >
        Maybe Later
      </button>
    </div>
  );
};

export default FreeChatOffer;

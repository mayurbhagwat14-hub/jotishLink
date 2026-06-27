import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const ComingSoon = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = location.pathname.split('/').pop();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-3 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
          <FiArrowLeft size={20} className="text-gray-800" />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-800 capitalize">{pageName}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Animated illustration */}
        <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-float">
          <span className="text-6xl">🚀</span>
        </div>

        <h2 className="text-[24px] font-bold text-gray-800 mb-2 text-center">Coming Soon!</h2>
        <p className="text-gray-400 text-[15px] text-center max-w-[280px] leading-relaxed">
          We're working hard to bring this feature to you. Stay tuned!
        </p>

        <button
          onClick={() => navigate('/user/home')}
          className="mt-8 bg-[#fa6830] text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-200 hover:bg-[#e55923] active:scale-[0.98] transition-all"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;

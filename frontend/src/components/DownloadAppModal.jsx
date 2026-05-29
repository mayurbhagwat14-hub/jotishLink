import { FiX, FiDownload } from 'react-icons/fi';
import { FaGooglePlay, FaApple } from 'react-icons/fa';

const DownloadAppModal = ({ isOpen, onClose, title = "Download App to Continue" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-[scaleIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden">
          {/* Abstract circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition"
          >
            <FiX size={20} />
          </button>
          
          <div className="bg-white p-3 rounded-2xl shadow-lg transform translate-y-4">
            <span className="text-4xl text-orange-500 font-bold">✨</span>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 pb-8 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 mb-8 px-2 text-[15px] leading-relaxed">
            Get the full JyotishLink experience. Chat with astrologers, get free kundli, and much more on our mobile app.
          </p>

          <div className="flex flex-col gap-3">
            <button className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition shadow-md active:scale-[0.98]">
              <FaGooglePlay size={24} className="text-green-400" />
              <div className="text-left flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-300 leading-none mb-1">Get it on</span>
                <span className="text-lg leading-none">Google Play</span>
              </div>
            </button>
            
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition shadow-sm active:scale-[0.98]">
              <FaApple size={28} />
              <div className="text-left flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 leading-none mb-1">Download on the</span>
                <span className="text-lg leading-none">App Store</span>
              </div>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Over 50 Million+ Downloads
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppModal;

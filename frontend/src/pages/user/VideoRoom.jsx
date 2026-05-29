import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize } from 'react-icons/fi';

const VideoRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { astrologer } = location.state || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!astrologer) {
      navigate('/user/video-call');
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [astrologer, navigate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    navigate('/user/video-call');
  };

  if (!astrologer) return null;

  return (
    <div className="w-full h-[100dvh] bg-gray-900 font-sans relative flex flex-col overflow-hidden">
      
      {/* Remote Video (Mock: using astrologer avatar as placeholder) */}
      <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
        {!isVideoOff ? (
          <img 
            src={astrologer.avatar} 
            alt={astrologer.name} 
            className="w-full h-full object-cover opacity-80 blur-[2px]" 
          />
        ) : (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700">
            <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute top-16 text-center z-10">
          <h2 className="text-white text-[24px] font-bold shadow-black drop-shadow-md">{astrologer.name}</h2>
          <p className="text-orange-400 text-[14px] font-medium shadow-black drop-shadow-md mt-1">{formatTime(callDuration)}</p>
        </div>
      </div>

      {/* Local Video (Mock) */}
      <div className="absolute top-6 right-4 w-28 h-40 bg-gray-700 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-lg z-20">
        {!isVideoOff ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-600 text-white/50 text-[12px] text-center px-2">
            Local Camera Feed
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <FiVideoOff className="text-gray-500" size={24} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto pb-8 pt-10 px-6 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-20 flex justify-center items-center gap-6">
        
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>

        <button 
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-transform active:scale-95"
        >
          <FiPhoneOff size={28} />
        </button>

        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600'
          }`}
        >
          {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
        </button>

      </div>
    </div>
  );
};

export default VideoRoom;

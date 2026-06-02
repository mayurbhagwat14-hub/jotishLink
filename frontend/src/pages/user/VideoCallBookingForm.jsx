import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiCalendar, FiClock, FiVideo } from 'react-icons/fi';
import { io } from 'socket.io-client';

const VideoCallBookingForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { astrologer } = location.state || {};
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    date: '',
    time: ''
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingAstroName, setConnectingAstroName] = useState('');
  const [connectingAstroId, setConnectingAstroId] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', { auth: { token } });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  if (!astrologer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Invalid Booking Session</p>
        <button onClick={() => navigate('/user/video-call')} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.name === 'Guest User') {
      navigate('/user/login');
      return;
    }
    
    if (!socket) return;
    setIsConnecting(true);
    setConnectingAstroName(astrologer.name);

    const targetAstroId = astrologer.userId?._id || astrologer.userId || astrologer._id;
    setConnectingAstroId(targetAstroId);

    socket.emit('request_session', {
      astrologerId: targetAstroId,
      userId: user._id,
      userName: user.name,
      type: 'video',
    });

    socket.once('session_accepted', ({ roomId }) => {
      setIsConnecting(false);
      socket.off('session_rejected');
      navigate(`/user/video-room/${roomId}?type=video`, { state: { astrologer, scheduled: formData } });
    });

    socket.once('session_rejected', ({ reason }) => {
      setIsConnecting(false);
      socket.off('session_accepted');
      alert(`Request declined: ${reason}`);
    });
  };

  const isFormValid = formData.date && formData.time;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white sticky top-0 z-10 border-b border-gray-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-800 p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">Schedule Video Call</h1>
      </div>

      {/* Booking Summary */}
      <div className="px-4 py-5 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100">
        <p className="text-orange-500 font-bold text-[13px] uppercase tracking-wide mb-1">Video Consultation</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-14 h-14 rounded-full border-2 border-orange-200 overflow-hidden shrink-0 shadow-sm">
            <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900 leading-tight">{astrologer.name}</h2>
            <p className="text-[13px] text-gray-600 font-medium">Price: ₹{astrologer.pricing?.videoCall || (astrologer.rate ? astrologer.rate * 2 : 10)}/min</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6">
        <h3 className="text-[18px] font-bold text-gray-800 mb-5 leading-snug">When do you want to connect?</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Date Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Date</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                <FiCalendar size={18} />
              </div>
              <input
                type="date"
                required
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-2">Select Time</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                <FiClock size={18} />
              </div>
              <input
                type="time"
                required
                className="w-full border-2 border-gray-200 rounded-xl py-3.5 pl-11 pr-4 text-[15px] font-medium text-gray-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50 focus:bg-white"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

        </form>
      </div>

      {/* Footer Action */}
      <div className="px-5 mt-auto pt-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-xl font-bold tracking-wide text-[15px] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
            isFormValid
              ? 'bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FiVideo size={18} />
          CONFIRM VIDEO CALL
        </button>
        <p className="text-center text-gray-400 text-[12px] font-medium mt-3">You won't be charged yet</p>
      </div>
      
      {/* ═══ CONNECTING MODAL ═══ */}
      {isConnecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm mb-6">
              Waiting for <span className="font-semibold text-gray-800">{connectingAstroName}</span> to accept your scheduled video call request...
            </p>
            <button 
              onClick={() => {
                setIsConnecting(false);
                if (socket && user && connectingAstroId) {
                  socket.emit('cancel_session_request', { 
                    astrologerId: connectingAstroId, 
                    userId: user._id 
                  });
                }
              }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallBookingForm;

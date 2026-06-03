import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiXCircle, FiX } from 'react-icons/fi';
import getSocket from '../../socket/socketManager';

const WaitingScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const { astrologer, type, durationLimit, callId } = location.state || {};
  
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'accepted' | 'rejected' | 'cancelled'
  const [rejectReason, setRejectReason] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!astrologer || !user) {
      navigate(-1);
      return;
    }

    const socket = getSocket();

    // Emit request on mount
    socket.emit('request_session', {
      astrologerId: astrologer._id || astrologer.userId,
      userId: user._id,
      userName: user.name,
      type,
      durationLimit,
      callId
    });

    const handleSessionAccepted = ({ roomId }) => {
      setStatus('accepted');
      setTimeout(() => {
        if (type === 'chat') {
          navigate('/user/chat', { state: { roomId, astrologer, startWithBot: false } });
        } else if (type === 'audio') {
          navigate(`/user/video-room/${roomId}?type=audio`, { state: { astrologer, callId } });
        } else if (type === 'video') {
          navigate(`/user/video-room/${roomId}?type=video`, { state: { astrologer, callId } });
        }
      }, 1000);
    };

    const handleSessionRejected = ({ reason }) => {
      setStatus('rejected');
      setRejectReason(reason || 'Astrologer declined the request.');
    };

    socket.on('session_accepted', handleSessionAccepted);
    socket.on('session_rejected', handleSessionRejected);

    // 60-second timeout
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('rejected');
          setRejectReason('No response from astrologer.');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      socket.off('session_accepted', handleSessionAccepted);
      socket.off('session_rejected', handleSessionRejected);
      clearInterval(timer);
    };
  }, [astrologer, user, type, durationLimit, callId, navigate]);

  const handleCancel = () => {
    const socket = getSocket();
    socket.emit('cancel_session_request', {
      astrologerId: astrologer._id || astrologer.userId,
      userId: user._id
    });
    setStatus('cancelled');
    navigate(-1);
  };

  if (status === 'accepted') {
    return (
      <div className="fixed inset-0 bg-green-50 z-[100] flex flex-col items-center justify-center animate-fade-in">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 animate-bounce">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-800">Request Accepted!</h2>
        <p className="text-green-600 mt-2 font-medium">Entering session...</p>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="fixed inset-0 bg-red-50 z-[100] flex flex-col items-center justify-center animate-fade-in px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
          <FiXCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-red-800 text-center">Request Declined</h2>
        <p className="text-red-600 mt-2 text-center font-medium">{rejectReason}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-8 bg-red-500 text-white font-bold py-3 px-8 rounded-full hover:bg-red-600 transition-colors shadow-lg"
        >
          Try Another Astrologer
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center text-white p-6 animate-fade-in">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20"></div>
      
      {/* Avatar with pulse ring */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75"></div>
        <div className="w-32 h-32 rounded-full border-4 border-orange-500 overflow-hidden relative z-10 bg-gray-800 shadow-xl">
          {astrologer?.avatar ? (
            <img src={astrologer.avatar} alt={astrologer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-orange-500">
              {astrologer?.name?.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">
        Connecting you with {astrologer?.name}...
      </h2>
      <p className="text-gray-400 text-center mb-8 max-w-sm">
        Please wait while the astrologer accepts your {type} request
      </p>

      {/* Loader */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-orange-500 font-mono font-bold">{timeLeft}s</span>
      </div>

      {/* Cancel Button */}
      <button 
        onClick={handleCancel}
        className="flex items-center gap-2 bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white font-bold py-3 px-8 rounded-full transition-all"
      >
        <FiX size={20} /> Cancel Request
      </button>
    </div>
  );
};

export default WaitingScreen;

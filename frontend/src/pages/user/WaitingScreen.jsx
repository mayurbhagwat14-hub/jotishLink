import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getSocket } from '../../socket/socketManager';
import { updateUser } from '../../store/slices/authSlice';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const WaitingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { astrologer, type } = location.state || {};
  const { user } = useSelector((state) => state.auth);

  const [status, setStatus] = useState('waiting');
  const [rejectReason, setRejectReason] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const TIMEOUT = 60;

  useEffect(() => {
    if (!astrologer || !type || !user?._id) {
      navigate('/user/astrologers');
      return;
    }

    const socket = getSocket();

    const astrologerId = astrologer._id;

    console.log('[WaitingScreen] Emit request_session with data:', {
      astrologerId,
      userId: user._id,
      userName: user.name || user.phone,
      type,
    });
    socket.emit('request_session', {
      astrologerId,
      userId: user._id,
      userName: user.name || user.phone,
      type,
    });

    const onAccepted = ({ roomId }) => {
      console.log('[WaitingScreen] session_accepted received for roomId:', roomId);
      clearInterval(timerRef.current);
      setStatus('accepted');
      setTimeout(() => {
        if (type === 'chat') {
          navigate('/user/chat', { state: { astrologer, roomId } });
        } else {
          navigate(`/user/video-room/${roomId}`, { state: { astrologer, type } });
        }
      }, 600);
    };

    const onRejected = ({ reason }) => {
      console.log('[WaitingScreen] session_rejected received with reason:', reason);
      clearInterval(timerRef.current);
      
      const rejectReasonStr = reason || 'Astrologer is busy right now.';
      
      if (rejectReasonStr.toLowerCase().includes('busy')) {
        toast.error('Astrologer is already busy in another session.', {
          duration: 4000,
          position: 'top-center'
        });
        navigate(-1);
        return;
      }

      setStatus('rejected');
      setRejectReason(rejectReasonStr);
    };

    socket.on('session_accepted', onAccepted);
    socket.on('session_rejected', onRejected);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= TIMEOUT) {
          clearInterval(timerRef.current);
          setStatus('timeout');
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      socket.off('session_accepted', onAccepted);
      socket.off('session_rejected', onRejected);
      clearInterval(timerRef.current);
    };
  }, []);

  const handleCancel = () => {
    clearInterval(timerRef.current);
    const socket = getSocket();
    const astrologerId = astrologer?._id;
    socket.emit('cancel_session_request', { astrologerId, userId: user._id });
    navigate(-1);
  };

  const typeLabel = type === 'chat' ? 'Chat' : type === 'audio' ? 'Audio Call' : 'Video Call';
  const typeEmoji = type === 'chat' ? '💬' : type === 'audio' ? '📞' : '📹';

  if (status === 'accepted') {
    return (
      <div className="fixed inset-0 bg-green-500 flex flex-col items-center justify-center z-[200]">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <h2 className="text-white text-2xl font-bold">Connected!</h2>
        <p className="text-green-100 mt-2 text-sm">Starting session...</p>
      </div>
    );
  }

  if (status === 'rejected' || status === 'timeout') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200] px-8">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-gray-800 text-xl font-bold mb-2 text-center">
          {status === 'timeout' ? 'No Response' : 'Request Declined'}
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          {status === 'timeout'
            ? `${astrologer?.name} did not respond. Please try again.`
            : rejectReason}
        </p>
        <button onClick={() => navigate(-1)} className="bg-[#fa6830] text-white font-bold px-10 py-3 rounded-2xl shadow-lg shadow-orange-200">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[200] px-6">
      <button onClick={handleCancel} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <FiX size={20} className="text-gray-500" />
      </button>

      {/* Pulsing avatar */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-orange-200 animate-ping opacity-25 scale-150"></div>
        <div className="absolute inset-0 rounded-full bg-orange-100 animate-pulse opacity-40 scale-125"></div>
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-orange-300 relative z-10 shadow-xl">
          <img
            src={astrologer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer?.name || 'A')}&background=ffedD5&color=f97316&size=150`}
            alt={astrologer?.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full mb-4">
        <span className="text-[#e55923] font-bold text-sm">{typeEmoji} {typeLabel} Request Sent</span>
      </div>

      <h2 className="text-gray-800 text-[20px] font-bold mb-2 text-center">
        Connecting with {astrologer?.name}
      </h2>
      <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
        Waiting for astrologer to accept...<br />
        <span className="text-xs">Rate: ₹{
          type === 'chat' ? (astrologer?.pricing?.chat || astrologer?.rate || 5)
          : type === 'audio' ? (astrologer?.pricing?.audioCall || astrologer?.rate || 5)
          : (astrologer?.pricing?.videoCall || (astrologer?.rate || 5) * 2)
        }/min</span>
      </p>

      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>

      {/* Countdown bar */}
      <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className="bg-orange-400 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${(elapsed / TIMEOUT) * 100}%` }}
        />
      </div>
      <p className="text-gray-400 text-xs mb-10">Auto-cancel in {TIMEOUT - elapsed}s</p>

      <button onClick={handleCancel} className="border-2 border-red-200 text-red-500 font-bold px-10 py-3 rounded-2xl hover:bg-red-50 transition-colors text-sm">
        Cancel Request
      </button>
    </div>
  );
};

export default WaitingScreen;

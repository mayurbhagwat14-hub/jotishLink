import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiPaperclip, FiSend } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { getSocket } from '../../socket/socketManager';
import LowBalanceModal from '../../components/LowBalanceModal';
import RateAstrologerModal from '../../components/RateAstrologerModal';
import { updateUser } from '../../store/slices/authSlice';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const UserChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const astrologer = location.state?.astrologer || {};
  const roomIdFromState = location.state?.roomId;
  const isBotSession = location.state?.startWithBot || (!roomIdFromState && (!astrologer._id));

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [timer, setTimer] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 0, current: 0, targetName: '' });
  const [showRating, setShowRating] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState('');
  const [isBotActive, setIsBotActive] = useState(isBotSession);
  const [showSummary, setShowSummary] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [finalDuration, setFinalDuration] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [viewOnly, setViewOnly] = useState(location.state?.viewOnly || false);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Use roomId from WaitingScreen navigation state or generate a stable one
  const initialRoomId = useMemo(() => {
    return roomIdFromState || (isBotSession && user?._id ? `bot_${user._id}_${Date.now()}` : null);
  }, [roomIdFromState, isBotSession, user?._id]);

  const roomId = initialRoomId;

  useEffect(() => {
    if (!roomId) {
      navigate('/user/astrologers');
      return;
    }

    // Wait for Redux to hydrate the user state
    if (!user || !user._id) return;

    const socket = getSocket();

    socket.emit('join_room', {
      roomId,
      userId: user._id,
      astrologerId: astrologer._id,
      isBot: isBotSession,
      sessionType: 'chat'
    });

    const onSessionCreated = (data) => {
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      if (data.messages?.length > 0) {
        setMessages(data.messages);
      }

      // Auto-send user details if it's a fresh chat
      if (data.isNewSession && !viewOnly) {
        const details = `Hi, here are my details for the consultation:
Name: ${user?.name || 'Not provided'}
DOB: ${user?.dob || 'Not provided'}
Time of Birth: ${user?.timeOfBirth || 'Not provided'}
Place of Birth: ${user?.placeOfBirth || 'Not provided'}
Gender: ${user?.gender || 'Not provided'}

Please analyze my chart based on this information.`;
        
        socket.emit('send_message', { 
          roomId, 
          sessionId: data.sessionId, 
          sender: 'user', 
          text: details 
        });
      }

      if (isBotSession) {
        socket.emit('start_bot_timer', { roomId, sessionId: data.sessionId, userId: user?._id, astrologerId: astrologer._id });
      } else if (!viewOnly) {
        const rate = astrologer.pricing?.chat || astrologer.rate || 5;
        socket.emit('start_timer', { roomId, sessionId: data.sessionId, userId: user?._id, astrologerRate: rate });
      }
    };

    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);

    const onTimerTick = (data) => setTimer(data.seconds);

    const onBotTimeUp = (data) => {
      // Logic removed: Bot ending is now handled completely natively via insufficient_balance
      // to make it completely invisible.
    };
    
    const onHandoffInitiated = () => {
      // Keep handoff entirely silent
    };
    
    // When real astrologer accepts handoff
    const onSessionAccepted = ({ roomId: acceptedRoomId }) => {
      if (acceptedRoomId === roomId) {
        // Silent transition!
        setIsBotActive(false);
        const rate = astrologer.pricing?.chat || astrologer.rate || 5;
        socket.emit('transition_to_real_chat', { roomId, sessionId: sessionIdRef.current, userId: user?._id, astrologerRate: rate });
      }
    };

    const onWalletUpdate = (data) => {
      if (data.newBalance !== undefined) dispatch(updateUser({ wallet: data.newBalance }));
      if (data.freeChatUsed !== undefined) dispatch(updateUser({ freeChatUsed: data.freeChatUsed }));
    };

    const onSessionEnded = (data) => {
      if (sessionEnded) return; // prevent double trigger
      setSessionEnded(true);
      setEndReason(data.reason);
      setFinalDuration(data.durationSeconds || timer);
      setFinalAmount(data.amountDeducted || 0);

      if (data.reason === 'insufficient_balance') {
        setShowLowBalance(true);
        setTimeout(() => {
          setShowLowBalance(false);
          navigate('/user/wallet', { replace: true });
        }, 3000);
      } else {
        // Show summary first, then rating
        setShowSummary(true);
        setTimeout(() => {
          setShowSummary(false);
          if (!hasRated && astrologer._id) {
            setShowRating(true);
          } else {
            navigate('/user/home', { replace: true });
          }
        }, 3000);
      }
    };

    socket.on('session_created', onSessionCreated);
    socket.on('receive_message', onMessage);
    socket.on('timer_tick', onTimerTick);
    socket.on('bot_time_up', onBotTimeUp);
    socket.on('handoff_initiated', onHandoffInitiated);
    socket.on('session_accepted', onSessionAccepted);
    socket.on('wallet_update', onWalletUpdate);
    socket.on('user_joined', onMessage);
    socket.on('session_ended', onSessionEnded);

    return () => {
      socket.off('session_created', onSessionCreated);
      socket.off('receive_message', onMessage);
      socket.off('timer_tick', onTimerTick);
      socket.off('bot_time_up', onBotTimeUp);
      socket.off('handoff_initiated', onHandoffInitiated);
      socket.off('session_accepted', onSessionAccepted);
      socket.off('wallet_update', onWalletUpdate);
      socket.off('session_ended', onSessionEnded);
      socket.off('wallet_low_balance');
      socket.off('user_joined', onMessage);
    };
  }, [roomId, user?._id]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const socket = getSocket();
      socket.emit('send_message', {
        roomId,
        sessionId: sessionIdRef.current || sessionId,
        sender: 'user',
        text: base64String,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reset input
  };

  const handleSend = () => {
    if (!inputText.trim() || showLowBalance || sessionEnded || viewOnly) return;
    const socket = getSocket();
    socket.emit('send_message', { roomId, sessionId, sender: 'user', text: inputText });
    setInputText('');
  };

  const handleEndChat = () => {
    if (sessionEnded || viewOnly) {
      navigate(-1);
      return;
    }
    const socket = getSocket();
    socket.emit('end_session', {
      roomId,
      sessionId: sessionIdRef.current || sessionId,
      userId: user?._id,
      endedBy: 'user',
    });
    // session_ended event will trigger rating modal
  };

  const handleRatingSubmit = async (ratingData) => {
    try {
      if (astrologer._id && !hasRated) {
        await api.post('/user/rate-astrologer', {
          astrologerId: astrologer._id,
          rating: ratingData.rating,
          review: ratingData.review,
        });
        setHasRated(true);
      }
    } catch (e) {
      console.error('Rating error:', e);
    }
    navigate('/user/home', { replace: true });
  };

  const handleRequestCall = (type) => {
    if (sessionEnded) return;
    const rate = type === 'video'
      ? (astrologer.pricing?.videoCall || (astrologer.rate || 5) * 2)
      : (astrologer.pricing?.audioCall || astrologer.rate || 5);

    if ((user?.wallet || 0) < rate * 5) {
      setShortBalanceInfo({ required: rate * 5, current: user?.wallet || 0, targetName: astrologer.name });
      setShowLowBalance(true);
      return;
    }

    setIsConnecting(true);
    setConnectingType(type);

    const socket = getSocket();
    socket.emit('request_session', {
      astrologerId: astrologer.userId?._id || astrologer.userId || astrologer._id,
      userId: user._id,
      userName: user.name,
      type,
    });

    const onAccepted = ({ roomId: callRoomId }) => {
      socket.off('session_rejected', onRejected);
      setIsConnecting(false);
      navigate(`/user/video-room/${callRoomId}`, { state: { astrologer, type } });
    };
    const onRejected = ({ reason }) => {
      socket.off('session_accepted', onAccepted);
      setIsConnecting(false);
      toast.error(`Request declined: ${reason}`);
    };

    socket.once('session_accepted', onAccepted);
    socket.once('session_rejected', onRejected);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans absolute inset-0 z-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleEndChat} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 -ml-1 text-gray-600">
            <FiArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 shadow-sm">
            <img src={astrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name || 'A')}&background=ffedD5&color=f97316`} alt="Astrologer" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-800 text-lg leading-tight truncate">
              {astrologer.name || 'Astrologer'}
            </h1>
            <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              {viewOnly ? 'View Only' : `Active • ${formatTime(timer)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Removed call buttons */}
          {!sessionEnded && !viewOnly && (
            <button onClick={handleEndChat} className="text-[12px] font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
              End Chat
            </button>
          )}
          {(sessionEnded || viewOnly) && (
            <button onClick={() => navigate(-1)} className="text-[12px] font-bold text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg">
              Go Back
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/80">
        <div className="text-center my-4">
          <span className="bg-orange-100/80 text-orange-600 text-[11px] font-bold px-3 py-1 rounded-full">
            {isBotActive ? 'Free Chat Started' : 'Chat Started'}
          </span>
        </div>
        {messages.map((msg, idx) => {
          if (msg.sender === 'system') {
            return (
              <div key={idx} className="text-center my-3">
                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-3 py-1.5 rounded-full border border-gray-200/50">
                  {msg.text}
                </span>
              </div>
            );
          }
          const isMe = msg.sender === 'user';
          return (
            <div key={idx} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-4 bg-gray-200 border border-orange-100">
                  <img src={astrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name || 'A')}&background=ffedD5&color=f97316`} alt="Astro" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <div className={`${isMe ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100'} px-4 py-2.5 rounded-2xl shadow-sm text-[14px] max-w-[260px]`}>
                  {msg.text && msg.text.startsWith('data:image/') ? (
                    <img src={msg.text} alt="attachment" className="max-w-full rounded-md mt-1 mb-1 max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.text)} />
                  ) : (
                    (msg.text || '').split(/(\*\*.*?\*\*)/g).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
                    })
                  )}
                </div>
                <span className={`text-[10px] text-gray-400 mt-1 font-bold block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-3 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={showLowBalance || sessionEnded || viewOnly}
            className="w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-50 rounded-full hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <FiPaperclip size={20} />
          </button>
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:border-orange-300 focus-within:bg-white transition-all shadow-inner relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows="1"
              placeholder={sessionEnded || viewOnly ? 'Session ended' : showLowBalance ? 'Recharge to continue...' : 'Type your message...'}
              disabled={showLowBalance || sessionEnded || viewOnly}
              className="w-full bg-transparent px-4 py-3 outline-none text-sm resize-none max-h-32 min-h-[44px] disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || showLowBalance || sessionEnded || viewOnly}
            className="w-11 h-11 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 disabled:bg-gray-300 disabled:shadow-none transition-colors shadow-md shadow-orange-500/30 shrink-0"
          >
            <FiSend className="-ml-0.5 mt-0.5" size={18} />
          </button>
        </div>
      </footer>

      <LowBalanceModal
        isOpen={showLowBalance}
        onClose={() => setShowLowBalance(false)}
        requiredAmount={shortBalanceInfo.required}
        currentBalance={shortBalanceInfo.current || user?.wallet || 0}
        targetName={shortBalanceInfo.targetName || astrologer.name}
        redirectTo="/user/wallet"
        replaceHistory={true}
      />

      {/* Incoming call request loading overlay */}
      {isConnecting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center max-w-sm w-full text-center shadow-2xl">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">⏳</div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm">
              Waiting for <span className="font-bold text-gray-800">{astrologer.name}</span> to accept your {connectingType} call...
            </p>
            <button
              onClick={() => {
                setIsConnecting(false);
                const socket = getSocket();
                socket.emit('cancel_session_request', {
                  astrologerId: astrologer.userId?._id || astrologer.userId || astrologer._id,
                  userId: user._id,
                });
              }}
              className="mt-4 text-red-500 font-bold text-sm border border-red-200 px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center max-w-sm w-full text-center shadow-2xl animate-scale-in">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Session Ended</h3>
            <p className="text-gray-500 text-sm mb-4">Reason: {endReason}</p>
            <div className="bg-orange-50 w-full rounded-2xl p-4 mb-6 border border-orange-100">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 font-medium">Duration</span>
                <span className="font-bold text-gray-900">{formatTime(finalDuration || timer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Amount Deducted</span>
                <span className="font-bold text-orange-500">
                  {isBotSession ? '₹0 (Free)' : `₹${finalAmount > 0 ? finalAmount.toFixed(2) : (((finalDuration || timer) / 60) * (astrologer.pricing?.chat || astrologer.rate || 5)).toFixed(2)}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowSummary(false);
                if (!hasRated && astrologer._id) {
                  setShowRating(true);
                } else {
                  navigate('/user/home', { replace: true });
                }
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
            >
              Rate your experience
            </button>
          </div>
        </div>
      )}

      <RateAstrologerModal
        isOpen={showRating}
        onClose={() => navigate('/user/home')}
        astrologer={astrologer}
        onSubmit={handleRatingSubmit}
      />
    </div>
  );
};

export default UserChatRoom;

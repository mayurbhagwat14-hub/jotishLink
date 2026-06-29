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
  const [isTyping, setIsTyping] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Refs to mirror state for use inside event listener closures (popstate/beforeunload)
  const sessionEndedRef = useRef(false);
  const viewOnlyRef = useRef(viewOnly);
  const historyGuardPushedRef = useRef(false);

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

    const onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setIsTyping(false);
      setIsUploading(false);
    };

    const onMessageError = (data) => {
      toast.error(data.error || 'Failed to send message');
      setIsUploading(false);
    };

    const onTimerTick = (data) => setTimer(data.seconds);

    const onUserTyping = () => setIsTyping(true);
    const onUserStoppedTyping = () => setIsTyping(false);

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
    socket.on('user_typing', onUserTyping);
    socket.on('user_stopped_typing', onUserStoppedTyping);
    socket.on('message_error', onMessageError);

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
      socket.off('user_typing', onUserTyping);
      socket.off('user_stopped_typing', onUserStoppedTyping);
      socket.off('message_error', onMessageError);
    };
  }, [roomId, user?._id]);

  const fileInputRef = useRef(null);

  // Keep refs in sync with state so popstate/beforeunload closures have current values
  useEffect(() => {
    sessionEndedRef.current = sessionEnded;
  }, [sessionEnded]);

  useEffect(() => {
    viewOnlyRef.current = viewOnly;
  }, [viewOnly]);

  // ── Phase 1: Navigation guard (back button / in-app navigation)
  // ── Phase 2: beforeunload guard (tab close / refresh / app kill)
  useEffect(() => {
    const isSessionLive = () => !sessionEndedRef.current && !viewOnlyRef.current;

    // Only activate guard if session is currently live
    if (!isSessionLive()) return;

    // Push a dummy history entry so the first back-press is intercepted
    // instead of immediately navigating away from the chat
    window.history.pushState({ chatGuard: true }, '');
    historyGuardPushedRef.current = true;

    const handlePopState = (e) => {
      if (!isSessionLive()) {
        // Session already ended — allow normal navigation, clean up
        historyGuardPushedRef.current = false;
        return;
      }
      // Re-push the dummy state to cancel the back navigation
      window.history.pushState({ chatGuard: true }, '');
      // Show the confirmation modal
      setShowLeaveConfirm(true);
    };

    // Phase 2: beforeunload — native browser "Leave site?" prompt
    // NOTE: Modern browsers ignore custom text and show a generic message.
    // This is NOT 100% reliable on mobile Safari, PWAs, or force-killed apps.
    // Phase 3 (backend grace-period) is the real safety net for those cases.
    const handleBeforeUnload = (e) => {
      if (!isSessionLive()) return;
      e.preventDefault();
      e.returnValue = '';

      // Best-effort: try to emit end_session so backend can start cleanup.
      // Socket.IO may or may not flush this before the page unloads.
      try {
        const socket = getSocket();
        socket.emit('end_session', {
          roomId,
          sessionId: sessionIdRef.current,
          userId: user?._id,
          endedBy: 'user',
        });
      } catch (err) {
        // Silently fail — backend grace-period will handle it
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Pop the dummy history entry if it's still there, so we don't
      // leave the user's back-navigation stack polluted after cleanup.
      // Only do this if the session ended normally (not if component unmounts
      // because the user navigated away via "End & Leave").
      if (historyGuardPushedRef.current && sessionEndedRef.current) {
        historyGuardPushedRef.current = false;
        window.history.back();
      }
    };
  }, [roomId, user?._id, viewOnly, sessionEnded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      toast.error('Video upload is not supported, only images are allowed');
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      e.target.value = null;
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, JPG, and PNG images are allowed');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null; // Reset input
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (sessionEnded || viewOnly) return;
    
    const socket = getSocket();
    socket.emit('typing', { roomId, sender: 'user' });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId, sender: 'user' });
    }, 1500);
  };

  const handleSend = () => {
    if ((!inputText.trim() && !previewImage) || showLowBalance || sessionEnded || viewOnly) return;
    const socket = getSocket();
    
    if (previewImage) {
      setIsUploading(true);
      socket.emit('send_message', { 
        roomId, 
        sessionId: sessionIdRef.current || sessionId, 
        sender: 'user', 
        text: previewImage, 
        type: 'image' 
      });
      setPreviewImage(null);
    }
    
    if (inputText.trim()) {
      socket.emit('send_message', { 
        roomId, 
        sessionId: sessionIdRef.current || sessionId, 
        sender: 'user', 
        text: inputText 
      });
    }

    socket.emit('stop_typing', { roomId, sender: 'user' });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
            <p className="text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
              {isTyping ? (
                <span className="text-green-500 lowercase animate-pulse tracking-normal text-[13px]">typing...</span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  <span className="text-gray-500">{viewOnly ? 'View Only' : `Active • ${formatTime(timer)}`}</span>
                </>
              )}
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
          <span className="bg-orange-100/80 text-[#e55923] text-[11px] font-bold px-3 py-1 rounded-full">
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
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                <div className={`${isMe ? 'bg-[#fa6830] text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'} px-4 py-3 rounded-2xl shadow-sm text-[15px] text-left inline-block w-fit relative`}>
                  {msg.type === 'image' || (msg.text && msg.text.startsWith('data:image/')) ? (
                    <img 
                      src={msg.type === 'image' ? msg.imageUrl : msg.text} 
                      alt="attachment" 
                      className="max-w-full rounded-md mt-1 mb-1 max-h-48 object-cover cursor-pointer" 
                      onClick={() => setViewingImage(msg.type === 'image' ? msg.imageUrl : msg.text)} 
                    />
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
        {isUploading && (
          <div className="flex items-end gap-2 flex-row-reverse opacity-70">
            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
              <div className="bg-[#fa6830] text-white rounded-br-sm px-4 py-3 rounded-2xl shadow-sm text-[15px] flex items-center justify-center min-w-[100px] min-h-[50px]">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-3 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex flex-col">
        {previewImage && (
          <div className="mb-3 relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/jpeg, image/png, image/jpg" 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={showLowBalance || sessionEnded || viewOnly || isUploading}
            className="w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-50 rounded-full hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <FiPaperclip size={20} />
          </button>
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:border-orange-300 focus-within:bg-white transition-all shadow-inner relative">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows="1"
              placeholder={sessionEnded || viewOnly ? 'Session ended' : showLowBalance ? 'Recharge to continue...' : 'Type your message...'}
              disabled={showLowBalance || sessionEnded || viewOnly || isUploading}
              className="w-full bg-transparent px-4 py-3 outline-none text-sm resize-none max-h-32 min-h-[44px] disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !previewImage) || showLowBalance || sessionEnded || viewOnly || isUploading}
            className="w-11 h-11 bg-[#fa6830] text-white rounded-full flex items-center justify-center hover:bg-[#e55923] disabled:bg-gray-300 disabled:shadow-none transition-colors shadow-md shadow-orange-500/30 shrink-0"
          >
            <FiSend className="-ml-0.5 mt-0.5" size={18} />
          </button>
        </div>
      </footer>

      {viewingImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 touch-none"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <img 
            src={viewingImage} 
            alt="Fullscreen view" 
            className="max-w-full max-h-full object-contain select-none cursor-default"
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      )}

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
              <div className="absolute inset-0 rounded-full border-4 border-[#fa6830] border-t-transparent animate-spin"></div>
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
                <span className="font-bold text-[#fa6830]">
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
              className="w-full py-3 bg-[#fa6830] hover:bg-[#e55923] text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
            >
              Rate your experience
            </button>
          </div>
        </div>
      )}

      {/* Leave Chat Confirmation Modal — Phase 1 navigation guard */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-scale-in pb-[env(safe-area-inset-bottom)]">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-lg font-bold shrink-0">⚠️</div>
              <div>
                <h3 className="font-bold text-gray-900 text-[16px]">Leave this chat?</h3>
              </div>
            </div>

            <div className="p-5">
              <p className="text-[14px] text-gray-700 font-medium leading-relaxed">
                Leaving will end the session and stop all charges.
              </p>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  // Reuse existing handleEndChat which emits 'end_session'.
                  // The 'session_ended' event handler will then navigate away
                  // via the summary/rating flow.
                  handleEndChat();
                }}
                className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                End & Leave
              </button>
            </div>
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

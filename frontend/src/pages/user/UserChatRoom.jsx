import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiPaperclip, FiSend, FiVideo, FiPhone } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import getSocket from '../../socket/socketManager';
import toast from 'react-hot-toast';
import LowBalanceModal from '../../components/LowBalanceModal';
import RateAstrologerModal from '../../components/RateAstrologerModal';
import { updateUser } from '../../store/slices/authSlice';
import api from '../../api/axios';

let socket;

const UserChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const astrologer = location.state?.astrologer || { name: 'Astrologer', isBot: true };
  const isBotSession = astrologer.isBot || !astrologer._id;

  const [messages, setMessages] = useState(() => location.state?.messages || []);
  const [inputText, setInputText] = useState('');
  const [timer, setTimer] = useState(0); // in seconds
  
  const [isBotActive, setIsBotActive] = useState(location.state?.startWithBot || isBotSession);
  const [sessionId, setSessionId] = useState(null);
  
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [finalDuration, setFinalDuration] = useState(0);
  const [shortBalanceInfo, setShortBalanceInfo] = useState({ required: 355, current: 0, targetName: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState('');
  
  const messagesEndRef = useRef(null);
  const viewOnly = location.state?.viewOnly || false;
  
  const [roomId] = useState(() => {
    if (location.state?.roomId) return location.state.roomId;
    if (isBotSession) return `room_${user?._id}_bot_${Date.now()}`;
    return null;
  });

  useEffect(() => {
    if (!roomId && !isBotSession) {
      navigate('/user/astrologers');
    }
  }, [roomId, isBotSession, navigate]);

  useEffect(() => {
    if (viewOnly) return; // Do not connect socket in viewOnly mode

    // If starting a free bot session, mark it immediately in frontend store as used
    if (isBotActive) {
      dispatch(updateUser({ hasUsedFreeChat: true }));
    }

    // Initialize Socket
    socket = getSocket();

    // Join room, letting the server know if we are starting with the AI bot
    socket.emit('join_room', { roomId, userId: user?._id, astrologerId: astrologer._id, isBot: isBotActive });

    socket.on('session_created', (data) => {
      setSessionId(data.sessionId);
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }

      // Automatically send user details if it's a completely new chat (only bot's welcome message exists)
      if (data.messages && data.messages.length === 1) {
        const detailsBlock = `My Details:
Name: ${user?.name || 'Not provided'}
Gender: ${user?.gender || 'Not provided'}
DOB: ${user?.dob || 'Not provided'}
Time of Birth: ${user?.timeOfBirth || 'Not provided'}
Place of Birth: ${user?.placeOfBirth || 'Not provided'}
Problem area: General (Please ask your question)`;

        socket.emit('send_message', {
          roomId,
          sessionId: data.sessionId,
          sender: 'user',
          text: detailsBlock
        });
      }
      
      // Start the appropriate timer after the session is created in the DB
      if (isBotActive) {
        socket.emit('start_bot_timer', { roomId, sessionId: data.sessionId, userId: user?._id });
      } else {
        socket.emit('start_timer', { roomId, sessionId: data.sessionId, userId: user?._id, astrologerRate: astrologer.rate || 5 });
      }
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('timer_tick', (data) => {
      setTimer(data.seconds);
    });

    socket.on('bot_time_up', (data) => {
      // End the free chat session. Don't seamlessly transition.
      setIsBotActive(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: `Free chat period ended. To continue talking with a real astrologer, please initiate a new paid chat request.`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      // End the socket session
      socket.emit('end_session', { roomId, sessionId: data.sessionId, userId: user?._id });
    });

    socket.on('wallet_update', (data) => {
      // Deduct wallet locally
      dispatch(updateUser({ wallet: data.newBalance }));
    });

    socket.on('session_ended', ({ reason, durationSeconds }) => {
      setSessionEnded(true);
      setEndReason(reason);
      setFinalDuration(durationSeconds);
      // Show session summary modal for 3 seconds then show rating modal
      setShowSummary(true);
      setTimeout(() => {
        setShowSummary(false);
        setShowRating(true);
      }, 3000);
    });

    return () => {
      if (socket) {
        socket.off('session_created');
        socket.off('receive_message');
        socket.off('timer_tick');
        socket.off('bot_time_up');
        socket.off('wallet_update');
        socket.off('session_ended');
      }
    };
  }, [user?._id, astrologer._id, roomId, isBotActive, viewOnly]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (viewOnly || !inputText.trim() || showLowBalance) return;

    socket.emit('send_message', {
      roomId,
      sessionId,
      sender: 'user',
      text: inputText
    });

    setInputText('');
  };

  const handleEndChat = () => {
    const socket = getSocket();
    socket.emit('end_session', {
      roomId,
      sessionId,
      userId: user?._id,
      endedBy: 'user'
    });
    // Don't navigate immediately — wait for 'session_ended' event
  };

  const handleRequestCall = async (type) => {
    const rate = type === 'video'
      ? (astrologer.pricing?.videoCall || (astrologer.rate ? astrologer.rate * 2 : 10))
      : (astrologer.pricing?.audioCall || astrologer.rate || 5);
      
    const requiredAmount = rate * 5;
    const walletBalance = user?.wallet || 0;

    if (walletBalance < requiredAmount) {
      setShortBalanceInfo({ required: requiredAmount, current: walletBalance, targetName: astrologer.name });
      setShowLowBalance(true);
      return;
    }

    try {
      const res = await api.post('/calls/request', { astrologerId: astrologer._id || astrologer.userId });
      const { callId } = res.data.data.callSession;

      navigate('/user/waiting', {
        state: {
          astrologer: astrologer,
          type: type,
          callId
        }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate call');
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans absolute inset-0 z-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={viewOnly ? () => navigate(-1) : handleEndChat}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1 text-gray-600"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 shadow-sm">
            <img src={astrologer.avatar || 'https://ui-avatars.com/api/?name=Astro&background=ffedD5&color=f97316'} alt="Astrologer" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">{astrologer.name}</h3>
            <p className="text-[11px] text-green-500 font-bold">
              {isBotActive ? 'Online' : `Active • ${formatTime(timer)}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {viewOnly ? (
            <button onClick={() => navigate(-1)} className="ml-1 text-[12px] font-bold text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              Go Back
            </button>
          ) : (
            <>
              {!isBotActive && (
                <>
                  <button onClick={() => handleRequestCall('video')} className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                     <FiVideo size={18} />
                  </button>
                  <button onClick={() => handleRequestCall('audio')} className="w-9 h-9 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors">
                     <FiPhone size={18} />
                  </button>
                </>
              )}
              <button onClick={handleEndChat} className="ml-1 text-[12px] font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                End Chat
              </button>
            </>
          )}
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/80">
        <div className="text-center my-4">
          <span className="bg-orange-100/80 text-orange-600 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
            Chat Started
          </span>
        </div>

        {messages.map((msg, idx) => {
          if (msg.sender === 'system') {
            return (
              <div key={idx} className="text-center my-3 select-none flex justify-center w-full">
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
                   <img src={astrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name)}&background=ffedD5&color=f97316`} alt="Astro" className="w-full h-full object-cover" />
                 </div>
               )}
               <div>
                 <div className={`${isMe ? 'bg-orange-500 text-white rounded-br-sm shadow-orange-500/20' : 'bg-white text-gray-700 rounded-bl-sm border-gray-100'} px-4 py-2.5 rounded-2xl shadow-sm text-[14px] max-w-[260px] border`}>
                   {msg.text}
                 </div>
                 <span className={`text-[10px] text-gray-400 mt-1 font-bold block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                   {msg.time}
                 </span>
               </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input */}
      <footer className="p-3 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-end gap-2">
          <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors shrink-0 bg-gray-50 rounded-full">
            <FiPaperclip size={20} />
          </button>
          
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:border-orange-300 focus-within:bg-white transition-all shadow-inner relative">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows="1"
              placeholder={viewOnly ? "Chat has ended." : showLowBalance ? "Recharge to continue..." : "Type your message..."} 
              disabled={viewOnly || showLowBalance}
              className="w-full bg-transparent px-4 py-3 outline-none text-sm resize-none max-h-32 min-h-[44px] disabled:opacity-50"
            ></textarea>
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || showLowBalance}
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
        currentBalance={shortBalanceInfo.current}
        targetName={shortBalanceInfo.targetName}
        redirectTo={`/user/chat`}
      />

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
                <span className="font-bold text-orange-500">₹{Math.floor((finalDuration || timer) / 60) * (astrologer.pricing?.chat || astrologer.rate || 5)}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowSummary(false);
                setShowRating(true);
              }}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
            >
              Rate your experience
            </button>
          </div>
        </div>
      )}      <RateAstrologerModal 
        isOpen={showRating}
        onClose={() => navigate('/user/home')}
        astrologer={astrologer}
        onSubmit={(ratingData) => {
          console.log("Rating submitted", ratingData);
          localStorage.setItem(`rated_${astrologer._id}`, 'true');
          navigate('/user/home');
        }}
      />
    </div>
  );
};

export default UserChatRoom;

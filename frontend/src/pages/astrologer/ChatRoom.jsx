import { useState, useEffect, useRef } from 'react';
import { FiVideo, FiPhone, FiPaperclip, FiSend, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useSelector } from 'react-redux';

const ChatRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: sessionId } = useParams();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [timer, setTimer] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { user: astrologer } = useSelector((state) => state.auth);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const socket = io('http://localhost:5000', { auth: { token } });
        socketRef.current = socket;

        // If ID is a 24-char hex string, it's a MongoDB sessionId
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(sessionId);

        if (sessionId === 'new' && !location.state?.roomId) {
          navigate('/astrologer/chats');
          return;
        }

        let roomIdToJoin = location.state?.roomId || sessionId; 
        let userIdForJoin = location.state?.userId || '';
        let astrologerIdForJoin = astrologer?._id || '';

        if (isMongoId) {
          // Fetch existing session history
          const { data } = await api.get(`/chat/${sessionId}/messages`);
          setSessionData(data.data.session);
          setMessages(data.data.session.messages || []);
          roomIdToJoin = data.data.session.roomId;
          userIdForJoin = data.data.session.userId._id;
          astrologerIdForJoin = data.data.session.astrologerId._id;
        }

        socket.emit('join_room', { 
          roomId: roomIdToJoin, 
          userId: userIdForJoin, 
          astrologerId: astrologerIdForJoin,
          isBot: false 
        });

        socket.on('session_created', ({ sessionId: newSessionId, messages: loadedMessages }) => {
          // Server created or found the session
          if (!isMongoId) {
             setSessionData({ _id: newSessionId, roomId: roomIdToJoin });
             setMessages(loadedMessages || []);
          }
        });

        socket.on('receive_message', (msg) => {
          setMessages(prev => [...prev, msg]);
        });

        socket.on('timer_tick', ({ seconds }) => {
          setTimer(seconds);
        });

        socket.on('session_ended', (data) => {
          if (data?.reason === 'user_ended') {
            alert('Chat has been ended by the User.');
          } else if (data?.reason === 'insufficient_balance') {
            alert('Chat ended due to low user balance.');
          } else if (data?.reason !== 'astrologer_ended') {
            alert('Session has ended.');
          }
          navigate('/astrologer/chats');
        });

      } catch (err) {
        console.error('Failed to load session:', err);
        alert('Could not load chat session');
        navigate('/astrologer/chats');
      }
    };
    
    loadSession();
    
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [sessionId, navigate]);

  const handleSend = () => {
    if (!inputText.trim() || !sessionData) return;
    
    socketRef.current.emit('send_message', {
      roomId: sessionData.roomId,
      sessionId: sessionData._id,
      sender: 'astrologer',
      text: inputText.trim()
    });
    
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndChat = () => {
    if (socketRef.current && sessionData) {
      socketRef.current.emit('end_session', { 
        roomId: sessionData.roomId, 
        sessionId: sessionData._id, 
        userId: location.state?.userId || '', 
        endedBy: 'astrologer' 
      });
    }
    navigate('/astrologer/chats');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!sessionData) return <div className="flex h-screen items-center justify-center">Loading session...</div>;

  const userName = location.state?.userName || sessionData.userId?.name || 'User';
  const userAvatar = sessionData.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=ffedD5&color=f97316`;
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans absolute inset-0 z-50">
      
      {/* Chat Header */}
      <header className="h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1 text-gray-600"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
            <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">{userName}</h3>
            <p className="text-xs text-green-500 font-bold">Session Active • {formatTime(timer)}</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          <button className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
             <FiVideo size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors">
             <FiPhone size={18} />
          </button>
          <button onClick={handleEndChat} className="ml-2 text-[12px] font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0">
            End Chat
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/80">
        {messages.map((msg, index) => {
          const isMe = msg.sender === 'astrologer';
          const isSystem = msg.sender === 'system' || msg.sender === 'bot';

          if (isSystem) {
            return (
              <div key={index} className="text-center my-4">
                <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={index} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
               {!isMe && (
                 <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-4 bg-gray-200">
                   <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                 </div>
               )}
               <div>
                 <div className={`${isMe ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100'} px-4 py-2.5 rounded-2xl shadow-sm text-[14px] max-w-[260px] whitespace-pre-wrap break-words`}>
                   {msg.text}
                 </div>
                 <span className={`text-[10px] text-gray-400 mt-1 font-bold block ${isMe ? 'text-right mr-1' : 'ml-1'}`}>{msg.time}</span>
               </div>
            </div>
          );
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
              rows="1"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your guidance..." 
              className="w-full bg-transparent px-4 py-3 outline-none text-sm resize-none max-h-32 min-h-[44px]"
            ></textarea>
          </div>
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/30 shrink-0 disabled:opacity-50"
          >
            <FiSend className="-ml-0.5 mt-0.5" size={18} />
          </button>
        </div>
      </footer>

    </div>
  );
};

export default ChatRoom;

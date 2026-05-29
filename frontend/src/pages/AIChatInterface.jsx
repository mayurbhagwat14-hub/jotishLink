import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FiSend, FiArrowLeft, FiMoreVertical, FiClock, FiShield } from 'react-icons/fi';

const socket = io('/', {
  autoConnect: false
});

const AIChatInterface = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [remainingTime, setRemainingTime] = useState(60);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.connect();
    
    // Simulate user ID
    socket.emit('start_free_chat', { userId: '123' });

    socket.on('chat_started', (data) => {
      setMessages([{ text: data.message, sender: 'ai', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    });

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, { text: data.text, sender: 'ai', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    });

    socket.on('time_update', (data) => {
      setRemainingTime(data.remainingSeconds);
    });

    socket.on('chat_blocked', (data) => {
      setIsBlocked(true);
      setShowRechargeModal(true);
      setMessages((prev) => [...prev, { text: data.message, sender: 'system', isAlert: true }]);
    });

    return () => {
      socket.off('chat_started');
      socket.off('receive_message');
      socket.off('time_update');
      socket.off('chat_blocked');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isBlocked) return;

    const newMsg = { text: input, sender: 'user', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, newMsg]);
    
    socket.emit('send_message', { text: input });
    setInput('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl">
      
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition">
            <FiArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="https://i.pravatar.cc/150?u=bot" alt="AI Astrologer" className="w-10 h-10 rounded-full border border-orange-200" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight text-[15px]">AI Astrologer</h2>
              <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1">
                Online <span className="text-gray-400 font-normal">| Vedic & Tarot</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isBlocked && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${remainingTime < 20 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-orange-50 text-orange-600'}`}>
              <FiClock /> {formatTime(remainingTime)}
            </div>
          )}
          <button className="p-2 rounded-full hover:bg-gray-50">
            <FiMoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="bg-yellow-50 py-2 px-4 flex items-center justify-center gap-2 text-xs text-yellow-800 border-b border-yellow-100">
        <FiShield size={14} className="text-yellow-600" /> 100% Private & Confidential
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f5ef]">
        <div className="text-center text-xs text-gray-400 my-4 border-b border-gray-200 pb-2 mx-8">
          Chat started at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.isAlert ? (
              <div className="w-full text-center my-4">
                <span className="bg-red-100 text-red-800 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                msg.sender === 'user' 
                  ? 'bg-orange-400 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}>
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <span className={`text-[10px] absolute -bottom-4 ${msg.sender === 'user' ? 'right-1 text-gray-500' : 'left-1 text-gray-400'}`}>
                  {msg.time}
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-200 pb-safe">
        <form onSubmit={handleSend} className="flex gap-2 items-center bg-gray-50 rounded-full pr-1.5 pl-4 py-1.5 border border-gray-200 focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-200 transition">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBlocked}
            placeholder={isBlocked ? "Chat disabled. Please recharge." : "Type your message..."}
            className="flex-1 bg-transparent outline-none text-[15px] text-gray-800 placeholder-gray-400 py-1.5"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isBlocked}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              !input.trim() || isBlocked 
                ? 'bg-gray-200 text-gray-400' 
                : 'bg-orange-400 text-white hover:bg-orange-500 hover:scale-105 active:scale-95 shadow-md'
            }`}
          >
            <FiSend size={16} className={input.trim() && !isBlocked ? 'ml-1' : ''} />
          </button>
        </form>
      </div>

      {/* Recharge Modal Overlay */}
      {showRechargeModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100 flex flex-col pb-safe">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
               <div className="flex items-center gap-2">
                 <h3 className="text-[17px] font-bold text-gray-900">Low wallet balance!</h3>
                 <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-700 border border-gray-200">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    ₹ 0
                 </div>
               </div>
               <button onClick={() => navigate(-1)} className="text-gray-400 bg-gray-100 rounded-full p-1 hover:bg-gray-200 transition">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
               <div className="bg-[#fafafa] rounded-2xl p-4 mb-5">
                 <p className="font-semibold text-[14px] text-gray-900 mb-1">Minimum balance required: ₹20 (for 4 minutes)</p>
                 <p className="text-[13px] text-gray-500">You need ₹20 more to start chat with AI Astrologer</p>
               </div>

               {/* Grid */}
               <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { amt: 10, extra: '100% Extra' },
                    { amt: 50, extra: '100% Extra', selected: true },
                    { amt: 100, extra: '100% Extra', popular: true },
                    { amt: 200, extra: '100% Extra' },
                    { amt: 500, extra: '50% Extra' },
                    { amt: 1000, extra: '5% Extra' },
                    { amt: 2000, extra: '10% Extra' },
                    { amt: 3000, extra: '10% Extra' },
                  ].map((plan, i) => (
                    <div key={i} className={`relative rounded-xl border flex flex-col items-center justify-center pt-3 pb-0 overflow-hidden cursor-pointer ${plan.selected ? 'border-orange-400 bg-orange-50/30' : 'border-gray-200 bg-white'}`}>
                       {plan.popular && (
                         <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-orange-400 text-[7px] font-bold px-2 py-0.5 rounded-b text-black whitespace-nowrap z-10">
                           Most Popular
                         </div>
                       )}
                       <span className="font-bold text-[14px] text-gray-900 mb-2 mt-1">₹ {plan.amt}</span>
                       <div className="w-full text-center text-[8px] font-bold py-1 bg-[#e8f7f2] text-[#3eb382]">
                         {plan.extra}
                       </div>
                    </div>
                  ))}
               </div>

               <button onClick={() => navigate('/store')} className="w-full bg-orange-400 hover:bg-orange-500 text-black font-bold py-3.5 rounded-xl transition active:scale-95 text-[15px]">
                 Proceed
               </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default AIChatInterface;

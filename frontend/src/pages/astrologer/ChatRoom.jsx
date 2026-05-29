import { FiVideo, FiPhone, FiPaperclip, FiSend, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

const ChatRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data based on ID
  const userName = id === '1' ? 'Vikram Singh' : 'Anjali Desai';
  
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
            <img src={id === '1' ? "https://i.pravatar.cc/150?u=user3" : "https://i.pravatar.cc/150?u=user4"} alt="User" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 leading-tight">{userName}</h3>
            <p className="text-xs text-green-500 font-bold">Session Active • 14:20 remaining</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
             <FiVideo size={18} />
          </button>
          <button className="w-9 h-9 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors">
             <FiPhone size={18} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/80">
        <div className="text-center my-4">
          <span className="bg-orange-100/80 text-orange-600 text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
            Chat Started at 12:30 PM
          </span>
        </div>
        
        {/* User Message */}
        <div className="flex items-end gap-2">
           <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-4 bg-gray-200">
             <img src={id === '1' ? "https://i.pravatar.cc/150?u=user3" : "https://i.pravatar.cc/150?u=user4"} alt="User" />
           </div>
           <div>
             <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm text-[14px] text-gray-700 max-w-[260px] border border-gray-100">
               Hello Astro! I wanted to ask about my career prospects. I've been feeling stuck in my current job.
             </div>
             <span className="text-[10px] text-gray-400 mt-1 ml-1 font-bold">12:31 PM</span>
           </div>
        </div>

        {/* Astrologer Message */}
        <div className="flex items-end gap-2 flex-row-reverse">
           <div>
             <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-md shadow-orange-500/20 text-[14px] max-w-[260px]">
               Hello {userName.split(' ')[0]}. I can certainly help you with that. Can you please confirm your exact time of birth?
             </div>
             <div className="text-[10px] text-gray-400 mt-1 mr-1 font-bold text-right">12:32 PM</div>
           </div>
        </div>
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
              placeholder="Type your guidance..." 
              className="w-full bg-transparent px-4 py-3 outline-none text-sm resize-none max-h-32 min-h-[44px]"
            ></textarea>
          </div>
          
          <button className="w-11 h-11 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/30 shrink-0">
            <FiSend className="-ml-0.5 mt-0.5" size={18} />
          </button>
        </div>
      </footer>

    </div>
  );
};

export default ChatRoom;

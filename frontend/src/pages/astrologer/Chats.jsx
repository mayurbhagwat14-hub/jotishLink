import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FiMessageSquare, FiCheck, FiX, FiLoader } from 'react-icons/fi';

const Chats = () => {
  const [activeTab, setActiveTab] = useState('Requests');
  const [requestStatus, setRequestStatus] = useState('pending'); // 'pending', 'waiting_payment', 'accepted'

  const tabs = [
    { id: 'Requests', label: 'Requests', count: requestStatus !== 'accepted' ? 1 : 0 },
    { id: 'Active', label: 'Active', count: requestStatus === 'accepted' ? 2 : 1 },
  ];

  const handleAccept = () => {
    setRequestStatus('waiting_payment');
    // Simulate user paying after 3 seconds
    setTimeout(() => {
      setRequestStatus('accepted');
      setActiveTab('Active');
    }, 3000);
  };

  return (
    <div className="p-4 animate-fade-in mb-6 flex flex-col h-[calc(100vh-130px)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
        <p className="text-sm text-gray-500 font-medium">Manage your live chat sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        
        {/* REQUESTS PHASE */}
        {activeTab === 'Requests' && requestStatus !== 'accepted' && (
          <div className="animate-fade-in">
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm mb-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl"></div>
              
              <div className="flex items-start gap-4 mb-3 relative z-10">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                  <img src="https://i.pravatar.cc/150?u=user7" alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-sm truncate">Karan D.</h3>
                    <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-full uppercase">New Request</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">Wants to chat about relationship compatibility.</p>
                </div>
              </div>
              
              <div className="flex gap-2 relative z-10 mt-2">
                 {requestStatus === 'pending' ? (
                   <>
                     <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs border border-gray-200">
                       <FiX size={14} /> Decline
                     </button>
                     <button 
                       onClick={handleAccept}
                       className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors text-xs"
                     >
                       <FiCheck size={14} /> Accept Request
                     </button>
                   </>
                 ) : (
                   <div className="w-full bg-orange-50 text-orange-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs border border-orange-100 animate-pulse">
                     <FiLoader size={14} className="animate-spin" /> Waiting for User Payment...
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'Requests' && requestStatus === 'accepted' && (
          <div className="animate-fade-in flex flex-col items-center justify-center h-40 text-gray-400">
             <FiMessageSquare size={32} className="mb-2 opacity-50" />
             <p className="text-sm font-medium">No pending requests.</p>
          </div>
        )}

        {/* ACTIVE PHASE */}
        {activeTab === 'Active' && (
          <div className="animate-fade-in space-y-3">
            
            {requestStatus === 'accepted' && (
              <Link to="/astrologer/chat/2" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 hover:shadow-md transition-all shadow-sm relative overflow-hidden group block animate-fade-in">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                    <img src="https://i.pravatar.cc/150?u=user7" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-gray-800 text-sm truncate">Karan D.</h3>
                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">Payment Received</span>
                  </div>
                  <p className="text-xs text-orange-500 font-bold truncate">Start typing...</p>
                </div>
              </Link>
            )}

            <Link to="/astrologer/chat/1" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 hover:shadow-md transition-all shadow-sm relative overflow-hidden group block">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-colors"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                  <img src="https://i.pravatar.cc/150?u=user3" alt="User" className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-gray-800 text-sm truncate">Vikram Singh</h3>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">Ongoing</span>
                </div>
                <p className="text-xs text-gray-500 truncate font-medium">I wanted to ask about my career...</p>
              </div>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Chats;

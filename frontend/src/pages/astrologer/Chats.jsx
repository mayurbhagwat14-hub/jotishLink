import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiMessageSquare, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import getSocket from '../../socket/socketManager';
import { removeIncomingRequest, addActiveSession, removeActiveSession } from '../../store/slices/astrologerSlice';

const Chats = () => {
  const [activeTab, setActiveTab] = useState('Requests');
  const [processingId, setProcessingId] = useState(null);

  const { incomingRequests, activeSessions } = useSelector((state) => state.astrologer);
  const { token } = useSelector((state) => state.astrologerAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    const onSessionEnded = (data) => {
      if (data.roomId) {
        dispatch(removeActiveSession(data.roomId));
        // toast.success('Debug: Removed ' + data.roomId);
      }
    };
    socket.on('session_ended', onSessionEnded);
    socket.on('call_ended', onSessionEnded);
    
    return () => {
      socket.off('session_ended', onSessionEnded);
      socket.off('call_ended', onSessionEnded);
    };
  }, [dispatch]);

  const chatRequests = incomingRequests.filter(req => req.type === 'chat');
  const chatSessions = activeSessions.filter(req => req.type === 'chat');

  const tabs = [
    { id: 'Requests', label: 'Requests', count: chatRequests.length },
    { id: 'Active', label: 'Active', count: chatSessions.length },
  ];

  const handleAccept = (req) => {
    const socket = getSocket();
    socket.emit('accept_session', { roomId: req.roomId, userSocketId: req.userSocketId });
    dispatch(removeIncomingRequest(req.roomId));
    dispatch(addActiveSession({ ...req, status: 'active' }));
    
    // Navigate immediately
    if (req.type === 'chat') {
      navigate(`/astrologer/chat/${req.roomId}`, { state: { roomId: req.roomId, userId: req.userId, userName: req.userName } });
    }
  };

  const handleReject = (req) => {
    const socket = getSocket();
    socket.emit('reject_session', { userSocketId: req.userSocketId, reason: 'Astrologer is busy' });
    dispatch(removeIncomingRequest(req.roomId));
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
        {activeTab === 'Requests' && chatRequests.length > 0 && (
          <div className="animate-fade-in">
            {chatRequests.map((req) => (
              <div key={req.roomId} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm mb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl"></div>
                
                <div className="flex items-start gap-4 mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(req.userName)}&background=ffedD5&color=f97316`} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{req.userName}</h3>
                      <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-full uppercase">New Request</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">Wants to chat.</p>
                  </div>
                </div>
                
                <div className="flex gap-2 relative z-10 mt-2">
                   {processingId !== req.roomId ? (
                     <>
                       <button onClick={() => handleReject(req)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs border border-gray-200">
                         <FiX size={14} /> Decline
                       </button>
                       <button 
                         onClick={() => handleAccept(req)}
                         className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors text-xs"
                       >
                         <FiCheck size={14} /> Accept Request
                       </button>
                     </>
                   ) : (
                     <div className="w-full bg-orange-50 text-orange-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs border border-orange-100 animate-pulse">
                       <FiLoader size={14} className="animate-spin" /> Connecting...
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'Requests' && chatRequests.length === 0 && (
          <div className="animate-fade-in flex flex-col items-center justify-center h-40 text-gray-400">
             <FiMessageSquare size={32} className="mb-2 opacity-50" />
             <p className="text-sm font-medium">No pending requests.</p>
          </div>
        )}

        {/* ACTIVE PHASE */}
        {activeTab === 'Active' && (
          <div className="animate-fade-in space-y-3">
            {chatSessions.length === 0 && (
              <div className="animate-fade-in flex flex-col items-center justify-center h-40 text-gray-400">
                <FiMessageSquare size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">No active chats.</p>
              </div>
            )}
            
            {chatSessions.map((session) => (
              <Link key={session.roomId} to={`/astrologer/chat/${session.roomId}`} state={{ roomId: session.roomId, userId: session.userId, userName: session.userName }} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-orange-200 hover:shadow-md transition-all shadow-sm relative overflow-hidden group block">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-colors"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.userName)}&background=ffedD5&color=f97316`} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{session.userName}</h3>
                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">Ongoing</span>
                  </div>
                  <p className="text-xs text-orange-500 font-bold truncate">Continue typing...</p>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Chats;

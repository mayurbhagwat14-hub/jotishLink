import { FiPhone, FiVideo, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import getSocket from '../../socket/socketManager';
import { removeIncomingRequest, addActiveSession, removeActiveSession } from '../../store/slices/astrologerSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Calls = () => {
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
      }
    };
    socket.on('session_ended', onSessionEnded);
    socket.on('call_ended', onSessionEnded);
    
    return () => {
      socket.off('session_ended', onSessionEnded);
      socket.off('call_ended', onSessionEnded);
    };
  }, [dispatch]);

  const callRequests = incomingRequests.filter(req => req.type === 'audio' || req.type === 'video');
  const callSessions = activeSessions.filter(req => req.type === 'audio' || req.type === 'video');

  const tabs = [
    { id: 'Requests', label: 'Requests', count: callRequests.length }, 
    { id: 'Active', label: 'Active', count: callSessions.length },
  ];

  const handleAccept = (req) => {
    setProcessingId(req.roomId);
    const socket = getSocket();
    socket.emit('accept_session', {
      roomId: req.roomId,
      userSocketId: req.userSocketId,
    });
    dispatch(removeIncomingRequest(req.roomId));
    dispatch(addActiveSession({ ...req, status: 'active' }));

    if (req.type === 'video') {
      navigate(`/astrologer/video-room/${req.roomId}`, {
        state: { session: { ...req, roomId: req.roomId } },
      });
    } else {
      // Audio call — navigate to audio room (same VideoRoom component with type=audio)
      navigate(`/astrologer/video-room/${req.roomId}?type=audio`, {
        state: { session: { ...req, roomId: req.roomId }, type: 'audio' },
      });
    }
  };

  const handleReject = (req) => {
    const socket = getSocket();
    socket.emit('reject_session', {
      userSocketId: req.userSocketId,
      reason: 'Astrologer is busy right now.',
    });
    dispatch(removeIncomingRequest(req.roomId));
  };

  return (
    <div className="p-4 animate-fade-in mb-6 flex flex-col h-[calc(100vh-130px)]">
      
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Calls Center</h1>
        <p className="text-sm text-gray-500 font-medium">Manage Audio & Video consultations</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white text-[#fa6830] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-orange-100 text-[#e55923]' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        
        {/* REQUESTS PHASE */}
        {activeTab === 'Requests' && callRequests.length > 0 && (
          <div className="animate-fade-in space-y-3">
            {callRequests.map(req => (
              <div key={req.roomId} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#fa6830]/5 rounded-full blur-xl"></div>
                
                <div className="flex items-start gap-4 mb-3 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(req.userName)}&background=ffedD5&color=f97316`} alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{req.userName}</h3>
                      <span className="text-[10px] text-[#fa6830] font-bold bg-orange-50 px-2 py-0.5 rounded-full uppercase">{req.type === 'video' ? 'Video Call' : 'Audio Call'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-green-500 mt-1">Wallet verified.</p>
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
                         className="flex-1 bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors text-xs"
                       >
                         <FiCheck size={14} /> Accept & Start
                       </button>
                     </>
                   ) : (
                     <div className="w-full bg-orange-50 text-[#e55923] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs border border-orange-100 animate-pulse">
                       <FiLoader size={14} className="animate-spin" /> Connecting...
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Requests' && callRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
             <FiPhone size={32} className="mb-2 opacity-50" />
             <p className="text-sm font-medium">No pending requests.</p>
          </div>
        )}

        {/* ACTIVE PHASE */}
        {activeTab === 'Active' && (
          <div className="animate-fade-in space-y-3">
             
             {callSessions.map(session => (
               <div key={session.roomId} className="bg-white p-4 rounded-2xl border border-orange-200 shadow-md relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-[#fa6830]/10 rounded-full blur-xl"></div>
                 <div className="flex items-center gap-4 relative z-10 mb-3">
                   <div className="w-14 h-14 bg-orange-100 text-[#fa6830] rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                     {session.type === 'video' ? <FiVideo size={24} /> : <FiPhone size={24} />}
                   </div>
                   <div>
                     <p className="font-bold text-gray-800">Live {session.type === 'video' ? 'Video' : 'Audio'} Call with {session.userName}</p>
                     <p className="text-xs text-green-500 font-bold mt-0.5 animate-pulse">Payment Received • Ongoing</p>
                   </div>
                 </div>
                  {session.type === 'video' || session.type === 'audio' ? (
                   <button 
                     onClick={() => navigate(`/astrologer/video-room/${session.roomId}${session.type === 'audio' ? '?type=audio' : ''}`, { state: { session, agora: session.agora } })}
                     className="w-full bg-[#fa6830] hover:bg-[#e55923] text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-colors text-xs relative z-10"
                   >
                     {session.type === 'video' ? <FiVideo size={14} /> : <FiPhone size={14} />} Join Room
                   </button>
                 ) : null}
               </div>
             ))}

             {callSessions.length === 0 && (
               <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                 <FiPhone size={32} className="mb-2 opacity-50" />
                 <p className="text-sm font-medium">No active calls.</p>
               </div>
             )}

          </div>
        )}

      </div>

    </div>
  );
};

export default Calls;

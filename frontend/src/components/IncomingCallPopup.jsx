import { FiPhone, FiVideo, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { removeIncomingRequest, addActiveSession } from '../store/slices/astrologerSlice';
import api from '../api/axios';
import getSocket from '../socket/socketManager';
import toast from 'react-hot-toast';
import { useState } from 'react';

const IncomingCallPopup = ({ request, token }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [processing, setProcessing] = useState(false);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/calls/accept', { callId: request.callId });
      const { agora } = res.data.data;
      
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const socket = getSocket();
      
      socket.emit('accept_session', { 
        roomId: request.roomId, 
        userSocketId: request.userSocketId 
      });

      dispatch(removeIncomingRequest(request.roomId));
      dispatch(addActiveSession({ ...request, status: 'active', agora }));
      
      
      navigate(`/astrologer/video-room/${request.roomId}`, { state: { session: request, agora } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept call');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await api.post('/calls/reject', { callId: request.callId, reason: 'Astrologer declined' });
    } catch (e) {
      console.error(e);
    }
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socket = getSocket();
    socket.emit('reject_session', { 
      userSocketId: request.userSocketId 
    });
    
    dispatch(removeIncomingRequest(request.roomId));
    
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-slide-up relative overflow-hidden">
        
        {/* Ringing Animation Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 bg-orange-500/20 rounded-full animate-ping"></div>
          <div className="absolute w-56 h-56 bg-orange-500/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-orange-100 mb-4 flex items-center justify-center">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(request.userName)}&background=ffedD5&color=f97316`} alt="User Avatar" className="w-full h-full object-cover" />
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-1">{request.userName}</h2>
          <p className="text-orange-500 font-bold mb-8 uppercase tracking-widest text-sm flex items-center gap-2">
            {request.type === 'video' ? <><FiVideo /> Video Call</> : <><FiPhone /> Audio Call</>}
          </p>

          <div className="flex w-full justify-between gap-6 px-4 mt-4">
            <button
              onClick={handleReject}
              disabled={processing}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <FiX size={28} />
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 transition-colors animate-bounce disabled:opacity-50 disabled:animate-none"
            >
              <FiCheck size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;

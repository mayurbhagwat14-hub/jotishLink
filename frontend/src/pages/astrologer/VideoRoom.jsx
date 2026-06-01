import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useJoin,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack
} from 'agora-rtc-react';
import api from '../../api/axios';
import { io } from 'socket.io-client';

const AgoraVideoCall = ({ sessionData, channelName, rtcToken, uid, appId, socket }) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(!isMuted);
  const { localCameraTrack } = useLocalCameraTrack(!isVideoOff);
  const remoteUsers = useRemoteUsers();
  
  useJoin({
    appid: appId,
    channel: channelName,
    token: rtcToken,
    uid: uid,
  });

  usePublish([localMicrophoneTrack, localCameraTrack]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    localMicrophoneTrack?.close();
    localCameraTrack?.close();
    if (socket) {
      socket.emit('end_session', { roomId: channelName });
    }
    navigate('/astrologer/calls');
  };

  useEffect(() => {
    if (socket) {
      socket.on('session_ended', () => {
        localMicrophoneTrack?.close();
        localCameraTrack?.close();
        navigate('/astrologer/calls');
      });
    }
    return () => {
      if (socket) socket.off('session_ended');
    };
  }, [socket, localMicrophoneTrack, localCameraTrack, navigate]);

  return (
    <div className="w-full h-[100dvh] bg-gray-900 font-sans relative flex flex-col overflow-hidden">
      
      {/* Remote Video */}
      <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
        {remoteUsers.length > 0 ? (
          <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 animate-pulse bg-gray-600 flex items-center justify-center">
               <span className="text-4xl text-gray-400">{(sessionData.userName || 'U')[0]}</span>
            </div>
            <p className="text-gray-400 mt-4 font-bold">Waiting for {sessionData.userName} to join...</p>
          </>
        )}
        <div className="absolute top-16 text-center z-10">
          <h2 className="text-white text-[24px] font-bold shadow-black drop-shadow-md">{sessionData.userName}</h2>
          <p className="text-orange-400 text-[14px] font-medium shadow-black drop-shadow-md mt-1">{formatTime(callDuration)}</p>
        </div>
      </div>

      {/* Local Video */}
      <div className="absolute top-6 right-4 w-28 h-40 bg-gray-700 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-lg z-20">
        {!isVideoOff ? (
          <LocalVideoTrack track={localCameraTrack} play={true} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <FiVideoOff className="text-gray-500" size={24} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto pb-8 pt-10 px-6 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-20 flex justify-center items-center gap-6">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>

        <button 
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30 transition-transform active:scale-95"
        >
          <FiPhoneOff size={28} />
        </button>

        <button 
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600'
          }`}
        >
          {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
        </button>
      </div>
    </div>
  );
};

const AstrologerVideoRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = location.state || {};

  const [agoraClient, setAgoraClient] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/astrologer/calls');
      return;
    }

    const initAgora = async () => {
      try {
        const channelName = id; // use roomId as channel
        const { data } = await api.get(`/agora/token?channelName=${channelName}&role=publisher`);
        setTokenData(data.data);
        setAgoraClient(AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
      } catch (err) {
        console.error('Failed to init Agora:', err);
        alert('Failed to connect to video server');
        navigate('/astrologer/calls');
      }
    };

    initAgora();
    
    const token = localStorage.getItem('astrologerToken') || localStorage.getItem('accessToken');
    const s = io('http://localhost:5000', { auth: { token } });
    s.emit('join_room', { roomId: id, userId: session.userId, astrologerId: session.astrologerId, isBot: false });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [session, id, navigate]);

  if (!session || !agoraClient || !tokenData) {
    return <div className="h-[100dvh] flex items-center justify-center bg-gray-900 text-white">Connecting...</div>;
  }

  return (
    <AgoraRTCProvider client={agoraClient}>
      <AgoraVideoCall 
        sessionData={session} 
        channelName={tokenData.channelName} 
        rtcToken={tokenData.token} 
        uid={tokenData.uid} 
        appId={tokenData.appId}
        socket={socket}
      />
    </AgoraRTCProvider>
  );
};

export default AstrologerVideoRoom;

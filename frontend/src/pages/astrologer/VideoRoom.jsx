import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiMic, FiMicOff, FiPhoneOff, FiVideo, FiVideoOff, FiRefreshCw } from 'react-icons/fi';
import AgoraRTC, {
  AgoraRTCProvider,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useJoin,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
} from 'agora-rtc-react';
import api from '../../api/axios';
import { getSocket } from '../../socket/socketManager';
import { useDispatch } from 'react-redux';
import { removeActiveSession } from '../../store/slices/astrologerSlice';
import { toast } from 'react-hot-toast';

const AgoraVideoCall = ({ sessionData, channelName, rtcToken, uid, appId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const sessionIdRef = useRef(null);

  const isAudio = sessionData.type === 'audio';
  const [isVideoEnabled, setIsVideoEnabled] = useState(!isAudio);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  const { localCameraTrack } = useLocalCameraTrack(!isAudio);

  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(isMuted).catch(console.error);
    }
  }, [isMuted, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack && !isAudio) {
      localCameraTrack.setMuted(!isVideoEnabled).catch(console.error);
    }
  }, [isVideoEnabled, localCameraTrack, isAudio]);
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: appId, channel: channelName, token: rtcToken, uid });

  const tracksToPublish = isAudio
    ? [localMicrophoneTrack].filter(Boolean)
    : [localMicrophoneTrack, isVideoEnabled ? localCameraTrack : null].filter(Boolean);
  usePublish(tracksToPublish);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    // Join room so astrologer is in the socket room
    socket.emit('join_room', {
      roomId: channelName,
      userId: sessionData.userId,
      astrologerId: sessionData.astrologerId,
      isBot: false,
      sessionType: sessionData.type === 'audio' ? 'audio_call' : 'video_call'
    });

    const onSessionCreated = (data) => {
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
    };

    const onEnded = () => {
      if (sessionEnded) return;
      setSessionEnded(true);
      localMicrophoneTrack?.close();
      localCameraTrack?.close();
      dispatch(removeActiveSession(channelName));
      navigate('/astrologer/calls');
    };

    socket.on('session_created', onSessionCreated);
    socket.on('session_ended', onEnded);

    return () => {
      socket.off('session_created', onSessionCreated);
      socket.off('session_ended', onEnded);
    };
  }, [channelName]);

  const handleEndCall = () => {
    if (sessionEnded) return;
    setSessionEnded(true);
    localMicrophoneTrack?.close();
    localCameraTrack?.close();
    const socket = getSocket();
    socket.emit('end_session', {
      roomId: channelName,
      sessionId: sessionIdRef.current || sessionId,
      userId: sessionData.userId,
      endedBy: 'astrologer',
    });
    navigate('/astrologer/calls');
  };

  const handleFlipCamera = async () => {
    if (!localCameraTrack) return;
    try {
      const cameras = await AgoraRTC.getCameras();
      if (cameras.length <= 1) {
        toast.error('No other camera devices found');
        return;
      }
      
      const currentDeviceId = localCameraTrack.getMediaStreamTrack()?.getSettings()?.deviceId;
      const currentIndex = cameras.findIndex(c => c.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextDevice = cameras[nextIndex];
      
      await localCameraTrack.setDevice(nextDevice.deviceId);
      toast.success(`Switched camera to ${nextDevice.label || `Device ${nextIndex + 1}`}`);
    } catch (err) {
      console.error('Failed to flip camera:', err);
      toast.error('Failed to switch camera');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full h-[100dvh] bg-gray-900 font-sans relative flex flex-col overflow-hidden">
      
      {/* UI Render */}
      <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
        {!isAudio ? (
          // Video Call Layout
          <>
            <div className="absolute inset-0 z-0">
               {remoteUsers.length > 0 ? (
                 <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-white/50">Waiting for user video...</div>
               )}
            </div>
            
            <div className="absolute top-6 right-6 w-32 h-48 bg-black rounded-xl overflow-hidden border-2 border-white/20 z-10 shadow-2xl">
               {localCameraTrack && isVideoEnabled ? (
                 <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/50">You</div>
               )}
            </div>
          </>
        ) : (
          // Audio Call Layout
          <>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 bg-gray-600 flex items-center justify-center shadow-2xl z-10">
               <span className="text-5xl text-gray-400 font-bold">{(sessionData.userName || 'U')[0]}</span>
            </div>
            {remoteUsers.length === 0 && (
              <p className="text-gray-400 mt-6 font-bold animate-pulse z-10">Waiting for {sessionData.userName} to join...</p>
            )}
            {remoteUsers.length > 0 && (
              <p className="text-green-400 text-sm mt-4 font-bold z-10">● Connected</p>
            )}
            <div className="hidden">
              {remoteUsers.map(user => <RemoteUser key={user.uid} user={user} playVideo={false} playAudio={true} />)}
            </div>
          </>
        )}

        <div className="absolute top-16 text-center z-10 w-full flex flex-col items-center">
          <div className="bg-blue-500/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-md tracking-wider uppercase">
            {isAudio ? 'Audio Call' : 'Video Call'}
          </div>
          {isAudio && (
            <h2 className="text-white text-[28px] font-bold shadow-black drop-shadow-md">{sessionData.userName}</h2>
          )}
          <p className="text-white text-[18px] font-bold shadow-black drop-shadow-md mt-1 bg-black/40 px-3 py-1 rounded-full backdrop-blur">{formatTime(callDuration)}</p>
        </div>
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

        {!isAudio && (
          <>
            <button 
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                !isVideoEnabled ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600'
              }`}
            >
              {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
            </button>
            <button 
              onClick={handleFlipCamera}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600"
            >
              <FiRefreshCw size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const AstrologerVideoRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, type: stateType } = location.state || {};

  const [agoraClient] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [tokenData, setTokenData] = useState(null);

  // Determine type from state or URL
  const callType = stateType || session?.type || searchParams.get('type') || 'video';

  useEffect(() => {
    if (!session) {
      navigate('/astrologer/calls');
      return;
    }

    const initAgora = async () => {
      try {
        const channelName = id;
        const { data } = await api.get(`/agora/token?channelName=${channelName}&role=publisher`);
        setTokenData(data.data);
      } catch (err) {
        console.error('Failed to init Agora:', err);
        toast.error('Failed to connect to video server');
        navigate('/astrologer/calls');
      }
    };

    initAgora();
  }, [session, id, navigate]);

  if (!session || !tokenData) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#fa6830] border-t-transparent animate-spin"></div>
          <p>Connecting...</p>
        </div>
      </div>
    );
  }

  // Ensure session has the correct type
  const sessionWithType = { ...session, type: callType };

  return (
    <AgoraRTCProvider client={agoraClient}>
      <AgoraVideoCall 
        sessionData={sessionWithType} 
        channelName={tokenData.channelName} 
        rtcToken={tokenData.token} 
        uid={tokenData.uid} 
        appId={tokenData.appId}
      />
    </AgoraRTCProvider>
  );
};

export default AstrologerVideoRoom;

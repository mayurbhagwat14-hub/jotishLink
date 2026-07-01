import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiRefreshCw } from 'react-icons/fi';
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
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import RateAstrologerModal from '../../components/RateAstrologerModal';
import { toast } from 'react-hot-toast';

const CallUI = ({ astrologer, channelName, rtcToken, uid, appId, callType, user, dispatch }) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const sessionIdRef = useRef(null);
  const isAudio = callType === 'audio';

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(true);
  const { localCameraTrack } = useLocalCameraTrack(!isAudio);

  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(isMuted).catch(console.error);
    }
  }, [isMuted, localMicrophoneTrack]);

  useEffect(() => {
    if (localCameraTrack && !isAudio) {
      localCameraTrack.setMuted(isVideoOff).catch(console.error);
    }
  }, [isVideoOff, localCameraTrack, isAudio]);
  const remoteUsers = useRemoteUsers();

  useJoin({ appid: appId, channel: channelName, token: rtcToken, uid });
  const tracksToPublish = isAudio 
    ? [localMicrophoneTrack].filter(Boolean) 
    : [localMicrophoneTrack, localCameraTrack].filter(Boolean);
  usePublish(tracksToPublish);

  useEffect(() => {
    const t = setInterval(() => setCallDuration((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onSessionCreated = (data) => {
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;
      const rate = isAudio
        ? (astrologer.pricing?.audioCall || astrologer.rate || 5)
        : (astrologer.pricing?.videoCall || (astrologer.rate || 5) * 2);
      socket.emit('start_timer', {
        roomId: channelName,
        sessionId: data.sessionId,
        userId: user?._id,
        astrologerRate: rate,
        type: callType === 'audio' ? 'audio_call' : 'video_call'
      });
    };

    const onWalletUpdate = (data) => {
      if (data.newBalance !== undefined) dispatch(updateUser({ wallet: data.newBalance }));
    };

    const onSessionEnded = () => {
      if (sessionEnded) return;
      setSessionEnded(true);
      localMicrophoneTrack?.close();
      localCameraTrack?.close();
      if (astrologer._id) setShowRating(true);
      else navigate('/user/home');
    };

    socket.emit('join_room', {
      roomId: channelName,
      userId: user?._id,
      astrologerId: astrologer.userId?._id || astrologer.userId || astrologer._id,
      isBot: false,
      sessionType: callType === 'audio' ? 'audio_call' : 'video_call'
    });

    socket.on('session_created', onSessionCreated);
    socket.on('wallet_update', onWalletUpdate);
    socket.on('session_ended', onSessionEnded);

    return () => {
      socket.off('session_created', onSessionCreated);
      socket.off('wallet_update', onWalletUpdate);
      socket.off('session_ended', onSessionEnded);
    };
  }, [channelName]);

  const handleEndCall = () => {
    if (sessionEnded) return;
    setSessionEnded(true);
    localMicrophoneTrack?.close();
    if (!isAudio) localCameraTrack?.close();
    const socket = getSocket();
    socket.emit('end_session', {
      roomId: channelName,
      sessionId: sessionIdRef.current || sessionId,
      userId: user?._id,
      endedBy: 'user',
    });
    if (astrologer._id) setShowRating(true);
    else navigate('/user/home');
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

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="w-full h-[100dvh] bg-gray-900 relative flex flex-col overflow-hidden">
      {/* Remote video / audio */}
      <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
        {isAudio ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-300 mb-4 shadow-xl">
              <img src={astrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name || 'A')}&background=ffedD5&color=f97316`} alt={astrologer.name} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-white text-2xl font-bold">{astrologer.name}</h2>
            <p className="text-orange-400 mt-2 text-lg">{fmt(callDuration)}</p>
            {remoteUsers.length > 0 ? (
              <p className="text-green-400 text-sm mt-2 font-bold">● Connected</p>
            ) : (
              <p className="text-gray-400 text-sm mt-2 animate-pulse">Connecting audio...</p>
            )}
            {remoteUsers.map((u) => (
              <RemoteUser key={u.uid} user={u} playVideo={false} playAudio={true} />
            ))}
          </div>
        ) : (
          <>
            {remoteUsers.length > 0 ? (
              <RemoteUser user={remoteUsers[0]} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 animate-pulse">
                  <img src={astrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(astrologer.name || 'A')}&background=ffedD5&color=f97316`} alt={astrologer.name} className="w-full h-full object-cover opacity-50" />
                </div>
                <p className="text-gray-400 mt-4 font-bold">Waiting for {astrologer.name}...</p>
              </div>
            )}
            <div className="absolute top-16 text-center z-10">
              <h2 className="text-white text-2xl font-bold drop-shadow-md">{astrologer.name}</h2>
              <p className="text-orange-400 text-sm font-medium mt-1">{fmt(callDuration)}</p>
            </div>
          </>
        )}
      </div>

      {/* Local video (video only) */}
      {!isAudio && (
        <div className="absolute top-6 right-4 w-28 h-40 bg-gray-700 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-lg z-20">
          {!isVideoOff ? (
            <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover unmirror-video" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <FiVideoOff className="text-gray-500" size={24} />
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-8 pt-10 px-6 bg-gradient-to-t from-gray-900 to-transparent z-20 flex justify-center items-center gap-6">
        <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50'}`}>
          {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
        </button>
        <button onClick={handleEndCall} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
          <FiPhoneOff size={28} />
        </button>
        {!isAudio && (
          <>
            <button onClick={() => setIsVideoOff(!isVideoOff)} className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-gray-700/80 text-white border border-gray-600/50'}`}>
              {isVideoOff ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
            </button>
            <button onClick={handleFlipCamera} className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700/80 text-white border border-gray-600/50 hover:bg-gray-600">
              <FiRefreshCw size={24} />
            </button>
          </>
        )}
      </div>

      <RateAstrologerModal
        isOpen={showRating}
        onClose={() => navigate('/user/home')}
        astrologer={astrologer}
        onSubmit={async (data) => {
          try {
            await api.post('/user/rate-astrologer', {
              astrologerId: astrologer._id,
              rating: data.rating,
              review: data.review,
            });
          } catch (e) { /* ignore */ }
          navigate('/user/home');
        }}
      />
    </div>
  );
};

const VideoRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { astrologer, type: stateType } = location.state || {};
  const callType = stateType || searchParams.get('type') || 'video';
  const { user } = useSelector((state) => state.auth);

  const [agoraClient] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    if (!astrologer) { navigate('/user/astrologers'); return; }
    api.get(`/agora/token?channelName=${id}&role=publisher`)
      .then(({ data }) => setTokenData(data.data))
      .catch(() => { toast.error('Failed to connect to call server'); navigate('/user/astrologers'); });
  }, [id]);

  if (!astrologer || !tokenData) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#fa6830] border-t-transparent animate-spin"></div>
          <p>Connecting to {astrologer?.name || 'call'}...</p>
        </div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={agoraClient}>
      <CallUI
        astrologer={astrologer}
        channelName={tokenData.channelName}
        rtcToken={tokenData.token}
        uid={tokenData.uid}
        appId={tokenData.appId}
        callType={callType}
        user={user}
        dispatch={dispatch}
      />
    </AgoraRTCProvider>
  );
};

export default VideoRoom;

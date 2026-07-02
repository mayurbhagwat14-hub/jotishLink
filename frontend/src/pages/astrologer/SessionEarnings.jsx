import { useEffect } from 'react';
import { FiClock, FiActivity } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAstrologerEarningsThunk } from '../../store/slices/astrologerSlice';

const SessionEarnings = () => {
  const dispatch = useDispatch();
  const { earnings: { earnings = [] }, loading } = useSelector((state) => state.astrologer);

  useEffect(() => {
    dispatch(fetchAstrologerEarningsThunk());
  }, [dispatch]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 text-[#fa6830] rounded-full flex items-center justify-center">
            <FiActivity size={24} />
          </div>
          Session Earnings
        </h1>
        <p className="text-gray-500 font-medium ml-15">Detailed breakdown of your earnings from all recent sessions.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Sessions</h2>
          <span className="text-sm font-bold text-[#fa6830] bg-orange-50 px-3 py-1 rounded-lg">
            {earnings.length} Sessions
          </span>
        </div>
        
        <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl mb-6">
          <p className="text-xs text-orange-700 font-medium text-center">
            *Platform commission already deducted.
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fa6830] mx-auto"></div>
            </div>
          ) : earnings.length > 0 ? (
            earnings.map((earn, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-50 rounded-2xl hover:bg-gray-50/80 transition-colors shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    earn.type === 'video_call' ? 'bg-purple-100 text-purple-600' :
                    earn.type === 'audio_call' ? 'bg-blue-100 text-blue-600' :
                    earn.type === 'chat' ? 'bg-green-100 text-green-600' :
                    'bg-orange-100 text-[#e55923]'
                  }`}>
                    {/* Just using basic icons or text for simplicity, matching the style */}
                    <span className="text-xl font-bold uppercase">{earn.type?.charAt(0) || 'S'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-2 capitalize">
                      {earn.type === 'audio_call' ? 'Audio Call' : earn.type === 'video_call' ? 'Video Call' : earn.type || 'Session'}
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ID: {String(earn.sessionId).slice(-6)}</span>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <FiClock size={12} className="text-gray-400" />
                      {earn.type === 'pooja' ? 'N/A' : `${Math.floor((earn.durationSeconds || 0) / 60)}m ${(earn.durationSeconds || 0) % 60}s`}
                      <span className="text-gray-300 mx-1">•</span>
                      <span className="text-gray-500 font-medium">{new Date(earn.date).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-green-600 tracking-tight">₹{earn.amount}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FiClock className="text-gray-300 w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium">No recent session earnings available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionEarnings;

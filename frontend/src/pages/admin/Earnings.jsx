import { useState, useEffect } from 'react';
import { FiTrendingUp, FiActivity, FiVideo, FiPhone, FiMessageCircle } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import getSocket from '../../socket/socketManager';

const Earnings = () => {
  const [data, setData] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    total: 0,
    breakdown: { chat: 0, audio: 0, video: 0 },
    astroBreakdown: { chat: 0, audio: 0, video: 0 },
    history: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/admin/earnings');
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();

    const socket = getSocket();
    socket.on('dashboard_updated', fetchEarnings);

    return () => {
      socket.off('dashboard_updated', fetchEarnings);
    };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading earnings...</div>;
  }

  const stats = [
    { label: "Today's Earnings", value: data.today, icon: <FiActivity />, color: 'bg-green-100 text-green-600' },
    { label: "Weekly Earnings", value: data.weekly, icon: <FiTrendingUp />, color: 'bg-blue-100 text-blue-600' },
    { label: "Monthly Earnings", value: data.monthly, icon: <FaRupeeSign size={14} />, color: 'bg-purple-100 text-purple-600' },
    { label: "Total Platform Earnings", value: data.total, icon: <FaRupeeSign size={14} />, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Revenue</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">{s.label}</p>
              <h3 className="text-xl font-bold text-gray-900">₹{s.value.toFixed(2)}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Cut Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FiMessageCircle /></div>
                <span className="font-medium text-gray-700">Chat</span>
              </div>
              <span className="font-bold text-gray-900">₹{data.breakdown.chat.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><FiPhone /></div>
                <span className="font-medium text-gray-700">Audio Calls</span>
              </div>
              <span className="font-bold text-gray-900">₹{data.breakdown.audio.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><FiVideo /></div>
                <span className="font-medium text-gray-700">Video Calls</span>
              </div>
              <span className="font-bold text-gray-900">₹{data.breakdown.video.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Astro Cut Breakdown</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FiMessageCircle /></div>
                <span className="font-medium text-gray-700">Chat</span>
              </div>
              <span className="font-bold text-blue-600">₹{(data.astroBreakdown?.chat || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><FiPhone /></div>
                <span className="font-medium text-gray-700">Audio Calls</span>
              </div>
              <span className="font-bold text-blue-600">₹{(data.astroBreakdown?.audio || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><FiVideo /></div>
                <span className="font-medium text-gray-700">Video Calls</span>
              </div>
              <span className="font-bold text-blue-600">₹{(data.astroBreakdown?.video || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Astrologer</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Total Cost</th>
                  <th className="p-4 font-medium text-green-600">Admin Cut</th>
                  <th className="p-4 font-medium text-blue-600">Astro Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.history.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(log.date).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {log.astrologerId?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm capitalize">
                      <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                        log.sessionType === 'chat' ? 'bg-blue-100 text-blue-700' :
                        (log.sessionType === 'audio' || log.sessionType === 'audio_call') ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {log.sessionType === 'audio_call' ? 'Audio Call' : log.sessionType === 'video_call' ? 'Video Call' : log.sessionType}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-700">₹{log.totalCost?.toFixed(2)}</td>
                    <td className="p-4 text-sm font-bold text-green-600">₹{log.adminShare?.toFixed(2)} ({log.commissionPercent}%)</td>
                    <td className="p-4 text-sm font-bold text-blue-600">₹{log.astrologerShare?.toFixed(2)}</td>
                  </tr>
                ))}
                {data.history.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No revenue logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;

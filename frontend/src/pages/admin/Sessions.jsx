import { useState, useEffect } from 'react';
import { FiMessageSquare, FiPhoneCall, FiVideo, FiClock, FiAlertCircle } from 'react-icons/fi';
import { getAdminSessions } from '../../api/adminApis';

const AdminSessions = () => {
  const [liveSessions, setLiveSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getAdminSessions();
      const allSessions = res.data?.data?.sessions || [];
      
      const live = allSessions.filter(s => s.status === 'ongoing').map(s => ({
        id: s._id,
        user: s.userId?.name || 'Unknown User',
        astrologer: s.astrologerId?.name || 'Unknown Astrologer',
        type: s.isBotSession ? 'Chat (Bot)' : 'Chat',
        typeIcon: <FiMessageSquare />,
        duration: 'Ongoing',
        rate: s.isFreeChat ? 0 : 'Paid',
        started: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billed: s.amountDeducted || 0
      }));

      const recent = allSessions.filter(s => s.status === 'completed' || s.status === 'missed').map(s => ({
        id: s._id,
        user: s.userId?.name || 'Unknown User',
        astrologer: s.astrologerId?.name || 'Unknown Astrologer',
        type: s.isBotSession ? 'Chat (Bot)' : 'Chat',
        duration: `${Math.floor((s.durationSeconds || 0) / 60)}m ${(s.durationSeconds || 0) % 60}s`,
        total: s.amountDeducted || 0,
        status: s.status === 'completed' ? 'Completed' : 'Missed',
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setLiveSessions(live);
      setRecentSessions(recent);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    if (type === 'Chat') return 'text-blue-500 bg-blue-50';
    if (type === 'Audio Call') return 'text-green-500 bg-green-50';
    return 'text-purple-500 bg-purple-50';
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Sessions Monitor</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Real-time view of all ongoing Chat, Audio, and Video sessions between users and astrologers</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Live Now', value: liveSessions.length, color: 'red' },
          { label: 'Chats Active', value: liveSessions.filter(s => s.type.includes('Chat')).length, color: 'blue' },
          { label: 'Audio Active', value: liveSessions.filter(s => s.type.includes('Audio')).length, color: 'green' },
          { label: 'Video Active', value: liveSessions.filter(s => s.type.includes('Video')).length, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              {s.color === 'red' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            </div>
            <h3 className="text-2xl font-black text-gray-900">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* ═══ LIVE SESSIONS ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-bold text-gray-900">Currently Active</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm font-medium">Loading sessions...</div>
          ) : liveSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm font-medium">No live sessions currently</div>
          ) : liveSessions.map((s) => (
            <div key={s.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-xs font-black text-blue-600 shadow-sm">{s.user?.[0] || 'U'}</div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-white flex items-center justify-center text-xs font-black text-orange-600 shadow-sm">{s.astrologer?.[0] || 'A'}</div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.user} <span className="text-gray-300 mx-1">↔</span> {s.astrologer}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getTypeColor(s.type)}`}>{s.type}</span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><FiClock size={10} /> Started at {s.started}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-900 tabular-nums">{s.duration}</p>
                <p className="text-[11px] text-gray-400 font-medium">₹{s.rate}/min • Billed: <span className="text-green-600 font-bold">₹{s.billed}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RECENT COMPLETED SESSIONS ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recently Completed</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User → Astrologer</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Billed</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm font-medium">Loading recent sessions...</td></tr>
              ) : recentSessions.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm font-medium">No recent sessions found</td></tr>
              ) : recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-6 text-sm font-bold text-gray-800">{s.user} → {s.astrologer}</td>
                  <td className="py-3.5 px-6">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getTypeColor(s.type)}`}>{s.type}</span>
                  </td>
                  <td className="py-3.5 px-6 text-sm font-medium text-gray-600">{s.duration}</td>
                  <td className="py-3.5 px-6 text-sm font-black text-gray-900">₹{s.total?.toLocaleString() || 0}</td>
                  <td className="py-3.5 px-6 text-xs text-gray-400 font-medium">{s.time}</td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      s.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {s.status === 'Refund Requested' && <FiAlertCircle size={10} />}
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminSessions;

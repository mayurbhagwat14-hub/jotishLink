import { FiMessageSquare, FiPhoneCall, FiVideo, FiClock, FiAlertCircle } from 'react-icons/fi';

const AdminSessions = () => {
  const liveSessions = [
    { id: 1, user: 'Rahul Khanna', astrologer: 'Sanjay Sharma', type: 'Video Call', typeIcon: <FiVideo />, duration: '05:23', rate: 85, started: '5:12 PM', billed: 459 },
    { id: 2, user: 'Simran Devi', astrologer: 'Neeta Joshi', type: 'Chat', typeIcon: <FiMessageSquare />, duration: '12:45', rate: 25, started: '4:55 PM', billed: 319 },
    { id: 3, user: 'Amit Patel', astrologer: 'Ramesh Gupta', type: 'Audio Call', typeIcon: <FiPhoneCall />, duration: '08:10', rate: 40, started: '5:08 PM', billed: 328 },
  ];

  const recentSessions = [
    { id: 4, user: 'Karan D.', astrologer: 'Vinod Acharya', type: 'Chat', duration: '25m 10s', rate: 25, total: 628, status: 'Completed', time: '4:30 PM' },
    { id: 5, user: 'Priya K.', astrologer: 'Sanjay Sharma', type: 'Video Call', duration: '15m 00s', rate: 85, total: 1275, status: 'Completed', time: '3:45 PM' },
    { id: 6, user: 'Neha G.', astrologer: 'Neeta Joshi', type: 'Audio Call', duration: '10m 45s', rate: 40, total: 430, status: 'Completed', time: '2:15 PM' },
    { id: 7, user: 'Arjun M.', astrologer: 'Ramesh Gupta', type: 'Chat', duration: '30m 00s', rate: 65, total: 1950, status: 'Refund Requested', time: '1:00 PM' },
  ];

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
          { label: 'Live Now', value: '3', color: 'red' },
          { label: 'Chats Active', value: '1', color: 'blue' },
          { label: 'Audio Active', value: '1', color: 'green' },
          { label: 'Video Active', value: '1', color: 'purple' },
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
          {liveSessions.map((s) => (
            <div key={s.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-xs font-black text-blue-600 shadow-sm">{s.user[0]}</div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-white flex items-center justify-center text-xs font-black text-orange-600 shadow-sm">{s.astrologer[0]}</div>
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
              {recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-6 text-sm font-bold text-gray-800">{s.user} → {s.astrologer}</td>
                  <td className="py-3.5 px-6">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getTypeColor(s.type)}`}>{s.type}</span>
                  </td>
                  <td className="py-3.5 px-6 text-sm font-medium text-gray-600">{s.duration}</td>
                  <td className="py-3.5 px-6 text-sm font-black text-gray-900">₹{s.total.toLocaleString()}</td>
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

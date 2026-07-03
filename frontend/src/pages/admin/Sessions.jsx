import { useState, useEffect } from 'react';
import { FiMessageSquare, FiPhoneCall, FiVideo, FiClock, FiAlertCircle, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { getSocket } from '../../socket/socketManager';
import { getAdminSessions, getAdminCalls, deleteAdminSession, deleteAdminCall, bulkDeleteAdminSessions } from '../../api/adminApis';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader';

const AdminSessions = () => {
  const [liveSessions, setLiveSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterAstro, setFilterAstro] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [deletingId, setDeletingId] = useState(null);

  // Deletion States
  const [deleteConfirmSession, setDeleteConfirmSession] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchSessions();
    const socket = getSocket();
    
    const handleUpdate = () => {
      fetchSessions();
    };

    socket.on('dashboard_updated', handleUpdate);
    
    return () => {
      socket.off('dashboard_updated', handleUpdate);
    };
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [sessionsRes, callsRes] = await Promise.all([
        getAdminSessions(),
        getAdminCalls()
      ]);
      const allSessions = sessionsRes.data?.data?.sessions || [];
      const allCalls = callsRes.data?.data?.calls || [];
      
      const liveChats = allSessions.filter(s => s.status === 'ongoing' && s.userId && s.astrologerId).map(s => ({
        id: s._id,
        user: s.userId?.name || 'Unknown User',
        userAvatar: s.userId?.avatar || '',
        astrologer: s.astrologerId?.name || 'Unknown Astrologer',
        astrologerAvatar: s.astrologerId?.avatar || '',
        type: s.isBotSession ? 'Chat (Bot)' : 
               s.type === 'video_call' || s.type === 'video' ? 'Video Call' :
               s.type === 'audio_call' || s.type === 'audio' ? 'Audio Call' : 'Chat',
        typeIcon: <FiMessageSquare />,
        duration: 'Ongoing',
        rate: s.isFreeChat ? 0 : 'Paid',
        started: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billed: s.amountDeducted || 0,
        source: 'ChatSession'
      }));

      const liveCallsData = allCalls.filter(c => ['accepted', 'ongoing', 'ringing'].includes(c.status) && c.userId && c.astrologerId).map(c => ({
        id: c._id,
        user: c.userId?.name || 'Unknown User',
        userAvatar: c.userId?.avatar || '',
        astrologer: c.astrologerId?.name || 'Unknown Astrologer',
        astrologerAvatar: c.astrologerId?.avatar || '',
        type: 'Audio Call',
        typeIcon: <FiPhoneCall />,
        duration: c.status === 'ringing' ? 'Ringing' : 'Ongoing',
        rate: c.ratePerMinute || 0,
        started: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billed: c.totalAmount || 0,
        source: 'CallSession'
      }));

      const recentChats = allSessions.filter(s => s.status === 'completed' && (s.durationSeconds || 0) > 0).map(s => ({
        id: s._id,
        user: s.userId?.name || 'Unknown User',
        userAvatar: s.userId?.avatar || '',
        astrologer: s.astrologerId?.name || 'Unknown Astrologer',
        astrologerAvatar: s.astrologerId?.avatar || '',
        type: s.isBotSession ? 'Chat (Bot)' : 
               s.isFreeChat ? 'Chat (Free)' :
               s.type === 'video_call' || s.type === 'video' ? 'Video Call' :
               s.type === 'audio_call' || s.type === 'audio' ? 'Audio Call' : 'Chat',
        duration: `${Math.floor((s.durationSeconds || 0) / 60)}m ${(s.durationSeconds || 0) % 60}s`,
        total: s.amountDeducted || 0,
        status: 'Completed',
        time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(s.createdAt).getTime(),
        source: 'ChatSession'
      }));

      const recentCallsData = allCalls.filter(c => c.status === 'completed' && (c.duration || 0) > 0).map(c => ({
        id: c._id,
        user: c.userId?.name || 'Unknown User',
        userAvatar: c.userId?.avatar || '',
        astrologer: c.astrologerId?.name || 'Unknown Astrologer',
        astrologerAvatar: c.astrologerId?.avatar || '',
        type: c.isFreeCall ? 'Audio Call (Free)' : 'Audio Call',
        duration: `${Math.floor((c.duration || 0) / 60)}m ${(c.duration || 0) % 60}s`,
        total: c.totalAmount || 0,
        status: 'Completed',
        time: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(c.createdAt).getTime(),
        source: 'CallSession'
      }));

      setLiveSessions([...liveChats, ...liveCallsData]);
      const mergedRecent = [...recentChats, ...recentCallsData].sort((a, b) => b.timestamp - a.timestamp);
      setRecentSessions(mergedRecent);
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

  const handleDeleteSession = (id, type, source) => {
    setDeleteConfirmSession([{ id, type, source }]);
  };

  const handleBulkDelete = () => {
    if (selectedSessions.length === 0) return;
    setDeleteConfirmSession(selectedSessions);
  };

  const executeDelete = async () => {
    if (!deleteConfirmSession || deleteConfirmSession.length === 0) return;
    
    setIsBulkDeleting(true);
    try {
      // Separate session IDs and call IDs to send in a single bulk request based on source
      const sessionIds = deleteConfirmSession.filter(s => s.source === 'ChatSession').map(s => s.id);
      const callIds = deleteConfirmSession.filter(s => s.source === 'CallSession').map(s => s.id);

      if (sessionIds.length > 0 || callIds.length > 0) {
        await bulkDeleteAdminSessions({ sessionIds, callIds });
      }

      fetchSessions();
      setSelectedSessions([]);
    } catch (err) {
      console.error('Failed to delete sessions', err);
      toast.error('Failed to delete some sessions');
    } finally {
      setIsBulkDeleting(false);
      setDeleteConfirmSession(null);
    }
  };

  const toggleSelectAll = (filtered) => {
    if (selectedSessions.length === filtered.length && filtered.length > 0) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(filtered.map(s => ({ id: s.id, type: s.type, source: s.source })));
    }
  };

  const toggleSelect = (session) => {
    setSelectedSessions(prev => 
      prev.some(s => s.id === session.id) 
        ? prev.filter(s => s.id !== session.id) 
        : [...prev, { id: session.id, type: session.type, source: session.source }]
    );
  };

  const filteredRecentSessions = recentSessions
    .filter(s => filterUser === '' || s.user.toLowerCase().includes(filterUser.toLowerCase()))
    .filter(s => filterAstro === '' || s.astrologer.toLowerCase().includes(filterAstro.toLowerCase()))
    .filter(s => filterType === 'All' || s.type === filterType)
    .filter(s => filterStatus === 'All' || s.status === filterStatus);

  return (
    <div className="space-y-8">

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
            <div className="flex justify-center p-8"><LogoLoader /></div>
          ) : liveSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm font-medium">No live sessions currently</div>
          ) : liveSessions.map((s) => (
            <div key={s.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-xs font-black text-blue-600 shadow-sm overflow-hidden">
                    <img src={s.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.user || 'U')}&background=dbeafe&color=2563eb`} alt={s.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border-2 border-white flex items-center justify-center text-xs font-black text-orange-600 shadow-sm overflow-hidden">
                    <img src={s.astrologerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.astrologer || 'A')}&background=ffedD5&color=f97316`} alt={s.astrologer} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.user} <span className="text-gray-300 mx-1">↔</span> {s.astrologer}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getTypeColor(s.type)}`}>{s.type}</span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><FiClock size={10} /> Started at {s.started}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-3">
                <div>
                  <p className="text-lg font-black text-gray-900 tabular-nums">{s.duration}</p>
                  <p className="text-[11px] text-gray-400 font-medium">₹{s.rate}/min • Billed: <span className="text-green-600 font-bold">₹{s.billed}</span></p>
                </div>
                <button
                  onClick={() => handleDeleteSession(s.id, s.type, s.source)}
                  disabled={deletingId === s.id}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Force Delete Stuck Session"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RECENT COMPLETED SESSIONS ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-gray-900">Recently Completed</h2>
          <div className="flex flex-wrap gap-3">
            <input 
              type="text" 
              placeholder="Filter by User" 
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <input 
              type="text" 
              placeholder="Filter by Astrologer" 
              value={filterAstro}
              onChange={(e) => setFilterAstro(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="All">All Types</option>
              <option value="Audio Call">Audio Call</option>
              <option value="Video Call">Video Call</option>
              <option value="Chat">Chat</option>
              <option value="Chat (Bot)">Chat (Bot)</option>
            </select>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {selectedSessions.length > 0 && (
            <div className="px-6 py-3 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
              <span className="text-sm font-bold text-red-600">{selectedSessions.length} session(s) selected</span>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-red-600/20 active:scale-95"
              >
                Delete Selected
              </button>
            </div>
          )}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-6 w-10">
                  <input
                    type="checkbox"
                    checked={selectedSessions.length === filteredRecentSessions.length && filteredRecentSessions.length > 0}
                    onChange={() => toggleSelectAll(filteredRecentSessions)}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
                  />
                </th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User → Astrologer</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Billed</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="py-8"><div className="flex justify-center"><LogoLoader /></div></td></tr>
              ) : recentSessions.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-400 text-sm font-medium">No recent sessions found</td></tr>
              ) : filteredRecentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-6">
                    <input
                      type="checkbox"
                      checked={selectedSessions.some(sel => sel.id === s.id)}
                      onChange={() => toggleSelect(s)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
                    />
                  </td>
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
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDeleteSession(s.id, s.type, s.source)}
                      disabled={deletingId === s.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Session"
                    >
                      {deletingId === s.id ? (
                        <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin inline-block"></span>
                      ) : (
                        <FiTrash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ DELETE CONFIRMATION MODAL ═══ */}
      {deleteConfirmSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isBulkDeleting && setDeleteConfirmSession(null)} />
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 animate-scale-up text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTrash2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Delete Session{deleteConfirmSession.length > 1 ? 's' : ''}?</h2>
            <p className="text-gray-500 mb-8 font-medium">
              Are you sure you want to permanently delete {deleteConfirmSession.length > 1 ? `these ${deleteConfirmSession.length} sessions` : 'this session'}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmSession(null)}
                disabled={isBulkDeleting}
                className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBulkDeleting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <FiTrash2 size={18} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSessions;

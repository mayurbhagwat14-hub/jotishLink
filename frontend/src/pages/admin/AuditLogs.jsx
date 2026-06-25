import { useState, useEffect } from 'react';
import { FiShield, FiFileText, FiRefreshCcw, FiX, FiClock, FiTrash2 } from 'react-icons/fi';
import * as adminApis from '../../api/adminApis';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../components/LogoLoader';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApis.getAdminAuditLogs(100);
      setLogs(res.data.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-green-600 bg-green-50';
      case 'UPDATE': return 'text-blue-600 bg-blue-50';
      case 'DELETE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleDeleteLog = async () => {
    if (!deleteConfirmLog || isDeletingLog) return;
    try {
      setIsDeletingLog(true);
      await adminApis.deleteAdminAuditLog(deleteConfirmLog._id);
      setDeleteConfirmLog(null);
      fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete audit log');
    } finally {
      setIsDeletingLog(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="text-orange-500" /> Audit Logs
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Track all system changes and administrative actions</p>
        </div>
        <button onClick={fetchLogs} className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-200 transition-colors shadow-sm">
          <FiRefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Admin</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resource</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">IP Address</th>
                <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8"><div className="flex justify-center"><LogoLoader /></div></td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-gray-500 font-medium">No audit logs found.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <FiClock size={12} className="text-gray-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-sm text-gray-800">{log.adminId?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-gray-400">{log.adminId?.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-700 capitalize">
                    {log.resource}
                  </td>
                  <td className="py-4 px-6 text-xs font-mono text-gray-400">
                    {log.ipAddress || 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => setSelectedLog(log)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <FiFileText size={14} /> View
                    </button>
                    <button onClick={() => setDeleteConfirmLog(log)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-red-50 text-red-500 hover:bg-red-100">
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiFileText className="text-orange-500" /> Audit Log Details
              </h3>
              <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <FiX size={16}/>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{selectedLog.adminId?.name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Action</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Resource</p>
                  <p className="text-sm font-bold text-gray-800 capitalize">{selectedLog.resource}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time</p>
                  <p className="text-xs font-medium text-gray-600">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Request Payload / Data</p>
                <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                  <pre className="text-xs text-green-400 font-mono leading-relaxed">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setDeleteConfirmLog(null)}>
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col p-8 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 size={32} className="text-red-500" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Log?</h3>
            <p className="text-gray-500 font-medium mb-8">
              Are you sure you want to permanently delete this audit log record? This action cannot be undone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setDeleteConfirmLog(null)}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteLog}
                disabled={isDeletingLog}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center ${isDeletingLog ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
              >
                {isDeletingLog ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;

import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiStar, FiPhone, FiMessageSquare, FiVideo, FiCalendar, FiMoreHorizontal, FiEye, FiChevronDown, FiChevronLeft, FiChevronRight, FiUserCheck, FiClock, FiToggleLeft, FiToggleRight, FiSlash } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import { getAdminAstrologers, updateAdminAstrologerStatus, deleteAdminAstrologer } from '../../api/adminApis';

const AdminAstrologers = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successToast, setSuccessToast] = useState(null);
  const itemsPerPage = 8;

  const [pendingAstrologers, setPendingAstrologers] = useState([]);
  const [activeAstrologers, setActiveAstrologers] = useState([]);
  const [suspendedAstrologers, setSuspendedAstrologers] = useState([]);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const response = await getAdminAstrologers();
      const allAstrologers = response.data?.data?.astrologers || response.data?.astrologers || [];
      
      setPendingAstrologers(allAstrologers.filter(a => a.approvalStatus === 'pending'));
      setActiveAstrologers(allAstrologers.filter(a => a.approvalStatus === 'approved').map(a => ({
        id: a._id,
        name: a.name,
        phone: a.phone || 'N/A',
        rating: a.rating || 0,
        reviews: 0,
        rate: a.pricing?.chat || 20,
        earnings: 0,
        status: a.onlineStatus === 'online' ? 'Online' : 'Offline',
        sessions: 0,
        speciality: a.categories && a.categories.length > 0 ? a.categories.join(', ') : (a.skills && a.skills.length > 0 ? a.skills[0] : 'General'),
        avatar: a.name ? a.name[0] : 'A',
        enabled: a.isVerified,
        raw: a
      })));
      setSuspendedAstrologers(allAstrologers.filter(a => a.approvalStatus === 'rejected').map(a => ({
        id: a._id,
        name: a.name,
        phone: a.phone || 'N/A',
        rating: a.rating || 0,
        reviews: 0,
        reason: 'Rejected by admin',
        suspendedOn: new Date(a.updatedAt).toLocaleDateString(),
        avatar: a.name ? a.name[0] : 'A',
        raw: a
      })));
    } catch (err) {
      console.error('Failed to fetch astrologers:', err);
      showToast('Failed to load astrologers');
    }
  };

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredActive = activeAstrologers.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.speciality.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredActive.length / itemsPerPage);
  const paginatedActive = filteredActive.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ═══ ACTIONS ═══
  const toggleStatus = (id) => {
    setActiveAstrologers(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const approveAstrologer = async (ast) => {
    try {
      await updateAdminAstrologerStatus(ast._id || ast.id, 'approved');
      showToast(`${ast.name} has been approved.`);
      fetchAstrologers();
    } catch (err) {
      showToast(`Failed to approve ${ast.name}`);
    }
  };

  const rejectAstrologer = async (ast) => {
    try {
      await updateAdminAstrologerStatus(ast._id || ast.id, 'rejected');
      showToast(`${ast.name}'s application was rejected.`);
      fetchAstrologers();
    } catch (err) {
      showToast(`Failed to reject ${ast.name}`);
    }
  };

  const suspendAstrologer = async (ast) => {
    try {
      await updateAdminAstrologerStatus(ast._id || ast.id, 'blocked');
      showToast(`${ast.name} has been suspended.`);
      fetchAstrologers();
    } catch (err) {
      showToast(`Failed to suspend ${ast.name}`);
    }
  };

  const reinstateAstrologer = async (ast) => {
    try {
      await updateAdminAstrologerStatus(ast._id || ast.id, 'approved');
      showToast(`${ast.name} has been reinstated.`);
      fetchAstrologers();
    } catch (err) {
      showToast(`Failed to reinstate ${ast.name}`);
    }
  };

  const permanentlyBan = async (ast) => {
    if (window.confirm(`Are you sure you want to permanently delete ${ast.name} from the database? This action cannot be undone.`)) {
      try {
        await deleteAdminAstrologer(ast._id || ast.id || ast.raw?._id);
        showToast(`${ast.name} has been permanently deleted.`);
        fetchAstrologers();
      } catch (err) {
        showToast(`Failed to delete ${ast.name}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* ═══ SUCCESS TOAST ═══ */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[60] animate-slide-down">
          <div className="bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <FiCheck size={16} className="text-white" />
            </div>
            <p className="text-sm font-bold flex-1">{successToast}</p>
            <button onClick={() => setSuccessToast(null)} className="text-gray-400 hover:text-white transition-colors">
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Astrologer Management</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">Approve new applications, manage rates, and monitor performance</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-bold">{activeAstrologers.filter(a => a.status === 'Online').length} Online</span>
          <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold">{pendingAstrologers.length} Pending</span>
        </div>
      </div>

      {/* Dropdown Tabs */}
      <AdminFilterDropdown 
        tabs={['Active', 'Pending Approval', 'Suspended']}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setCurrentPage(1); }}
        tabCounts={{
          'Pending Approval': pendingAstrologers.length,
          'Suspended': suspendedAstrologers.length
        }}
      />

      {/* ═══ ACTIVE ASTROLOGERS TAB ═══ */}
      {activeTab === 'Active' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name or speciality..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Astrologer</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Speciality</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sessions</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Earnings</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active</th>
                    <th className="py-4 px-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedActive.map((ast) => (
                    <tr key={ast.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-100">
                            {ast.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{ast.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{ast.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">{ast.speciality}</span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1">
                          <FiStar size={12} className="text-orange-400 fill-orange-400" />
                          <span className="text-sm font-black text-gray-900">{ast.rating}</span>
                          <span className="text-[10px] text-gray-400 font-medium">({ast.reviews})</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-black text-gray-900">₹{ast.rate}/min</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-bold text-gray-600">{ast.sessions}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-black text-gray-900">₹{ast.earnings.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          ast.status === 'Online' ? 'bg-green-50 text-green-600' :
                          ast.status === 'In Session' ? 'bg-orange-50 text-orange-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {ast.status === 'Online' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {ast.status === 'In Session' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                          {ast.status}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <button onClick={() => toggleStatus(ast.id)} className={`transition-colors ${ast.enabled ? 'text-green-500' : 'text-gray-300'}`}>
                          {ast.enabled ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                        </button>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => suspendAstrologer(ast)} className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1" title="Suspend Astrologer">
                            <FiSlash size={12} />
                          </button>
                          <button onClick={() => permanentlyBan(ast)} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-red-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1" title="Delete Astrologer">
                            <FiX size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedActive.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        No active astrologers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredActive.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400 font-medium">
                  Showing <span className="font-bold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span>-<span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredActive.length)}</span> of <span className="font-bold text-gray-700">{filteredActive.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronLeft size={14} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><FiChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ PENDING APPROVAL TAB ═══ */}
      {activeTab === 'Pending Approval' && (
        <div className="space-y-4">
          {pendingAstrologers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCheck size={28} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">All caught up!</h3>
              <p className="text-sm text-gray-400">No pending applications to review.</p>
            </div>
          ) : (
            pendingAstrologers.map((ast) => (
              <div key={ast._id} className="bg-white rounded-2xl border border-orange-100 p-6 hover:border-orange-200 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center font-black text-xl shrink-0 border border-orange-100">
                      {ast.name ? ast.name[0] : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{ast.name}</h3>
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">New Application</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mb-2">{ast.phone || 'N/A'}</p>
                      <p className="text-xs text-gray-500 font-medium mb-3">{ast.about}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">🔮 {ast.categories?.join(', ') || ast.skills?.join(', ')}</span>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">🗣️ {ast.languages?.join(', ')}</span>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">📅 {ast.experience} Years exp.</span>
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><FiClock size={10} /> Applied {new Date(ast.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ast.identityProof && (
                      <a href={ast.identityProof} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5">
                        <FiEye size={14} /> ID Proof
                      </a>
                    )}
                    <button onClick={() => rejectAstrologer(ast)} className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5">
                      <FiX size={14} /> Reject
                    </button>
                    <button onClick={() => approveAstrologer(ast)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm shadow-green-600/20 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95">
                      <FiCheck size={14} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ SUSPENDED TAB ═══ */}
      {activeTab === 'Suspended' && (
        <div className="space-y-4">
          {suspendedAstrologers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-sm text-gray-400">No suspended astrologers.</p>
            </div>
          ) : (
            suspendedAstrologers.map((ast) => (
              <div key={ast.id} className="bg-white rounded-2xl border border-red-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-black text-lg shrink-0 border border-red-100">
                      {ast.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{ast.name}</p>
                      <p className="text-xs text-gray-400 font-medium">{ast.phone}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Suspended</span>
                        <span className="text-[10px] text-gray-400">{ast.suspendedOn}</span>
                      </div>
                      <p className="text-xs text-red-400 font-medium mt-1">Reason: {ast.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => reinstateAstrologer(ast)} className="px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5">
                      <FiUserCheck size={14} /> Reinstate
                    </button>
                    <button onClick={() => permanentlyBan(ast)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5">
                      <FiSlash size={14} /> Permanently Ban
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAstrologers;

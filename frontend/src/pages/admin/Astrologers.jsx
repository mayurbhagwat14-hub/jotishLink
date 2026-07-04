import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiStar, FiPhone, FiMessageSquare, FiVideo, FiCalendar, FiMoreHorizontal, FiEye, FiChevronDown, FiChevronLeft, FiChevronRight, FiUserCheck, FiClock, FiToggleLeft, FiToggleRight, FiSlash } from 'react-icons/fi';
import AdminFilterDropdown from '../../components/AdminFilterDropdown';
import { getAdminAstrologers, getAdminAstrologerById, updateAdminAstrologerStatus, deleteAdminAstrologer, toggleAdminAstrologerTopVerified } from '../../api/adminApis';

const AdminAstrologers = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [successToast, setSuccessToast] = useState(null);
  const itemsPerPage = 8;

  const [pendingAstrologers, setPendingAstrologers] = useState([]);
  const [activeAstrologers, setActiveAstrologers] = useState([]);
  const [suspendedAstrologers, setSuspendedAstrologers] = useState([]);
  
  const [selectedAstrologer, setSelectedAstrologer] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [deleteConfirmAstrologer, setDeleteConfirmAstrologer] = useState(null);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  useEffect(() => {
    if (selectedAstrologer || deleteConfirmAstrologer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedAstrologer, deleteConfirmAstrologer]);

  const fetchAstrologers = async () => {
    try {
      const response = await getAdminAstrologers();
      const allAstrologers = response.data?.data?.astrologers || response.data?.astrologers || [];
      
      setPendingAstrologers(allAstrologers.filter(a => a.approvalStatus === 'pending'));
      setActiveAstrologers(allAstrologers.filter(a => a.approvalStatus === 'approved').map(a => ({
        id: a._id,
        _id: a._id,
        name: a.name,
        phone: a.phone || 'N/A',
        rating: a.rating || 0,
        reviews: 0,
        rate: a.pricing?.chat || 20,
        earnings: (a.earnings?.total || a.totalEarnings || 0),
        status: a.onlineStatus === 'online' ? 'Online' : 'Offline',
        sessions: (a.totalChats || 0) + (a.totalAudioCalls || 0) + (a.totalVideoCalls || 0),
        speciality: a.categories && a.categories.length > 0 ? a.categories.join(', ') : (a.skills && a.skills.length > 0 ? a.skills[0] : 'General'),
        avatar: a.avatar || '',
        enabled: a.isVerified,
        isTopVerified: a.isTopVerified || false,
        raw: a
      })));
      setSuspendedAstrologers(allAstrologers.filter(a => a.approvalStatus === 'rejected').map(a => ({
        id: a._id,
        _id: a._id,
        name: a.name,
        phone: a.phone || 'N/A',
        rating: a.rating || 0,
        reviews: 0,
        reason: 'Rejected by admin',
        suspendedOn: new Date(a.updatedAt).toLocaleDateString(),
        avatar: a.avatar || '',
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

  const toggleTopVerified = async (ast) => {
    try {
      await toggleAdminAstrologerTopVerified(ast._id || ast.id);
      showToast(`${ast.name} top verified status toggled.`);
      fetchAstrologers();
    } catch (err) {
      showToast(`Failed to toggle top verified for ${ast.name}`);
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

  const permanentlyBan = (ast) => {
    setDeleteConfirmAstrologer(ast);
  };

  const executeDelete = async () => {
    if (!deleteConfirmAstrologer) return;
    const ast = deleteConfirmAstrologer;
    try {
      await deleteAdminAstrologer(ast.id || ast._id);
      showToast('Astrologer deleted permanently');
      fetchAstrologers();
      if (selectedAstrologer && (selectedAstrologer.id === ast.id || selectedAstrologer._id === ast._id)) {
        setSelectedAstrologer(null);
      }
    } catch (err) {
      showToast('Failed to delete astrologer');
    } finally {
      setDeleteConfirmAstrologer(null);
    }
  };

  const viewProfile = async (astId) => {
    setLoadingProfile(true);
    try {
      const res = await getAdminAstrologerById(astId);
      setSelectedAstrologer(res.data?.data?.astrologer || res.data?.astrologer);
    } catch (err) {
      showToast('Failed to load astrologer details');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="space-y-6 relative">

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

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
            <div className="w-full overflow-visible">
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
                    <tr key={ast._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-100 overflow-hidden">
                            <img src={ast.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ast.name || 'A')}&background=ffedD5&color=f97316`} alt={ast.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="font-bold text-sm text-gray-800">{ast.name}</p>
                              {ast.isTopVerified && <FiStar size={12} className="text-yellow-500 fill-yellow-500" title="Top Verified" />}
                            </div>
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
                        <span className="text-sm font-black text-gray-900">₹{ast.pricing?.chat || ast.rate || 5}/min</span>
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
                        <button onClick={() => toggleStatus(ast._id)} className={`transition-colors ${ast.enabled ? 'text-green-500' : 'text-gray-300'}`}>
                          {ast.enabled ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                        </button>
                      </td>
                      <td className={`py-4 px-5 text-right relative ${openActionDropdown === ast._id ? 'z-50' : ''}`}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const isOpening = openActionDropdown !== ast._id;
                            setOpenActionDropdown(isOpening ? ast._id : null);
                            if (isOpening) {
                              const td = e.currentTarget.closest('td');
                              setTimeout(() => {
                                const dropdown = td.querySelector('.action-dropdown-menu');
                                if (dropdown) dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }, 50);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiMoreHorizontal size={18} />
                        </button>

                        {openActionDropdown === ast._id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenActionDropdown(null)} />
                            <div className="action-dropdown-menu absolute right-5 top-12 mt-1 w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden animate-slide-down origin-top-right">
                              <button onClick={() => { viewProfile(ast._id); setOpenActionDropdown(null); }} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-50">
                                <FiEye size={16} className="text-blue-500" /> View Profile
                              </button>
                              <button onClick={() => { toggleTopVerified(ast); setOpenActionDropdown(null); }} className="w-full px-4 py-3 text-left text-sm font-bold text-yellow-600 hover:bg-yellow-50 flex items-center gap-2 transition-colors border-b border-gray-50">
                                <FiStar size={16} className={ast.isTopVerified ? "fill-yellow-600" : ""} /> {ast.isTopVerified ? "Remove Featured" : "Feature on Home"}
                              </button>
                              <button onClick={() => { suspendAstrologer(ast); setOpenActionDropdown(null); }} className="w-full px-4 py-3 text-left text-sm font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors border-b border-gray-50">
                                <FiSlash size={16} /> Suspend
                              </button>
                              <button onClick={() => { permanentlyBan(ast); setOpenActionDropdown(null); }} className="w-full px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                <FiX size={16} /> Delete
                              </button>
                            </div>
                          </>
                        )}
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
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center font-black text-xl shrink-0 border border-orange-100 overflow-hidden">
                      <img src={ast.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ast.name || 'A')}&background=ffedD5&color=f97316`} alt={ast.name} className="w-full h-full object-cover" />
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
                    <button onClick={() => viewProfile(ast._id)} disabled={loadingProfile} className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                      {loadingProfile ? <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> : <FiEye size={14} />}
                      Profile View
                    </button>
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
              <div key={ast._id} className="bg-white rounded-2xl border border-red-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-black text-lg shrink-0 border border-red-100 overflow-hidden">
                      <img src={ast.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ast.name || 'A')}&background=fef2f2&color=ef4444`} alt={ast.name} className="w-full h-full object-cover" />
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
                    <button onClick={() => viewProfile(ast.id || ast._id)} disabled={loadingProfile} className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                      {loadingProfile ? <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" /> : <FiEye size={14} />} View Profile
                    </button>
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
      {/* ═══ PROFILE VIEW MODAL ═══ */}
      {selectedAstrologer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedAstrologer(null)} />
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-gray-100 flex items-center justify-between z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg overflow-hidden border border-orange-100">
                  <img src={selectedAstrologer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedAstrologer.name)}&background=ffedD5&color=f97316`} alt={selectedAstrologer.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAstrologer.name}</h2>
                  <p className="text-sm font-medium text-gray-500">{selectedAstrologer.phone} • {selectedAstrologer.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAstrologer(null)} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full flex items-center justify-center transition-colors">
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              
              {/* Grid 1: Personal & Professional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Details */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Personal Details</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-400 font-bold w-24 inline-block">DOB:</span> <span className="font-medium text-gray-700">{selectedAstrologer.dob || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">Gender:</span> <span className="font-medium text-gray-700">{selectedAstrologer.gender || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">Address:</span> <span className="font-medium text-gray-700">{selectedAstrologer.address || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">City/State:</span> <span className="font-medium text-gray-700">{selectedAstrologer.city}, {selectedAstrologer.state} - {selectedAstrologer.pincode}</span></p>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b border-orange-200 pb-2">Professional Summary</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-400 font-bold w-28 inline-block">Experience:</span> <span className="font-medium text-gray-700">{selectedAstrologer.experience} Years</span></p>
                    <p><span className="text-gray-400 font-bold w-28 inline-block">Education:</span> <span className="font-medium text-gray-700">{selectedAstrologer.education || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-28 inline-block">Style:</span> <span className="font-medium text-gray-700">{selectedAstrologer.consultationStyle || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-28 inline-block">Languages:</span> <span className="font-medium text-gray-700">{selectedAstrologer.languages?.join(', ') || 'N/A'}</span></p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(selectedAstrologer.skills || selectedAstrologer.categories || []).map(skill => (
                        <span key={skill} className="px-2 py-1 bg-white border border-orange-200 rounded text-[10px] font-bold text-orange-600 uppercase">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Pricing & Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pricing Details */}
                <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b border-green-200 pb-2">Pricing Setup</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-green-50 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Chat Rate</p>
                      <p className="font-black text-green-600 text-lg">₹{selectedAstrologer.pricing?.chat || 5}/min</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-green-50 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Audio Call</p>
                      <p className="font-black text-green-600 text-lg">₹{selectedAstrologer.pricing?.audioCall || 5}/min</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-green-50 text-center shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Video Call</p>
                      <p className="font-black text-green-600 text-lg">₹{selectedAstrologer.pricing?.videoCall || 10}/min</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b border-blue-200 pb-2">Bank Information</h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="text-gray-400 font-bold w-24 inline-block">Account Name:</span> <span className="font-medium text-gray-700">{selectedAstrologer.bankDetails?.accountHolderName || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">Bank Name:</span> <span className="font-medium text-gray-700">{selectedAstrologer.bankDetails?.bankName || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">A/C Number:</span> <span className="font-medium text-gray-700">{selectedAstrologer.bankDetails?.accountNumber || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">IFSC Code:</span> <span className="font-medium text-gray-700">{selectedAstrologer.bankDetails?.ifscCode || 'N/A'}</span></p>
                    <p><span className="text-gray-400 font-bold w-24 inline-block">UPI ID:</span> <span className="font-medium text-gray-700">{selectedAstrologer.bankDetails?.upiId || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Verification Documents</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Aadhaar Front', doc: selectedAstrologer.aadhaarFront },
                    { label: 'Aadhaar Back', doc: selectedAstrologer.aadhaarBack },
                    { label: 'PAN Card', doc: selectedAstrologer.panCard },
                    { label: 'Certificate', doc: selectedAstrologer.certificate },
                    { label: 'Selfie', doc: selectedAstrologer.selfieVerification },
                    { label: 'Legacy ID', doc: selectedAstrologer.identityProof }
                  ].map((item, idx) => item.doc ? (
                    <a key={idx} href={item.doc} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-gray-200 aspect-square bg-gray-50">
                      {item.doc.endsWith('.pdf') ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                          <span className="font-black text-xl mb-1">PDF</span>
                          <span className="text-[10px] text-gray-500">Document</span>
                        </div>
                      ) : (
                        <img src={item.doc} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center text-white text-[10px] font-bold backdrop-blur-sm">
                        {item.label}
                      </div>
                    </a>
                  ) : null)}
                </div>
              </div>

            </div>
            
            {/* Footer Action Buttons if pending */}
            {selectedAstrologer.approvalStatus === 'pending' && (
              <div className="sticky bottom-0 bg-gray-50 px-8 py-6 border-t border-gray-200 flex items-center justify-end gap-3 z-20">
                <button onClick={() => { setSelectedAstrologer(null); rejectAstrologer(selectedAstrologer); }} className="px-6 py-3 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition-colors font-bold flex items-center gap-2">
                  <FiX size={16} /> Reject Application
                </button>
                <button onClick={() => { setSelectedAstrologer(null); approveAstrologer(selectedAstrologer); }} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/30 transition-all font-black flex items-center gap-2">
                  <FiCheck size={16} /> Approve Astrologer
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      {deleteConfirmAstrologer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmAstrologer(null)} />
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-2xl p-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiX size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Astrologer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to permanently delete <b className="text-gray-800">{deleteConfirmAstrologer.name}</b> from the database? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmAstrologer(null)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAstrologers;

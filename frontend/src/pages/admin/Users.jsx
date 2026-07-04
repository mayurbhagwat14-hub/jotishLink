import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiUserX, FiUserCheck, FiMoreHorizontal, FiMail, FiPhone, FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiEye, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { fetchAdminUsersThunk, updateAdminUserStatusThunk, deleteAdminUserThunk, localBanUser, localUnbanUser, refundAdminUserThunk } from '../../store/slices/adminSlice';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, totalPages: serverTotalPages, totalUsers, loading, error } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [detailUser, setDetailUser] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const itemsPerPage = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAdminUsersThunk({ page: currentPage, limit: itemsPerPage, search: searchQuery, status: statusFilter }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchQuery, statusFilter]);

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const totalPages = serverTotalPages || 1;
  const paginatedUsers = users;

  const toggleSelectAll = () => {
    if (selectedUsers.length === (paginatedUsers || []).length && (paginatedUsers || []).length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers((paginatedUsers || []).map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const banUser = (userId) => {
    dispatch(localBanUser(userId));
    dispatch(updateAdminUserStatusThunk({ id: userId, status: 'Banned' }));
    showToast(`User banned successfully.`);
    if (detailUser && detailUser.id === userId) {
      setDetailUser(prev => ({ ...prev, status: 'Banned' }));
    }
  };

  const unbanUser = (userId) => {
    dispatch(localUnbanUser(userId));
    dispatch(updateAdminUserStatusThunk({ id: userId, status: 'Active' }));
    showToast(`User access restored.`);
    if (detailUser && (detailUser.id === userId || detailUser._id === userId)) {
      setDetailUser(prev => ({ ...prev, status: 'Active' }));
    }
  };

  const deleteUser = (user) => {
    setDeleteConfirmUser(user);
  };

  const executeDelete = () => {
    if (!deleteConfirmUser) return;
    dispatch(deleteAdminUserThunk(deleteConfirmUser.id || deleteConfirmUser._id));
    showToast('User permanently deleted from database.');
    if (detailUser && (detailUser.id === deleteConfirmUser.id || detailUser._id === deleteConfirmUser._id)) {
      setDetailUser(null);
    }
    setDeleteConfirmUser(null);
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">View wallets, sessions, and manage access for all platform users</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold">{users.length} Total</span>
          <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-bold">{users.filter(u => (u.status || (u.isBlocked ? 'Banned' : 'Active')) === 'Active').length} Active</span>
          <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold">{users.filter(u => (u.status || (u.isBlocked ? 'Banned' : 'Active')) === 'Banned').length} Banned</span>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-sm font-medium transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="appearance-none px-4 py-3 pr-10 rounded-xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-bold text-gray-700 cursor-pointer"
          >
            <option>All</option>
            <option>Active</option>
            <option>Banned</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="w-full overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Wallet</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sessions</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(paginatedUsers || []).map((user) => {
                const uStatus = user.status || (user.isBlocked ? 'Banned' : 'Active');
                const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
                const lastActive = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A';
                
                return (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 ${
                        uStatus === 'Banned' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                          (user.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className={`font-bold text-[13px] ${uStatus === 'Banned' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{user.name || 'Guest User'}</p>
                        <p className="text-[9px] text-gray-400 font-medium">Last active: {lastActive}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1"><FiPhone size={10} /> {user.phone}</p>
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5"><FiMail size={10} /> {user.email || 'N/A'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-black text-[13px] text-gray-900">₹{(user.wallet || 0).toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[13px] font-bold text-gray-600">{user.sessions || 0}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1"><FiCalendar size={10} /> {joinedDate}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                      uStatus === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {uStatus}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right relative ${openActionDropdown === user._id ? 'z-50' : ''}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const isOpening = openActionDropdown !== user._id;
                        setOpenActionDropdown(isOpening ? user._id : null);
                        if (isOpening) {
                          const td = e.currentTarget.closest('td');
                          setTimeout(() => {
                            const dropdown = td.querySelector('.action-dropdown-menu');
                            if (dropdown) {
                              dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                          }, 50);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMoreHorizontal size={18} />
                    </button>

                    {openActionDropdown === user._id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenActionDropdown(null)} />
                        <div className="action-dropdown-menu absolute right-5 top-10 mt-1 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden animate-slide-down origin-top-right text-left">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailUser(user); setOpenActionDropdown(null); }}
                            className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                          >
                            <FiEye size={14} className="text-blue-500" /> View Profile
                          </button>
                          {uStatus === 'Active' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); banUser(user._id); setOpenActionDropdown(null); }}
                              className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                            >
                              <FiUserX size={14} /> Ban User
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); unbanUser(user._id); setOpenActionDropdown(null); }}
                              className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors border-b border-gray-50"
                            >
                              <FiUserCheck size={14} /> Unban User
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteUser(user); setOpenActionDropdown(null); }}
                            className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <FiX size={14} /> Delete User
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
                );
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(paginatedUsers || []).length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, totalUsers || (paginatedUsers || []).length)}</span> of <span className="font-bold text-gray-700">{totalUsers || (paginatedUsers || []).length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
              ><FiChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                    currentPage === page
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >{page}</button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
              ><FiChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ COMPREHENSIVE USER DETAIL MODAL ═══ */}
      {detailUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setDetailUser(null)}>
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">User Profile</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Detailed information and platform metrics</p>
              </div>
              <button onClick={() => setDetailUser(null)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-8 flex-1 bg-gray-50/30">
              
              {/* Top Banner & Basic Info */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-sm mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-4xl shrink-0 ${
                  detailUser.isBlocked ? 'bg-red-50 text-red-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                }`}>
                  {detailUser.avatar ? (
                    <img src={detailUser.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    detailUser.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h4 className="text-2xl font-bold text-gray-900">{detailUser.name || 'Guest User'}</h4>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider justify-center ${
                      detailUser.isBlocked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {detailUser.isBlocked ? 'Banned' : 'Active'}
                    </span>
                    {detailUser.isNewUser && (
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100 justify-center">
                        New User
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-500 font-medium text-sm mt-3">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <FiMail size={16} /> {detailUser.email || 'N/A'}
                    </div>
                    <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <FiPhone size={16} /> {detailUser.phone || 'N/A'}
                    </div>
                    <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <FiCalendar size={16} /> Joined: {new Date(detailUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Personal Information */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Personal Details
                  </h5>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                      <p className="text-[15px] font-bold text-gray-800">{detailUser.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</p>
                      <p className="text-[15px] font-bold text-gray-800">{detailUser.dob || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time of Birth</p>
                      <p className="text-[15px] font-bold text-gray-800">{detailUser.timeOfBirth || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Place of Birth</p>
                      <p className="text-[15px] font-bold text-gray-800">{detailUser.placeOfBirth || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Location Details
                  </h5>
                  <div className="grid grid-cols-1 gap-y-6">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                      <p className="text-[15px] font-bold text-gray-800 leading-relaxed">{detailUser.address || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">City</p>
                        <p className="text-[15px] font-bold text-gray-800">{detailUser.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pincode</p>
                        <p className="text-[15px] font-bold text-gray-800">{detailUser.pincode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Platform Metrics */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Platform Metrics
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                    <p className="text-xl font-black text-gray-900">₹{(detailUser.wallet || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
                    <p className="text-xl font-black text-gray-900">₹{(detailUser.totalSpent || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Free Chat Used</p>
                    <p className={`text-sm font-bold mt-1 inline-flex px-2 py-0.5 rounded-lg ${detailUser.freeChatUsed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {detailUser.freeChatUsed ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Active</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">{detailUser.lastActive ? new Date(detailUser.lastActive).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

            </div>


          </div>
        </div>
      )}
      {/* ═══ REFUND MODAL ═══ */}
      {refundModal && detailUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setRefundModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Refund Wallet</h3>
            <p className="text-sm text-gray-500 mb-4">Refunding to <b>{detailUser.name}</b></p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  value={refundAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') return setRefundAmount('');
                    const num = Number(val);
                    if (!isNaN(num) && num >= 0) setRefundAmount(num);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-bold"
                  placeholder="e.g. 50"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason</label>
                <input 
                  type="text" 
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                  placeholder="e.g. Chat failed"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setRefundModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >Cancel</button>
                <button 
                  disabled={!refundAmount || !refundReason}
                  onClick={() => {
                    dispatch(refundAdminUserThunk({ id: detailUser.id || detailUser._id, data: { amount: Number(refundAmount), reason: refundReason } }));
                    setRefundModal(false);
                    setRefundAmount('');
                    setRefundReason('');
                    showToast('Refund initiated successfully!');
                    
                    // Update detail user wallet optimistically
                    setDetailUser(prev => ({
                      ...prev,
                      wallet: prev.wallet + Number(refundAmount)
                    }));
                  }}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                >Refund</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ═══ DELETE CONFIRM MODAL ═══ */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmUser(null)} />
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-2xl p-6 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiX size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to permanently delete <b className="text-gray-800">{deleteConfirmUser.name}</b> from the database? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
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

export default AdminUsers;

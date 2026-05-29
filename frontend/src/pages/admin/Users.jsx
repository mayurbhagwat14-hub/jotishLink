import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiUserX, FiUserCheck, FiMoreHorizontal, FiMail, FiPhone, FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiEye, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { fetchAdminUsersThunk, updateAdminUserStatusThunk, localBanUser, localUnbanUser } from '../../store/slices/adminSlice';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [detailUser, setDetailUser] = useState(null);
  const [successToast, setSuccessToast] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchAdminUsersThunk());
  }, [dispatch]);

  const showToast = (message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone.includes(searchQuery) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
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
    if (detailUser && detailUser.id === userId) {
      setDetailUser(prev => ({ ...prev, status: 'Active' }));
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">View wallets, sessions, and manage access for all platform users</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold">{users.length} Total</span>
          <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-bold">{users.filter(u => u.status === 'Active').length} Active</span>
          <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold">{users.filter(u => u.status === 'Banned').length} Banned</span>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
                  />
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Wallet</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sessions</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer accent-orange-500"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        user.status === 'Banned' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {user.avatar}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${user.status === 'Banned' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Last active: {user.lastActive}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1"><FiPhone size={10} /> {user.phone}</p>
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5"><FiMail size={10} /> {user.email}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-black text-sm text-gray-900">₹{user.wallet.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold text-gray-600">{user.sessions}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><FiCalendar size={10} /> {user.joined}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDetailUser(user)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                      >
                        <FiEye size={12} /> View
                      </button>
                      {user.status === 'Active' ? (
                        <button
                          onClick={() => banUser(user.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                        >
                          <FiUserX size={12} /> Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => unbanUser(user.id)}
                          className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                        >
                          <FiUserCheck size={12} /> Unban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-700">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-gray-700">{filteredUsers.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 text-xs font-bold"
              >|&lt;</button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
              ><FiChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                <button
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30"
              ><FiChevronRight size={14} /></button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30 text-xs font-bold"
              >&gt;|</button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ USER DETAIL MODAL ═══ */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetailUser(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">User Details</h3>
              <button onClick={() => setDetailUser(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${
                  detailUser.status === 'Banned' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                }`}>{detailUser.avatar}</div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{detailUser.name}</h4>
                  <p className="text-sm text-gray-400 font-medium">{detailUser.email}</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    detailUser.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>{detailUser.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Wallet Balance', value: `₹${detailUser.wallet.toLocaleString()}` },
                  { label: 'Total Spent', value: `₹${detailUser.totalSpent.toLocaleString()}` },
                  { label: 'Total Sessions', value: detailUser.sessions },
                  { label: 'Joined', value: detailUser.joined },
                  { label: 'Phone', value: detailUser.phone },
                  { label: 'Last Active', value: detailUser.lastActive },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm font-bold text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <FiEdit size={14} /> Edit Wallet
                </button>
                {detailUser.status === 'Active' ? (
                  <button
                    onClick={() => banUser(detailUser.id)}
                    className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FiUserX size={14} /> Ban User
                  </button>
                ) : (
                  <button
                    onClick={() => unbanUser(detailUser.id)}
                    className="flex-1 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FiUserCheck size={14} /> Unban User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
